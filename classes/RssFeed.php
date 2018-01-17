<?php defined('SYSPATH') or die('No direct script access.');

abstract class RssFeed {

  static $content_types = array(
        'rss'  => 'application/rss+xml',
        'rss2' => 'application/rss+xml',
        'atom' => 'application/atom+xml',
        'rdf'  => 'application/rdf+xml',
        'xml' => 'text/xml'
    );

  /* @var RSS2 channel element object */
  public $channel = NULL;

  public $type = '';
  public $content_type = '';
  public $charset = '';
  public $limit = 10;
  public $view = '';
  public $items = array();
  public $invalid_items = array();
  public $id = '';
  public $minified = false;

  public function __construct($url){
    $this->channel = new stdClass;

    // @link http://www.rssboard.org/rss-specification#requiredChannelElements
    // required
    $this->channel->link = $url;
    $this->channel->title = 'Rss feed title';
    $this->channel->description = 'Rss feed description';
    $this->channel->ttl = "60"; // ttl stands for time to live. It's a number of minutes that indicates how long a channel can be cached before refreshing from the source
  }

  /**
   * Execute items feeding from source
   */
  public function fetch() {
    $this->setItems();

    if (!empty($this->items)) {
      $this->channel->last_modified = $this->items[0]->date_modified;  // Use most recent item's modified_date vs current time??
    }
  }

  /**
   * Return Rss xml as string
   */
  public function render() {
    if (!$this->view) {
      throw new Exception(__class__ . ' requires a view template to render its content');
    }

    $rss = View::factory($this->view)
              ->set('feed', $this)
              ->render();

    if ($this->minified) {
      $rss = HTML::minifyMarkup($rss);
    }

    return $rss;
  }

  protected function setItems() {
    $this->items = [];
  }

  public function __toString() {
      return $this->render();
  }

  public function __destruct() {
    unset($this->items);
  }
}
