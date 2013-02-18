/*
	jQuery Tagz Plugin 1.0.3
	
	Copyright (c) 2013 Dzulqarnain Nasir

	Licensed under the MIT license:
	http://www.opensource.org/licenses/mit-license.php

	dzul1983@gmail.com

	This project is based on the jQuery Tags Input Plugin project by XOXCO
	Original project URL: http://xoxco.com/clickable/jquery-tags-input
*/

(function($){
	// Default options
	var defaultOptions = {
		autocompleteOnly: false,
        autocompleteOptions: undefined,
        autosize: true,
        comfortZone: 20,
        delimiter: ',',
        height: 100,
        inputPadding: 12,
        minChars: 0,
        placeholderColor: '#666666',
        placeholderText: 'Add a tag',
        readonly: false,
        removeWithBackspace: true,
        showInput: false,
        unique: true,
        width: 300,
        onAddTag: function() { },
        onRemoveTag: function() { },
        onChange: function() { }
	};

	// Constructor
	function Tagz(el, options){
		this.el = $(el);
		this.options = $.extend({}, defaultOptions, options);
		privateMethods.init.apply(this);
	}

	// Private
	var privateMethods = {
		init: function(){
			if(!this.options.showInput){
				this.el.hide();
			}

			var disabled = this.el.attr('disabled');
			if(typeof disabled !== 'undefined' && disabled !== false){
				this.options.readonly = true;
			}

			var id = this.el.attr('id');
			if(!id){
				id = this.el.attr('id', 'tags' + new Date().getTime()).attr('id');
			}

			// Create holder
			var markup = '<div id="' + id + '_tagsInput" class="tagsinput"><div id="' + id + '_addTag">';
			if (!this.options.readonly) {
				markup += '<input id="' + id + '_tag" value="" data-placeholder="' + this.options.placeholderText + '" />';
			}
			markup += '</div><div class="tags_clear"></div></div>';

			// Insert holder into DOM
			this.el.after(markup);

			// Store info in object
			$.extend(this, {
				holder: $('#' + id + '_tagsInput'),
				inputWrapper: $('#' + id + '_addTag'),
				fakeInput: $('#' + id + '_tag')
			});

			// Apply style
			this.holder.css({
				width: this.options.width,
				minHeight: this.options.height,
				height: '100%'
			});

			// If input is not empty, import value as tags
			if (this.el.val() != '') {
				privateMethods.importTags.apply(this);
			}

			if(this.options.readonly){
				return;
			}

			this.fakeInput
					.val(this.fakeInput.attr('data-placeholder'))
					.css('color', this.options.placeholderColor);

        	privateMethods.resetAutosize.apply(this);

        	this.el
	        	.on('addTag', this, function(event, value){
	        		event.data.options.onAddTag.call(event.data, value);
	        	})
	        	.on('removeTag', this, function(event, value){
	        		event.data.options.onRemoveTag.call(event.data, value);
	        	})
	        	.on('change', this, function(event, value){
	        		event.data.options.onChange.call(event.data, value);
	        	});

        	this.holder
	        	.on('click', this, function(event){
	        		event.data.fakeInput.focus();
	        	})
	        	.on('click', 'a.remove-tag', $.proxy(function(event){
					event.preventDefault();
					privateMethods.removeTag.call(this, event.target.parentElement);
				}, this));

        	this.fakeInput
	        	.on('focus', this, function(event) {
					if (event.data.fakeInput.val() == event.data.fakeInput.attr('data-placeholder')) {
						event.data.fakeInput.val('');
					}
					event.data.fakeInput.css('color','#000000');
				})
				.on('blur', this, $.proxy(function(event) {
					var value = event.data.fakeInput.val();

					if ((value != '' && value != event.data.fakeInput.attr('data-placeholder'))
						&& (value.length >= event.data.options.minChars && (!event.data.options.maxChars || value.length <= event.data.options.maxChars))) {
							privateMethods.addTag.call(this, value);
					} else {
						event.data.fakeInput
							.val(event.data.fakeInput.attr('data-placeholder'))
							.css('color', this.options.placeholderColor);
					}
					return false;
				}, this))
				.on('keypress', this, $.proxy(function(event) {
					if (event.which == event.data.options.delimiter.charCodeAt(0) || event.which == 13 ) {
					    event.preventDefault();

					    var value = event.data.fakeInput.val();

						if(value.length >= event.data.options.minChars && (!event.data.options.maxChars || value.length <= event.data.options.maxChars)){
							privateMethods.addTag.call(this, value);
						}

						privateMethods.resetAutosize.apply(this);
						return false;
					} else if (event.data.options.autosize) {
						privateMethods.doAutosize.apply(this);        
	      			}
				}, this));

			//Delete last tag on backspace
			if(this.options.removeWithBackspace){
				this.fakeInput.on('keydown', $.proxy(function(event) {
					if(event.keyCode == 8 && this.fakeInput.val() == ''){
						event.preventDefault();

						var last_tag = this.holder.find('.tag:last');
						privateMethods.removeTag.call(this, last_tag);
						this.fakeInput.trigger('focus');
					}
				}, this));
			}

			//Removes the not_valid class when user changes the value of the fake input
			if(this.options.unique) {
			    this.fakeInput.keydown($.proxy(function(event){
			        if(event.keyCode == 8 || String.fromCharCode(event.which).match(/\w+|[áéíóúÁÉÍÓÚñÑ,/]+/)) {
			            this.fakeInput.removeClass('not_valid');
			        }
			    }, this));
			}

			if (this.options.autocompleteOptions) {
				// Use jQuery autocomplete if defined
				if ($.ui.autocomplete !== undefined) {
					this.fakeInput.autocomplete(this.options.autocompleteOptions);
					this.fakeInput.on('autocompleteselect', this, $.proxy(function(event, ui) {
						this.fakeInput.val(ui.item.value);
						privateMethods.addTag.call(this, ui.item.value);
						return false;
					}, this));

					if(this.options.autocompleteOnly){
						this.options.allowedValues = [];
						this.fakeInput
							.on('autocompleteresponse', $.proxy(function(event, ui){
								this.options.allowedValues = Object.prototype.toString.call(ui.content) === '[object Array]' ? $.map(ui.content, function(elem, index){ return elem.value; }) : [];
							}, this))
							.on('autocompleteclose', $.proxy(function(event, ui){
								this.options.allowedValues = [];
							}, this));
					}
				}
			}

			this.fakeInput.blur();
		},

		addTag: function(value){
			if(this.options.autocompleteOnly){
				if(!this.options.allowedValues){
					this.options.allowedValues = [];
				}

				if($.inArray(value, this.options.allowedValues) == -1){
					return false;
				}
			}

			var tagsList = this.el.val().split(this.options.delimiter);
			if(tagsList[0] == ''){
				tagsList = [];
			}

			value = $.trim(value);

			if (this.options.unique && privateMethods.tagExist.call(this, value)) {
			    this.fakeInput.addClass('not_valid');
			    return false;
			}

			var tag = '<span class="tag"><span>' + value + '</span>';
			if(!this.options.readonly) {
				tag += '&nbsp;&nbsp;<a href="#' + value + '" title="Remove tag" class="remove-tag">x</a>';
			}
			tag += '</span>';

			this.inputWrapper.before(tag);

			tagsList.push(value);

			this.fakeInput.val('').focus();

			privateMethods.updateTagsField.call(this, tagsList);

			this.el.trigger('addTag', value);
			this.el.trigger('change', tagsList);
		},

		removeTag: function(value){
			// Remove from DOM
			var tags = this.holder.find('.tag');
			if(value === Object(value)){
				tags.filter(value).remove();
				value = unescape($(value).find('> span').text());
			} else {
				value = unescape(value);
				if(!privateMethods.tagExist.call(this, value)){
					return;
				}

				tags.filter(function(){
					return $.trim($(this).find('> span').text()) == value;
				}).remove();
			}

			// Remove from input field
			var tagsList = this.el.val().split(this.options.delimiter),
				index = $.inArray(value, tagsList);
			tagsList.splice(index, 1);
			privateMethods.updateTagsField.call(this, tagsList);

			this.el.trigger('removeTag', value);
			this.el.trigger('change', tagsList);
		},

		doAutosize: function(){
			var minWidth = this.el.data('minwidth'),
		        maxWidth = this.el.data('maxwidth'),
		        val = '',
		        input = $(this),
		        testSubject = $('#'+$(this).data('tester_id'));
		
		    if (val === (val = this.el.val())) { return; }
		
		    // Enter new content into testSubject
		    var escaped = val.replace(/&/g, '&amp;').replace(/\s/g,' ').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		    testSubject.html(escaped);

		    // Calculate new width + whether to change
		    var testerWidth = testSubject.width(),
		        newWidth = (testerWidth + this.options.comfortZone) >= minWidth ? testerWidth + this.options.comfortZone : minWidth,
		        currentWidth = this.el.width(),
		        isValidWidthChange = (newWidth < currentWidth && newWidth >= minWidth)
		                             || (newWidth > minWidth && newWidth < maxWidth);
		
		    // Animate width
		    if (isValidWidthChange) {
		        this.el.width(newWidth);
		    }
		},

		resetAutosize: function(){
			var minWidth =  this.el.data('minwidth') || this.options.minInputWidth || this.el.width(),
		        maxWidth = this.el.data('maxwidth') || this.options.maxInputWidth || (this.holder.width() - this.options.inputPadding),
		        testSubject = $('<tester/>').css({
		            position: 'absolute',
		            top: -9999,
		            left: -9999,
		            width: 'auto',
		            fontSize: this.el.css('fontSize'),
		            fontFamily: this.el.css('fontFamily'),
		            fontWeight: this.el.css('fontWeight'),
		            letterSpacing: this.el.css('letterSpacing'),
		            whiteSpace: 'nowrap'
		        }),
		        testerId = this.el.attr('id')+'_autosize_tester';

		    if(!$('#'+testerId).length > 0) {
		      	testSubject.attr('id', testerId);
		      	testSubject.appendTo('body');
		    }

		    this.el
		    	.data('minwidth', minWidth)
		    	.data('maxwidth', maxWidth)
		    	.data('tester_id', testerId)
		    	.css('width', minWidth);
		},

		tagExist: function(value){
			var tagsList = this.el.val().split(this.options.delimiter);
			return $.inArray(value, tagsList) != -1;
		},

		importTags: function(){
			var tagsList = this.el.val().split(this.options.delimiter);
			this.el.val('');
			for(var i = 0, i_len = tagsList.length; i < i_len; i++){
				privateMethods.addTag.call(this, tagsList[i]);
			}
		},

		updateTagsField: function(tagsList){
			this.el.val(tagsList.join(this.options.delimiter));
		},

		destroy: function(){
			this.holder.remove();
			this.el.removeAttr('style').show().removeData('plugin__tagsInput');
		}
	};

	// Public
	Tagz.prototype = {
		addTag: function(value){
			privateMethods.addTag.call(this, value);
			return this.el;
		},

		removeTag: function(value){
			privateMethods.removeTag.call(this, value);
			return this.el;
		},

		destroy: function(){
			privateMethods.destroy.call(this);
			return this.el;
		}
	};

	$.fn.tagz = function(method){
		var args = arguments;

		return this.each(function(){
			var el = $(this),
				instance = el.data('plugin__tagsInput');

			if(instance && typeof Tagz.prototype[method] !== 'undefined'){
				return instance[method].apply(instance, Array.prototype.slice.call( args, 1 ));
			} else if (typeof method === 'object' || !instance){
				el.data('plugin__tagsInput', new Tagz(this, method));
			} else {
				$.error('Method ' + method + ' not found.');
			}
		});
	};

})(jQuery);