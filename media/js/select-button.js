// select-media.js plugin
+function($) {
    'use strict';

    var ONE_MB_AS_BYTES = 1048576;
	var pluginName = 'selectmedia';

	var events = {
			'mediaReady': jQuery.Event("mediaReady"),
		}

	// @todo To be replaced by something similar to IH.Util.getQueryParam() later
	var getQueryParam = function(url, name) {
		if (typeof url == 'undefined' || url == '') {
			return '';
		}

    name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');

    var regexS = '[\\?&]' + name + '=([^&#]*)';
    var regex = new RegExp(regexS);
    var results = regex.exec(url);

    if (results == null) {
      return '';
    } else {
      return decodeURIComponent(results[1].replace(/\+/g, ' '));
    }
  }

  var appendQueryParams = function(url, params) {
		var pairs = [], pos;  	
  	var old_params = parseQueryParams(url), all_params = old_params;
  	var new_url = url;

  	for (var key in params) {
 			all_params[key] = params[key];
  	}

  	// encode
  	for (var key in all_params) {
  		pairs.push(encodeURIComponent(key)+'='+encodeURIComponent(all_params[key]));
  	}

  	pos = url.indexOf('?');
		if (pos !== -1) {
			new_url = url.substr(0, pos)+'?'+pairs.join('&');
		} else {
			new_url = url+'?'+pairs.join('&');
		}

		return new_url;
  }

  // Return querystring params as an associative array
  var parseQueryParams = function(url, decode) {
		var parser = document.createElement('a'), params = [];
		
		parser.href = url;

		if (typeof decode == 'undefined') {
			decode = true;
		}

		if (parser.search) {
			// @todo Need to figure out the encoding for & and &amp;
			var pairs = parser.search.substr(1, parser.search.length).split('&');
			for (var p in pairs) {
				var pair = pairs[p].split('='),
						key = pair[0],
						value = pair[1];

				if (decode) {
					params[decodeURIComponent(key)] = decodeURIComponent(value);
				} else {
					params[key] = value;
				}
			}
		}

		return params;
  }

  /**
   * @param string url     The url from which querystring params are to be removed
   * @param array params   An array of keys to remove from the querystring
   * @return string				 The modified url after querystring removal
   */
  var removeQueryParams = function(url, params) {
  	var new_url = '';

  	var pos = url.indexOf('?');
		if (pos !== -1) {
			if (params == undefined) {
				// remove the entire querystring
				new_url = url.substr(0, pos);
			} else {
				var queryparams = parseQueryParams(url);

				// filter out given params from url's querystring params
				var modparams = [];
				params = $.unique(params);

				for (var key in queryparams) {
					for (var i in params) {
						if (key.toLowerCase() != params[i].toLowerCase()) {
							modparams[key] = queryparams[key];
						} else {
							break;
						}
					}
				};

				new_url = appendQueryParams(removeQueryParams(url), modparams);
			}
		} else {
			new_url = url;
		}

		return new_url;
  }

  // Constructor
  var SelectMedia = function(element, options) {
		this.$control = $(element).attr('id', pluginName+'_'+ new Date().getTime());
		this.$container = this.$control.closest('.select-media');

		this.$preview = this.$container.find('.preview');
		this.$closeable = this.$container.find('.closeable-reset');
		this.$messagebox = this.$container.find('.message-box');
		this.options = {};
		this.uploader = undefined;
		this.$statuslist = this.$container.find('.sidebox .status-list');
		this.isMultiple = this.$control.attr('multiple') == 'multiple' ? true : false;	// has multiple or multiple='multiple' will eval to true
		this.mode = '';

		this.setOptions(options);

		var instance = this;

		// document eventlisteners
		var mediaUploaderOpen = function(e) {

			document.removeEventListener("mediaUploaderOpen", mediaUploaderOpen);

			var event;

			event = new CustomEvent("selectMediaDialogOpen", {
				detail: {
					sender: instance.$control,
					message: e.detail.message,
					time: new Date(),
				},
				bubbles: true,
				cancelable: true
			});
			this.dispatchEvent(event);
		}

		var mediaUploaderClose = function(e) {
			var event;

			if (e.detail.sender.id == instance.uploader.id) {
				if (e.detail.message.error) {

				} else {
					if (e.detail.message.media && e.detail.message.media.length > 0) {
						$(e.detail.sender.button).trigger(events.mediaReady, e.detail.message);

						event = new CustomEvent("selectMediaChange", {
							detail: {
								sender: instance.$control,
								message: {
									media: e.detail.message.media
								},
								time: new Date(),
							},
							bubbles: true,
							cancelable: true
						});
						this.dispatchEvent(event);
					}
				}

				document.removeEventListener("mediaUploaderClose", mediaUploaderClose);

				event = new CustomEvent("selectMediaDialogClose", {
					detail: {
						sender: instance.$control,
						message: e.detail.message,
						time: new Date(),
					},
					bubbles: true,
					cancelable: true
				});
				this.dispatchEvent(event);
			}
		}

		// element eventlisteners
		this.$control.on({
			'click': function(e, args) {
				var button = e.currentTarget;

				if (instance.uploader) {
					delete instance.uploader;
				}

				document.addEventListener("mediaUploaderOpen", mediaUploaderOpen, false);
				document.addEventListener("mediaUploaderClose", mediaUploaderClose, false);
				
				instance.uploader = new IH.Components.MediaUploader(button, { multiple: instance.isMultiple, mode: instance.mode });
				instance.uploader.showDialog();
			},
			// Re-init selectmedia underlying media object with the given media
			'mediaReady': function(e, args) {
				if (!instance.isMultiple) {
					args.media = args.media[0];

					instance.removeSideBox();

					var options = {
						id: args.media.id,
						filename: args.media.filename,
						filesize: args.media.filesize,
						mimeType: args.media.mime_type,
						thumb: args.media.thumb,
						width: args.media.width,
						height: args.media.height,
						altText: args.media.alt_text
						//_transcoder: args.transcoder || undefined
					}

					$(this).selectmedia(options);
				}
			}
		});

		this.$closeable.on({
			'click': function(e, args) {
				var loaded_media = $(element).data();

				if (loaded_media.id) {
					$(element).selectmedia('reset');

					var event = new CustomEvent("selectMediaChange", {
						detail: {
							sender: $(this),
							message: {
								media: SelectMedia.DEFAULTS
							},
							time: new Date(),
						},
						bubbles: true,
						cancelable: true
					});
					this.dispatchEvent(event);
				}
			}
		});
	}

	SelectMedia.MODES = {
		new: 'new',
		edit: 'edit'
	}

	SelectMedia.DEFAULTS = {
		id: '',
		filename: '',
		filesize: '',
		mimeType: '',
		thumb: '',
		width: '',
		height: '',
		altText: ''
		//_transcoder: undefined
	}

	SelectMedia.prototype.render = function() {
		var $media = this.$container.find('.preview .media');
		var instance = this;

		switch (this.options.mimeType) {
			case 'image/jpeg':
			case 'image/png':
			case 'image/gif':
			case 'application/pdf':
				var $img = $media.find('img');

				$img.siblings().addClass('hide');
				$img.siblings('video').removeAttr('controls');
				$media.attr('class', '').addClass('media');
				
				$img.on('load', function(e) {
					var $this = $(this);

      		if ($this.width() >= $this.height()) {
      			$media.removeClass('portrait').removeClass('empty');
      			$media.addClass('landscape');
      		} else {
      			$media.removeClass('landscape').removeClass('empty');
      			$media.addClass('portrait');
      		}
					
    			// show selected image dimensions below the image
					instance.checkSizes();
      		$img.off('load');
      	});
				$img.attr('src', this.options.thumb).removeClass('hide');
				
				// link pdf to file
				if (this.options.id != 'new_id') {
					$img.off('click');
					$img.removeClass('link');
					if (this.options.mimeType == 'application/pdf') {
						var url = this.options.filename;
						$img.addClass('link');
						$img.on({
							'click': function(e){
								var win = window.open(url, '_blank');
								win.focus();
							}
						});
					}
				}

				break;
			case 'video/mp4':
				var $vid = $media.find('video');

				$vid.siblings().addClass('hide');
				$vid.attr('controls', 'controls').removeClass('hide');

				// Create sources after every update
				$vid.html('');
				$vid.attr('poster', this.options.thumb);

				$('<source>').attr({
					'src': this.options.filename,
					'type': this.options.mimeType
				}).appendTo($vid);

				$media.attr('class', '').addClass('media landscape');
				$vid.load();
			
				this.createSideBox('Video Statuses');

				// Statue list handlers
				this.$statuslist.off();
				this.$statuslist
					.on({
						'destroy': function(e, args) {
							var $list = $(this),
								listdata = $list.data();

							$list.trigger('stopPoll');
						},
						'update': function(e, args) {
							var $list = $(this);
							$list.html('');

							$(args.results).each(function() {
								var status = this.Status,
									key = this.Key.substr(this.Key.lastIndexOf('.')+1),
									listitem = $('<li>').html(key);

								$('<span class="marker small"></span>').addClass(status.toLowerCase()).prependTo(listitem);
								$list.append(listitem);
							});
						},
						'stopPoll': function(e, args) {
							var $list = $(this),
								listdata = $list.data();

							if (listdata.pollIntervalId) {
								window.clearInterval(listdata.pollIntervalId);
								listdata.pollIntervalId = undefined;
							}
						},
						'poll': function(e, args) {
							var $list = $(this);

							if (!args.jobId) {
								return;
							}

							$.get('/gallery/get_pipeline_job_status', { job_id: args.jobId }, function(res) {
								if (res.success) {
									$list.trigger('update', { results: res.data});
								}
								if (res.error) {
									console.log('Job status error: ' + res.error);
								}
							}, 'json');
					
						},
						'delayPoll': function(e, args) {
							var $list = $(this),
								delay = 30000;

							if (!args.jobId) {
								return;
							}

							var pollHandler = function() {
								$list.trigger('poll', { jobId: job.Id });
							}
							window.setTimeout(pollHandler, delay);
						},
						'continuousPoll': function(e, args) {
							var $list = $(this),
								inteval = 15000;	// 15 seconds

							if (!args.jobId) {
								return;
							}

							// setup continuous poll looping
							var pollIntervalId = window.setInterval(function(){
								var listdata = $list.data();

								if (listdata.pollIntervalId != undefined) {
									if (listdata.pollCount < listdata.pollLimit) {
										$.get('/gallery/get_pipeline_job_status', { job_id: args.jobId }, function(res) {
											if (res.success) {
												$list.trigger('update', { results: res.data});

												var shouldPoll = false;
												$(res.data).each(function() {
													if (this.Status != 'complete') {
														shouldPoll = true;
													}
												});

												if (!shouldPoll) {
													$list.trigger('stopPoll');
												}
											}
											if (res.error) {
												console.log('Job status error: ' + res.error);
												$list.trigger('stopPoll');
											}

											listdata.pollCount++
										}, 'json');
									} else {
										$list.trigger('stopPoll');
									}
								}
							}, inteval);
							
							$list.data({
								pollCount: 0,
								pollLimit: 5,
								pollIntervalId: pollIntervalId
							});
						},
						'load': function(e, args) {
							var $list = $(this)

							$list.trigger('loading');

							// First load video statuses off the job table
							$.get('/api/transcoding_status/media/'+args.id+'.json?key=ajsodvk3&token=1234', {}, function(res) {
								if (res.success) {
									var shouldPoll = false;
									for(var i in res.data) {
										// Always one unique media to a unique job. No two jobs for the same media. So checking 1 result whose status is Submitted is fine for now.
										if (res.data[i].Status != 'complete') {
											shouldPoll = true;
											break;
										}
									}

									if (shouldPoll) {
										// Load the status using live data from aws
										$list.trigger('continuousPoll', { jobId: res.data[i].jobId });
									} else {
										$list.trigger('update', { results: res.data});
									}
								}
								if (res.error) {
									//console.log('Job status error: ' + res.error);
									$list.html('<li class="status-error">' + res.error + '</li>');
								}
							}, 'json');
						},
						'loading': function(e, args) {
							var $list = $(this),
								loading_label = 'Loading...';

							$list.html('<li><span class="ui-autocomplete-loading" style="float: left; width: 16px; height: 16px; margin: 0 10px 0 0;"></span>' + loading_label + '</li>');
						}
					});

					this.loadStatuses();

				break;
			case 'text/html':
				var $iframe = $media.find('iframe');
				var iframe_attrs = {};

				iframe_attrs.src = removeQueryParams(this.options.filename, ['autoplay']); // remove only unwanted playback behaviors in the preview control by removing querystring params
				$media.removeClass('empty').addClass('media landscape widescreen');
				$iframe.siblings().addClass('hide');
				$iframe.siblings('video').removeAttr('controls');

				$iframe.attr(iframe_attrs).removeClass('hide');

				break;
			default:
				// Restore media to blank slate state.
				$media.children().each(function(){
					var $tag = $(this);

					$tag.removeClass('hide');

					if (this.nodeName == 'VIDEO') {
						$tag[0].pause();
						$tag.attr('poster', '');
						$tag.removeAttr('controls');
						$tag.html('');
						$tag.load();
					}
					if (this.nodeName == 'IMG') {
						$tag.attr('src', '');
					}
					if (this.nodeName == 'IFRAME') {
						$tag.removeAttr('id');
						$tag.attr('src', '');
						// note: previously added inner document will be cleared, but will not be removed.
					}
				});

				$media.attr('class', '').addClass('media empty');
				this.clearMessage();
		}

		var $hiddenId = this.$container.find('.image-id-hidden');
		var oldId = $hiddenId.val();
		$hiddenId.val(this.options.id);
		if (oldId != this.options.id) {
			$hiddenId.trigger('change');
			//console.log('hiddenId changed');
		}

		// render label based on mode
		var $label = this.$control.find('label');
		if (this.mode == 'new') {
			$label.text($label.data('newLabel'));
		} else if (this.mode == 'edit') {
			$label.text($label.data('editLabel'));
		}
	}

	SelectMedia.prototype.close = $.noop;

	SelectMedia.prototype.reset = function() {
		this.setOptions($.extend(true, {}, this.options, SelectMedia.DEFAULTS));
		this.removeSideBox();
		this.render();
		this.checkSizes();
	}

	/*
	 * Create a sidebox with the given title and set the reference to the status list
	 */
	SelectMedia.prototype.createSideBox = function(title) {
		if (!this.statusListExists()) {
			var statuslist_template = $('<div class="ui-widget ui-box sidebox"><span class="ui-widget-header">' + title + '</span><hr/><ul class="status-list"></ul><hr/></div>');
			$(statuslist_template).attr('id', 'statuslist_'+this.options.id).insertAfter(this.$preview);
			this.$statuslist = $(statuslist_template).find('.status-list');
		}
	}

	SelectMedia.prototype.removeSideBox = function() {
		if (this.statusListExists()) {
			this.$statuslist.trigger('destroy');
			this.$statuslist.closest('.sidebox').remove();	// This will also remove the status list
			this.$statuslist = undefined;
		}
	}

	SelectMedia.prototype.updateStatuses = function(results) {
		if (this.statusListExists()) {
			this.$statuslist.trigger('update', { results: results});
		}
	}

	SelectMedia.prototype.loadStatuses = function(results) {
		if (this.statusListExists()) {
			this.$statuslist.trigger('load', [{id: this.options.id}]);
		}
	}

	SelectMedia.prototype.statusListExists = function() {
		return (this.$statuslist && this.$statuslist.length == 1);
	}

	// This function gets called on initialization and re-initialization
	SelectMedia.prototype.setOptions = function(options) {
		this.options = options;

		if (!this.options.acceptTypes) {
			this.options.acceptTypes = 'image/jpeg,image/png,image/gif,application/pdf,video/mp4';
		}
		if (!this.options.maxFileSize) {
			this.options.maxFileSize = (ONE_MB_AS_BYTES * 250);
		}
    this.$control.data(this.options);

    // update instance properties based on option values
		this.mode = (parseInt(this.options.id) != 'NaN' && parseInt(this.options.id) > 0) ? SelectMedia.MODES.edit : SelectMedia.MODES.new;
	}

	SelectMedia.prototype.checkSizes = function() {
		var expected_size = this.$control.attr('data-size');

		this.$preview.removeClass('mismatched');
		this.clearMessage();
		// check for size validation only if size has been attached to the selector button
		if (this.$control.data('width') && this.$control.data('height')) {
			if (expected_size) {
				expected_size = expected_size.replace(' ', '');

				var validateSizeParam = function(str) {
					var valid = true;

					if (str) {
						var pattern = /^\d+x\d+$/;

						if (!pattern.test(str)) {
							valid = false;
						}
					}

					return valid;
				}

				var sizes = expected_size.split(',');
				for(var i in sizes) {
					if (!validateSizeParam(sizes[i])) {
						this.setMessage('SelectMedia: Invalid size parameter ' + sizes[i] + '. Valid format: "123x123[,456x456]"');
						return;
					}
				};

				var actual_size = this.$control.data('width')+'x'+this.$control.data('height');
				var matched = (expected_size.indexOf(actual_size) !== -1);

				if (!matched) {
					//not equal - highlight it
					this.$preview.addClass('mismatched');
					this.setMessage('Selected Image size: '+ actual_size +' doesn\'t match with the expected size.', 'warning');
				} else {
					this.setMessage('Selected Image size: '+ actual_size, 'info');
				}
			} else {
				this.setMessage('Selected Image size: '+ actual_size, 'info');
			}
		}	

	}

	SelectMedia.prototype.setMessage = function(message, type) {
		this.$messagebox.text(message);
		this.$messagebox.addClass(type).show();
	}
	SelectMedia.prototype.clearMessage = function() {
		this.$messagebox.text('');
		this.$messagebox.removeClass('info warning error').hide();
	}

	SelectMedia.prototype.getOptions = function() {
		return $.extend({}, this.options);
	}

    // 
    // ======================================

    var old = $.fn[pluginName];

    $.fn[pluginName] = function(options) {
      var $this = $(this);
      var instance = $this.data('ih.'+pluginName);

      if (!instance) {
//console.log('create selectmedia');
        $this.data('ih.'+pluginName, (instance = new SelectMedia(this, $.extend(true, {}, SelectMedia.DEFAULTS, typeof options == 'object' && options))));
        instance.render();
      } else {
				if (typeof options == 'object') {
	//console.log('set options and render');
					instance.setOptions($.extend(true, {}, instance.options, options));
				  instance.render();
				} else if (typeof options == 'string') {
					var command = options;
					switch (command) {
						case 'reset':
							instance.reset();
							break;
						case 'close':
							instance.close();
							break;
						case 'options':
							return instance.getOptions();
							break;
					}
				}
			}

			return $this;
    }

    $.fn[pluginName].Constructor = SelectMedia;


    // NO CONFLICT
    // ======================================
    $.fn[pluginName].noConflict = function() {
        $.fn[pluginName] = old;
        return this;
    }


    // DATA-API
    // ======================================

    $(window).on('load', function() {
        $('.select-image-link').each(function() {
            var $button = $(this);
            var options = $button.data();
            $button[pluginName](options);
        });
    });

}(jQuery);
