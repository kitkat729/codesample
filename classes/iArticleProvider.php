<?php defined('SYSPATH') or die('No direct script access.');

// schema based on https://schema.org/Article
interface iArticleProvider {
	/** Html body string */
	public function articleBody();

	/** Id string */
	public function articleId();

	/**
	 * Array of author objects
	 *
	 * Description of an authro object
	 * $author = new stdClass;
   * $author->id Author id string
   * $author->first_name Author first name string
   * $author->last_name Author last name string
   * $author->title Author title string
   * $author->display_name Author display name string
	 */
	public function articleAuthors();

	/** Headline string */
	public function articleHeadline();

	/** Alternative headline string */
	public function articleAlternativeHeadline();

	/** Absolute url string */
	public function articleUrl();

	/** Shortened url string */
	public function articleShortenedUrl();

	/** Created date string ISO 8601 format */
	public function articleDateCreated();

	/** Last modifed date string ISO 8601 format */
	public function articleDateModified();

	/** First published date string ISO 8601 format */
	public function articleDatePublished();

	/**
	 * Array of category objects
	 *
	 * Description of a category object
	 * $cat = new stdClass;
   * $cat->name Category name string
   * $cat->slug Category slug
   * $cat->ancestors = array($ancestor_cat1,...,$ancestor_catN) where an ancestor category is a $cat object
	 */
	public function articleCategories();

	/** Content excerpt. First $word_count number of words from the content followed by ellipsis */
	public function articleExcerpt($word_count);

	/** Custom content summary */
	public function articleSynopsis();

	/**
	 * Media object. The object may contain an image object, a video object or both if fallback is used.
	 *
	 * Description of a media object
	 * $media = new stdClass;
	 *
	 * Description of a video object if defined
	 * $media->video = new stdClass;
	 * $media->video->type Type of video: embeddedvideo, html5video
	 * $media->video->base_uri Video url without an extension and querystring params
	 * $media->video->attributes Video config attributes
	 *
	 * If html5 video
	 * $media->video->sources Array of source objects
	 *
	 * Description of a source object
	 * $source = new stdClass;
   * $source->src Source url
   * $source->type Source mime-type
   * $source->order Source sequential order in array
	 *
	 * Description of an image object if defined
	 * $media->image = new stdClass;
	 * media->image->item_url Image clickthrough url
   * $media->image->large_image Image url for large screen
   * $media->image->small_image Image url for small screen
   * $media->image->mobile_image Image url for mobile screen
   * $media->image->default_image Default image url
	 */
	public function articleFeatureMedia();

	/** Edition under which the article is initially created
	 *
	 * Description of an edition object
	 * $edition = new stdClass;
   * $edition->id Edition id string
   * $edition->name Edition name string
   * $edition->slug Edition slug string
   */
	public function articleEdition();

	/* An array of edition objects */
	public function articleAvailableEditions();

	public function articleTags();

	/** Return an array of content media objects in the order of importance. Media objects include images, videos and audios
		This function can potential belong to a FeedArticle interface.
	*/
	public function articleContentMediaObjects();

	/** Return an associative array containing the og_title, og_description and og_image of an article
	*/
	public function articleMetaSocial();

	public function articleSponsorInformation();
}
