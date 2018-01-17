<?php defined('SYSPATH') or die('No direct script access.');

/* RssFeed 2.0 implementation */

class ArticleRssFeed extends RssFeed {
	private $options = [];

	public function __construct($url, $options = []){
		parent::__construct($url);

		$this->content_type = RssFeed::$content_types['rss2'];
		$this->charset = 'UTF-8';
		$this->view = 'rss/articles';
		$this->options = $options;

		if (!empty($this->options['params']['format'])) {
			$this->content_type = RssFeed::$content_types[$this->options['params']['format']];
		}

		$this->channel->title = 'InsideHook' . (isset($this->options['params']['edition']) ? ' - ' . ucwords(str_replace('-', ' ', $this->options['params']['edition'])) : ' - Latest');
		$this->channel->description = 'InsideHook: The Essential Guide for Adventurous and Discerning Men. We’re serious about your free time.';

		// additional (optional)
		$this->channel->language = 'en-us';
		$this->channel->copyright = 'Copyright '.date('Y', time()).' Insidehook';
		$this->channel->docs = 'http://www.rssboard.org/rss-2-0';
		$this->channel->webMaster = 'it-purchasing@insidehook.com (IH Tech Team)';
		$this->channel->managingEditor = 'tips@insidehook.com (The Editors)';

		// GIF, JPEG or PNG image. Maximum value for width is 144, default value is 88. Maximum value for height is 400, default value is 31
		$this->channel->logo = new stdClass;
		$this->channel->logo->src = 'https://s3.insidehook.com/IH_Main_Logo_1467233732.png';
		$this->channel->logo->title = $this->channel->title;
		$this->channel->logo->link = $this->channel->link;

	}

	private function convertItems() {
		$valid_items = [];

		foreach ($this->items as $item) {
			if ($item instanceof iArticleProvider) {
				$article = new IhArticle($item);

				if ($article->isValid()) {
					$valid_items[] = $article;
				} else {
					$this->invalid_items[] = $article;
				}
			}
		}

		$this->items = $valid_items;
	}

	/* Populates feed items when fetch() is called */
  protected function setItems() {
    $client = new IHArticleSolrClient;
	$client->setReturnFields('id, id_i, primarytitle_s, edition, available_editions, categories, tags, last_modified, publishts_dt, score');

    $filters = array();
    $param = array();
    $order_by = array();
    $limit = $this->limit;

    $filters['types'] = ['issue', 'feature'];
    $filters['clone'] = 0;
    $filters['type_ss'] = ['web'];

	if ($this->id) {
		$arr = explode(",", $this->id);
		$filters['id'] = implode(' OR ', $arr);
	}

	if (!empty($this->options['params']['edition'])) {
		$filters['available_editions'] = [$this->options['params']['edition']];
	}

    $order_by = array(
          ['dispatch_datetime', SolrQuery::ORDER_DESC],
          ['publishts_dt', SolrQuery::ORDER_DESC],
          ['score', SolrQuery::ORDER_DESC]
        );

    if (Kohana::$environment !== Kohana::PRODUCTION)
      $client->setDebug(true);

    $result = $client->getArticles( $param, $filters, $limit, 0, $order_by);

    if ($client->debug_data) {
      $query_params = $client->debug_data;
    } else {
      $query_params = null;
    }

    $this->items = $result;
    $this->convertItems();

  }
}
