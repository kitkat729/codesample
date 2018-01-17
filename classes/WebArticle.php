<?php defined('SYSPATH') or die('No direct script access.');
/** This is the base class for all web articles
 */
class WebArticle extends Article {

	public $template;

	public function __construct(iArticleProvider $provider = NULL) {
		parent::__construct($provider);

		$this->props['canonical_url'] = '';

		if ($provider) {
			$this->props['canonical_url'] = $this->url;
			$this->props['guid'] = $this->canonical_url;

			if (empty($this->props['authors'])) {
				$author = new stdClass;
				$author->id = NULL;
				$author->first_name = '';
				$author->last_name = '';
				$author->title = '';
				$author->display_name = 'The Editors';
				$author->email = 'editorial@insidehook.com';

				$this->props['authors'][] = $author;
			}
		}

		ksort($this->props);

		$this->template = new stdClass;
		$this->template->view = '';
	}

	public function render() {
		if (!$this->template->view) {
			throw new Exception(__class__ . ' template view is not set properly');
		}

		$content = View::factory($this->template->view)
							->set('article', $this)
							->render();

		return $content;
	}
}