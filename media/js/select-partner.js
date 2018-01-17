// select-partner.js plugin
+function($, SelectButton) {
    'use strict';

	var pluginName = 'selectpartner';

    // Constructor
  function SelectPartner(element, options) {
	this.options = SelectPartner.DEFAULTS;
	this.$el = $(element);
	this.setOptions(options);

  	var button = SelectButton.call(this, element, this.options);
    this.setOptions(button.options);
		
    this.$el.attr('id', pluginName+'_'+ new Date().getTime());

		var instance = this;

		this.$list.on('addItem.'+pluginName, function(e, args) {
			var $this = $(this);
			var lastIdx = parseInt($this.data('count')) - 1;
			var $item = $this.children('.selector-listitem').eq(lastIdx);	// Get the last item being added.

			// partner item specific initialization
			$item.find('a.remove-closeable').each(function(){
				var $button = $(this);
				$button.on({
					click: function(e) {
						e.preventDefault();
						e.stopPropagation();

						var $item = $(this).closest('.selector-listitem');
						
						instance.$list.trigger('removeItem', {$item: $item});
					}
				})
			});

			$('.select-image-link', $item).each(function(){
				var $button = $(this);
				$button.selectmedia($button.data());
			});

	        if (instance.options.collapsible) {
					// build alias for item
				var i = lastIdx + 1;

				if ($item.find('.head').length == 0) {
				  var $head = $('<div class="head"></div>').prependTo($item);
				  var $blockEl = $('<h4></h4>').appendTo($head);
				  var $num = $('<span class="number"></span>');
				  var $content = $('<span class="content"></span>');

				  var $media = $item.find('.select-media').first();
				  var content_html = '';

				  if ($media.length == 1) {
				    $media.on({
				      'updateHead': function(e, args) {
				        $content.html(args.$media.find('.preview .media').html())
				      }
				    });
				    content_html = $media.find('.preview .media').html();
				  }
				  else {
				    content_html = 'Item ' + i;
				  }

				  $content.html(content_html).appendTo($blockEl);
				}

				// move the close button with collapsible is used
				var $head = $item.find('.head');
				var $close_button = $item.find('> .closeable > .hover');

				if ($head.length == 1 && $close_button.length == 1 && !$head.hasClass('closeable')) {
					$head.addClass('closeable');
					$head.append($close_button);
				}
	        }

			$this.trigger('refresh.'+pluginName);

			if (instance.options.collapsible) {
				$this.accordion("option", "active", lastIdx);
			}

			instance.render();
		});

		this.$list.on('load.'+pluginName, function(e, args) {
			var $this = $(this);

			// partner item specific initialization
			if (instance.options.collapsible) {
				$this.accordion({
					header: '> li .head'
				});						
			}

			if (instance.options.sortable) {
				$this.sortable({
					//containment: "parent",
					helper: function(e, ui) {
						var $name = ui.find('input[name$="[name]"]'),
							$media = $(ui.find('.media')[0]);

						var $mediaCopy = $media.clone();
						$mediaCopy.find('img').css({ maxWidth: '100px'});

						var	$uiSortableHelper = $('<div class="" style="width:250px; height:auto; border-radius: 0; border: 1px solid black;">'+'<span class="logo" style="display:inline-block; vertical-align: middle; margin: 10px;">'+$mediaCopy.html()+'</span>'+'<span class="name" style="display:inline-block; vertical-align:top; margin: 10px; font-weight: 700; font-size: 16px;">'+$name.val()+'</span></div>');

			      return $uiSortableHelper;
					}
				});				
			}

			var items = $this.children();
			
			items.each(function(i){
				var $item = $(this);

				if (instance.options.collapsible) {
				  // build alias for item
				  if ($item.find('.head').length == 0) {
				    var $head = $('<div class="head"></div>').prependTo($item);
				    var $blockEl = $('<h4></h4>').appendTo($head);
				    var $num = $('<span class="number"></span>');
				    var $content = $('<span class="content"></span>');
				    
				    var $media = $item.find('.select-media').first();
				    var content_html = '';

				    if ($media.length == 1) {
				      $media.on({
				        'updateHead': function(e, args) {
				          $content.html(args.$media.find('.preview .media').html())
				        }
				      });
				      content_html = $media.find('.preview .media').html();
				    }
				    else {
				      content_html = 'Item ' + i;
				    }

				    $content.html(content_html).appendTo($blockEl);
				  }

				  // move the close button
				  var $head = $item.find('.head');
				  var $close_button = $item.find('> .closeable > .hover');

				  if ($head.length == 1 && $close_button.length == 1 && !$head.hasClass('closeable')) {
				  	$head.addClass('closeable');
				  	$head.append($close_button);
				  }
				}
			});

			document.addEventListener("selectMediaChange", function(e) {
				var el = e.target || e.srcElement;
				var $media = $(el).closest('.select-media');

				$media.trigger('updateHead', { $media: $media }); // tigger updateHead or nothiing would happen if updateHead not binded
			}, false);

			document.addEventListener("selectMediaDialogClose", function(e) {
				var $media = e.detail.sender.data('ih.selectmedia').$container;

				$media.trigger('updateHead', { $media: $media }); // tigger updateHead or nothiing would happen if updateHead not binded
			}, false);

			$this.find('a.remove-closeable').each(function(){
				var $button = $(this);
				$button.on({
					click: function(e) {
						e.preventDefault();
						e.stopPropagation();

						var $item = $(this).closest('.selector-listitem');
						var $list = $item.closest('.selector-list');
						
						$list.trigger('removeItem', {$item: $item});
					}
				})
			});

			$this.trigger('refresh.'+pluginName);

			if (instance.options.collapsible) {
				// collapse list
				$this.accordion("option", "active", false);
			}
			
			return $this;
		});
		
		this.$list.on('refresh.'+pluginName, function(e, args) {
			var $this = $(this);

          	if (instance.options.collapsible) {
            	$this.accordion("refresh");
          	}

			return $this;
		});
			
		this.$list.trigger('load.'+pluginName);

		switch (this.options.mode) {
			case 'dialog':
				// document eventlisteners
				var selectorClose = function(e) {
					if (e.detail.sender.id == instance.selector.id) {
						if (e.detail.message.error) {

						} else {
							// response if message included a field call 'items'
							if (e.detail.message.items && e.detail.message.items.length > 0) {
								$(e.detail.sender.button).trigger(instance.events.mediaReady, e.detail.message);
							}
						}
						document.removeEventListener("partnerSelectClose", selectorClose);

						var event = new CustomEvent("partnerSelectorDialogClose", {
							detail: {
								sender: instance.$el,
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
				this.$el.on({
          'click': function(e, args) {
            if (!$(this).hasClass('disabled')) {
              $(this).trigger('activate');
            }
          },
          'enable': function(e, args) {
            $(this).removeClass('disabled');
          },
          'disable': function(e, args) {
            $(this).addClass('disabled');
          },
          'activate': function(e, args) {
						var button = e.target || e.srcElement;

						if (instance.selector) {
							delete instance.selector;
						}

						var val, dialogOptions;

						dialogOptions = {
							filter: {}
						};

            if (typeof instance.options.partnerType !== 'undefined') {
              dialogOptions.filter.partner_type = instance.options.partnerType;
            }

						instance.selector = new IH.Components.PartnerSelector(button, { multiple: instance.isMultiple, filter: dialogOptions.filter });
						instance.selector.showDialog();

						document.addEventListener("partnerSelectorClose", selectorClose, false);
					},
					'mediaReady': function(e, args) {
							var button = e.target || e.srcElement,
								$button = $(button);

							for (var i in args.items) {
								var id = args.items[i].id;

								// Get a new form
								$.ajax({
									url: instance.options.formUrl,
									type: 'POST',
									dataType: 'json',
									data: {
										'index': parseInt(instance.$list.data('count')),
										'type': instance.options.partnerType,
										'id': id,
										'sortable': instance.options.sortable
									},
									async: true,
									success: function(r) {
										if (r.success) {
											instance.$list.trigger('addItem', {item: r.data});
										} else {
											//console.log("response failed");
										}
									},
									error: function() {
										// console.log("ajax post failed");
									}
								});
							}
					}
				});
				break;
			case 'lookup':
			default:	
				this.$el.on({
					'click': function(e, args) {
						var button = e.target || e.srcElement,
							$button = $(button);

						// Get a new form
						$.ajax({
							url: instance.options.formUrl,
							type: 'POST',
							dataType: 'json',
							data: {
								'index': parseInt(instance.$list.data('count')),
								'type': instance.options.partnerType
							},
							async: true,
							success: function(r) {
								if (r.success) {
									instance.$list.trigger('addItem', {item: r.data});
								} else {
									//console.log("response failed");
								}
							},
							error: function() {
								// console.log("ajax post failed");
							}
						});
					}
				});
				break;
		}

    return this;
	}

	SelectPartner.DEFAULTS = {
		limit: 0,
		formUrl: '/ajax/get_partner_form',
		partnerType: 'general_partner',
		listClass: pluginName + '-list',
		listItemClass: pluginName + '-listitem',
		sortable: false,
		collapsible: false
	}

	SelectPartner.prototype = {}
	SelectPartner.prototype = Object.create(SelectButton.prototype);
	SelectPartner.prototype.constructor = SelectPartner;

    SelectPartner.prototype.events = {
      'mediaReady': jQuery.Event("mediaReady"),
    }

    // 
    // ======================================

    var old = $.fn[pluginName];

    $.fn[pluginName] = function(options) {
        var $this = $(this);
        var instance = $this.data('ih.'+pluginName);

        if (!instance) {
            $this.data('ih.'+pluginName, (instance = new SelectPartner(this, options)));
            instance.render();
        } else {
			if (typeof options == 'object') {
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
				}
			}
		}

		return $this;
    }

    $.fn[pluginName].Constructor = SelectPartner;


    // NO CONFLICT
    // ======================================
    $.fn[pluginName].noConflict = function() {
        $.fn[pluginName] = old;
        return this;
    }


    // DATA-API
    // ======================================

    $(window).on('load', function() {
        $('[select-partner-link]').each(function() {
            var $button = $(this);
            var options = $button.data();
            $button[pluginName](options);
        });
    });

}(jQuery, IH.Components.SelectButton);
