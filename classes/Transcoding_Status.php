<?php defined('SYSPATH') or die('No direct script access.');

require_once(DOCROOT .'vendor/autoload.php');
use Aws\Common\Aws;

class Controller_Api_Transcoding_Status extends Controller_Api_Rest {
	protected $aws;
	protected $sns;

	public static $job_states = [
		'progressing' => 'PROGRESSING',
		'completed' => 'COMPLETED',
		'warning' => 'WARNING',
		'error' => 'ERROR'
	];

	public function before()
	{
		Debugtoolbar::disable();

		if (!$this->isValidRequest()) {
			throw new HTTP_Exception_400('Invalid API credentials');
		}

		$this->_action_requested = $this->request->action();

		$method = Arr::get($_SERVER, 'HTTP_X_HTTP_METHOD_OVERRIDE', $this->request->method());

		if($this->request->param('id')){
			switch($this->request->param('id')){
				default:
					$sections = explode('/', $this->request->param('id'));
					if(count($sections) == 2){
						switch($sections[0]){
							case 'media': $method = $method . '_media_id';
										break;
							case 'job': $method = $method . '_job_id';
										break;
							default:
								$method = 'error';
						}
					}
					else{
						$method = $method . '_id';
					}
			}
		}

		$this->request->action($method);

		if ($this->request->method() == Request::PUT)
		{
			parse_str($this->request->body(), $post);
		
			$this->request->post($post);
		}

		$this->aws = Aws::factory(APPPATH.'config/aws.php');
		$this->sns = $this->aws->get('sns');
	}

	public function action_error() {
		echo json_encode(['success' => false, 'error' => 'Resource not found']);
	}


	/**
	 * Queries a job status by the media id in the database table
	 *
	 * @access	public
	 * @return	void
	 */
	public function action_get_media_id()
	{
		$sections = explode('/', $this->request->param('id'));
		$id = $sections[1];

		$data = [];
		$success = false;
		$error = '';

		$jobs = ORM::factory('TranscodingJob')
			->where('image_id', '=', $id)
			->find_all();

		foreach ($jobs as $job) {
			$obj = new stdClass;
			$obj->Key = $job->filename;
			$obj->Status = strtolower($job->status);
			$obj->jobId = $job->job_id;

			$data[] = $obj;
		}

		if ($data) {
			$success = true;
		} else {
			$error = "Transcoded media not found.";
		}

		$o = [
			'success' => $success,
			'data' => $data,
			'error' => $error,
			'id' => $id
		];

		echo json_encode($o);
	}

	/**
	 * Queries a job status by the job id in the database table
	 */
	public function action_get_job_id()
	{
		$sections = explode('/', $this->request->param('id'));
		$id = $sections[1];

		$data = [];
		$success = false;
		$error = '';

		$jobs = ORM::factory('TranscodingJob')
			->where('job_id', '=', $id)
			->find_all();

		foreach ($jobs as $job) {
			$obj = new stdClass;
			$obj->Key = $job->filename;
			$obj->Status = strtolower($job->status);
			$obj->jobId = $job->job_id;

			$data[] = $obj;
		}

		if ($data) {
			$success = true;
		} else {
			$error = "Transcoded media not found.";
		}

		$o = [
			'success' => $success,
			'data' => $data,
			'error' => $error,
			'id' => $id
		];

		echo json_encode($o);
	}

	public function action_get_id()
	{
		// Get a record by row id.
		// Get all records. Not implemented.
		$o = [
			'success' => false,
			'error' => "Not implemented"
		];

		echo json_encode($o);
	}

	public function action_get()
	{
		// Get all records. Not implemented.
		$o = [
			'success' => false,
			'error' => "Not implemented"
		];

		echo json_encode($o);
	}

	public function action_post()
	{
		try {
			parse_str($this->request->body(), $post);
			$json = file_get_contents('php://input');
			$obj = json_decode($json);

			$headers = array();
			foreach ($_SERVER as $key => $value) {
			    if (strpos($key, 'HTTP_') === 0) {
			        $headers[str_replace(' ', '', ucwords(str_replace('_', ' ', strtolower(substr($key, 5)))))] = $value;
			    }
			}

			if (isset($headers['XAmzSnsMessageType'])) {
				switch($headers['XAmzSnsMessageType']){
					case 'SubscriptionConfirmation':
						// Process a one time subscription confirmation
						if (isset($headers['XAmzSnsTopicArn'])) {
							$model = $this->sns->confirmSubscription(array(
							    'TopicArn' => $headers['XAmzSnsTopicArn'],
							    'Token' => $obj->Token,
							    'AuthenticateOnUnsubscribe' => 'false',	// ('true', 'false') Note: set to true only if the subscriber wants nobody else to unsubscribe itself from the topic othen than the subscriber itself or the owner. if true an AWS signature of the subscriber is required to unsubscribe.
							));

							$subscriptionArn = $model->get('SubscriptionArn');	// store this value along with the job id
						}
						exit;

						break;
					case 'UnsubscribeConfirmation':

						break;
					case 'Notification':
						$info = json_decode($obj->Message);
						switch ($info->state) {
							case Controller_Api_Transcoding_Status::$job_states['completed']:
								// Update source media attributes where those attributes are available after job completed.
								$transcoder = $this->aws->get('elastictranscoder');
								$model = $transcoder->readJob(array(
								    // Id is required
								    'Id' => $info->jobId
								));
								$job = $model->get('Job');
								$media = ORM::factory('Image')->where('filename', '=', $job['Input']['Key'])->find();
								$media->width = isset($job['Input']['DetectedProperties']['Width']) ? $job['Input']['DetectedProperties']['Width'] : 0;
								$media->height = isset($job['Input']['DetectedProperties']['Height']) ? $job['Input']['DetectedProperties']['Height'] : 0;
								$media->save();

								$this->update($info, Model_TranscodingJob::$output_statuses['completed']);
								break;
							case Controller_Api_Transcoding_Status::$job_states['progressing']:
								$this->update($info, Model_TranscodingJob::$output_statuses['progressing']);
								break;
							case Controller_Api_Transcoding_Status::$job_states['warning']:
								$this->update($info, Model_TranscodingJob::$output_statuses['warning']);
								break;
							case Controller_Api_Transcoding_Status::$job_states['error']:
								$this->update($info, Model_TranscodingJob::$output_statuses['error']);
								break;
						}
						break;
				}
			}

			$this->_render(array(
				'ok' => true,
				'obj' => $obj,
				'headers' => $headers
			));
		} catch (Exception $e) {
			error_log('[API] Transcoding status endpoint: ' . $e->getMessage());
		}
		return;
	}

	protected function update($info, $status) {
		foreach ($info->outputs as $newMedia) {
			if ($newMedia->status == $status) {
				$job = ORM::factory('TranscodingJob')
						->where('job_id', '=', $info->jobId)
						->where('output_id', '=', $newMedia->id)
						->find();
				
				if ($job->loaded()) {
					$job->status = $status;
					$job->attributes = json_encode($newMedia);
					$job->save();
				}
			}
		}
	}
}