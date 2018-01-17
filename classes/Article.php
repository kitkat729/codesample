<?php defined('SYSPATH') or die('No direct script access.');

abstract class Article {
	protected $props = array();

	public function __construct(iArticleProvider $provider = NULL) {
		// define and initialize props
		$this->props['id'] = '';
		$this->props['url'] = '';
		$this->props['title'] = '';
		$this->props['subtitle'] = '';
		$this->props['body'] = '';	// html body
		$this->props['edition'] = NULL;	// object
		$this->props['available_editions'] = [];	// array of objects
		$this->props['authors'] = [];	// array of objects
		$this->props['categories'] = []; // array of objects
		$this->props['excerpt'] = '';
		$this->props['synopsis'] = '';
		$this->props['feature_media'] = NULL;

		$this->props['date_modified'] = '';
		$this->props['date_created'] = '';
		$this->props['date_published'] = '';
		$this->props['tags'] = [];
		$this->props['meta'] = [];
		$this->props['sponsor'] = NULL;

		if ($provider) {
			$this->id = $provider->articleId();
			$this->url = $provider->articleUrl();
			$this->title = $provider->articleHeadline();
			$this->subtitle = $provider->articleAlternativeHeadline();
			// $this->body = $provider->articleBody(); // lazy load
			$this->edition = $provider->articleEdition();
			$this->available_editions = $provider->articleAvailableEditions();
			$this->authors = $provider->articleAuthors();
			$this->categories = $provider->articleCategories();
			//$this->excerpt = $provider->articleExcerpt(); // lazy load
			//$this->synopsis = $provider->articleSynopsis(); // lazy load
			$this->feature_media = $provider->articleFeatureMedia();
			$this->date_created = $provider->articleDateCreated();
			$this->date_modified = $provider->articleDateModified();
			$this->date_published = $provider->articleDatePublished();
			$this->tags = $provider->articleTags();
			$this->meta = $provider->articleMetaSocial();
			$this->sponsor = $provider->articleSponsorInformation();
		}
		ksort($this->props);
	}

	public function __set($name, $value)
	{
		if (property_exists($this, $name) && !in_array($name, array('props'))) {
			$this->{$name} = $value;
			return;
		}

		if (!array_key_exists($name, $this->props)) {
			$trace = debug_backtrace();
			trigger_error(
			    'Invalid property via __set(): ' . $name .
			    ' in ' . $trace[0]['file'] .
			    ' on line ' . $trace[0]['line'],
			    E_USER_NOTICE);
		}

		$this->props[$name] = $value;
	}

	public function __get($name)
	{
		if (property_exists($this, $name) && !in_array($name, array('props'))) {
			return $this->{$name};
		}

		if (array_key_exists($name, $this->props)) {
			return $this->props[$name];
		}

		$trace = debug_backtrace();
		trigger_error(
		    'Undefined property via __get(): ' . $name .
		    ' in ' . $trace[0]['file'] .
		    ' on line ' . $trace[0]['line'],
		    E_USER_NOTICE);

		return null;
	}

	public function isValid() {
		if ($this->id && $this->title && $this->feature_media && $this->body && $this->date_published) {
			return true;
		}
		return false;
	}

	public function __toString() {
			return var_export($this->props, true);
	}
}