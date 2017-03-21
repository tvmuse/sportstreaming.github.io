var xhrPool = [];

// Create repeat method if it is not exists
if (!String.repeat) {
	String.prototype.repeat = function(l) {
		return new Array(l + 1).join(this);
	}
}

(function ($) {

var beeTube = {
	init: function(){
		$("body").fitVids();
	
		beeTube.xhrPool;
		beeTube.onbeforeunloadAbort();
		beeTube.placeHolder();
		beeTube.loopViewSwitcher();
		beeTube.lessMore();
		beeTube.masonry();
	
		/*= Responsive Navigation Menu */
		$('#main-nav .menu').deSelectMenu({});

		// Change event on select element
		$('.orderby-select').change(function() {
			location.href = this.options[this.selectedIndex].value;
		});
	},
	
	xhrPool: function(){
		
		$(document).ajaxSend(function(e, jqXHR, options){
			xhrPool.push(jqXHR);
		});
		$(document).ajaxComplete(function(e, jqXHR, options) {
			xhrPool = $.grep(xhrPool, function(x){return x!=jqXHR});
		});
	},
	
	ajaxVideo: function(el){

		var $this = $(el);
			pid = $this.attr('data-id'), 
			thumb = $this.parents('.thumb'),
			caption = $this.parents('.item').find('.caption'),
			list = $this.parents('.carousel-list'); 
		
		// Prevent duplicate clicks
		if($this.data('clickable') == 'no')
			return false;	
	
		// Remove video and Show thumb and caption from siblings items
		list.find('.video').remove();
		list.find('.caption').show();
		list.find('.thumb').show().removeClass('loading');
	
		// Hide caption and thumb
		//caption.hide();
		thumb.addClass('loading');
	
		// Ajax call
		var xhr = $.ajax({
			url: theme_ajaxurl,
			type: 'POST',
			data: {action:'ajax-video', 'id':pid},
			dataType: 'html',
			beforeSend: function(xhr){
				beeTube.abortAll();
				// Set current link to unclickable and other links to clickable
				list.find('.thumb a').data('clickable', '');
				$this.data('clickable', 'no');
			}
		})
		.fail(function(xhr, status, error){
			if(error !== 'abort') {
				alert(ajaxerror);
				thumb.removeClass('loading');
			}
		})
		.done(function(result, status, xhr){
			thumb.before('<div class="video fluid-width-video-wrapper"></div>');
			var video = thumb.prev('.video');
			video.hide().html(result);
					
			if(video.find('iframe').length) {
				video.find('iframe').load(function(){
					video.show();
					thumb.hide().removeClass('loading');
					thumb.next('.hori-like').hide();
				});
			} else {
				video.show();
				thumb.hide().removeClass('loading');
			}
				
			// Reinit fitVids
			$('body').fitVids();
		})
		.always(function(xhr, status){
			$this.data('clickable', '');
		});
	},
	
	connectedControl: function(carouselStage, carouselNav){
		if(jQuery().jcarousel === undefined)
			return;
		
		carouselNav.jcarousel('items').each(function() {
			var item = $(this),
				target = carouselStage.jcarousel('items').eq(item.index());

			item
			.on('click', function(){
				// Reinit auto scrolling
				if(carouselStage.data('jcarouselautoscroll') == 'stopped') {
					carouselStage.jcarouselAutoscroll('start');
					carouselStage.data('jcarouselautoscroll', true);
				}
			})
			.on('active.jcarouselcontrol', function() {
				carouselNav.jcarousel('scrollIntoView', this);
				item.addClass('active');
			})
			.on('inactive.jcarouselcontrol', function() {
				item.removeClass('active');
			})
			.jcarouselControl({
				target: target,
				carousel: carouselStage
			});
		});
	},
	
	clickAjax: function(link, stage, carousel){
		if(!stage.data('ajaxload'))
			return false;
			
		$(link).on('click', function(e){
			e.preventDefault();
	
			// Stop autoscrolling
			if(carousel.data('jcarouselautoscroll'))
				carousel.jcarouselAutoscroll('stop').data('jcarouselautoscroll', 'stopped');
	
			beeTube.ajaxVideo(this);
		
			return false;
		});
	},

	abortAll: function() {
		$.each(xhrPool, function(idx, jqXHR) {
			jqXHR.abort();
		});
	},
	
	stageSetup: function(stage){
		stage.find('.item-video').each(function(){
			// Hide thumb and caption when the video is found
			if($(this).find('.video').length)
				$(this).find('.thumb').hide();
		});
	},
	
	autoScroll: function(stage){
		// Add the autoscrolling for stage carousel
		var interval = stage.data('autoscroll-interval');
		if(interval > 0) {
			stage.jcarouselAutoscroll({
				'interval': interval,
				'autostart': true // TODO?: Do not autostart if first post media is video
			});
		}
	},
	
	targetedStage: function(carousel){
		carousel
		.on('itemtargetin.jcarousel', '.item', function(event, carousel) {
			var item = $(this);
			
			// Display the thumb and caption of current item
			// item.find('.screen').show();
			item.find('.thumb').show();
			item.find('.caption').show();
				
			// Remove the video of other items
			item.siblings('.item').find('.video').remove();
			
			// Switch to the entry-header of current item
			item.parents('.wall').find('.entry-header').hide();
			item.parents('.wall').find('.entry-header[data-id="'+item.data('id')+'"]').fadeIn();
		})
		.on('itemtargetout.jcarousel', '.item', function(event, carousel) {
			var item = $(this);
		});
	},
	
	prevNextControl: function(carousel){
		$('.prev-stage')
        .on('inactive.jcarouselcontrol', function() {
            $(this).addClass('inactive');
        })
		.on('active.jcarouselcontrol', function() {
			$(this).removeClass('inactive');
		})
		.jcarouselControl({
			target: '-=1',
			carousel: carousel
		});
	
		$('.next-stage')
        .on('inactive.jcarouselcontrol', function() {
			$(this).addClass('inactive');
		})
		.on('active.jcarouselcontrol', function() {
			$(this).removeClass('inactive');
		})
		.jcarouselControl({
			target: '+=1',
			carousel: carousel
		});
	},
	
	/* "More/less" Toggle */
	lessMore: function(){
		var lessHeight = $('#info').data('less-height');
			trueHeight = $('#info').outerHeight(false);
			
		if(trueHeight > lessHeight) {
			$('.info-toggle-arrow').css('display', 'inline-block'); 
			$('.info-toggle').show();
			$('#info').height(lessHeight);
		}
		
		$('.info-toggle-button, .info-toggle-arrow').click(function() {
			$('#info').toggleClass('info-more');
			$('.info-toggle-button').toggleClass('info-more-button');
			$('.info-toggle-arrow').toggleClass('info-more-arrow');
	
			return false;
		})
	},
	
	/*= Loop View Switcher */
	loopViewSwitcher: function() {
		$('.loop-actions .view a').on('click', function(e) {
			e.preventDefault();
		
			var viewType = $(this).attr('data-type'),
				loop = $('.switchable-view'),
				loopView = loop.attr('data-view');
			
			if(viewType == loopView)
				return false;
			
			$(this).addClass('current').siblings('a').removeClass('current');

			loop.stop().fadeOut(100, function(){
				if(loopView)
					loop.removeClass(loopView);
			
				$(this).fadeIn().attr('data-view', viewType).addClass(viewType);
			});
	
			$('.loop-content .video').remove();
			$('.loop-content .thumb').show();

			$.cookie('loop_view', viewType, { path: '/', expires : 999});

			return false;
		});
	},
	
	/*== HTML5 placeholder fallback */
	placeHolder: function(){
		$('input[type="text"]').each(function(){
			var placeholder = $(this).attr('placeholder');
		
			$(this).on('focus', function(){
				if($(this).attr('value') == '')
					$(this).attr('value', '').attr('placeholder', '');
			}).on('blur', function(){
				if($(this).attr('value') == '')
					$(this).attr('placeholder', placeholder);
			});
		});
	},

	// Automatically cancel unfinished ajax requests 
	// when the user navigates elsewhere.
	onbeforeunloadAbort: function() {
		var oldbeforeunload = window.onbeforeunload;
		window.onbeforeunload = function() {
			var r = oldbeforeunload ? oldbeforeunload() : undefined;
			// only cancel requests if there is no prompt to stay on the page
			// if there is a prompt, it will likely give the requests enough time to finish
			if (r == undefined) {
				beeTube.abortAll();
			}
			return r;
		}
	},
	
	// Masonry layouts
	masonry: function(){
		if(!$.isFunction($.fn.masonry))
			return false;
			
		var sidebar = $('#sidebar');
		
		if(sidebar.hasClass('masonry')) {
		var sidebarMasonry = function(){ 
			sidebar.imagesLoaded(function(){
				sidebar.masonry({
					itemSelector: '.widget',
					columnWidth: 300,
					gutterWidth: 20,
					isRTL: $('body').is( '.rtl' )
				});
			});
		}
		
		if(sidebar.find('iframe').length) {
			sidebar.find('iframe').load(function(){
				sidebarMasonry();
			});
		} else {
			sidebarMasonry();
		}
		}
		
		var footbar = $('#footbar-inner');
		if(footbar.hasClass('masonry')) {
		var footbarMasonry = function() {
			footbar.imagesLoaded(function(){
				var itemSelector = $('#footbar').data('layout') == 'c4s1' ? '.widget-col' : '.widget';

				footbar.masonry({
					itemSelector: itemSelector,
					columnWidth: 60,
					gutterWidth: 20,
					isRTL: $('body').is( '.rtl' )
				});
			});
		}
		
		if(footbar.find('iframe').length) {
			footbar.find('iframe').load(function(){
				footbarMasonry();
			});
		} else {
			footbarMasonry();
		}
		}
		
	}
}

$(document).ready(function(){
	
	beeTube.init();
});

$(window).on('load resize', function(){
	$('.fcarousel-5').deCarousel();
	$('.fcarousel-6').deCarousel();
});

/*== Ajax Video, List Large View */
$(function() {
if($('.loop-content').data('ajaxload')) {
	$('.item-video .thumb a').on('click', function(e){
		if($(this).parents('.list-large').length) {
			e.preventDefault();
			
			// Stop other videos
			$('.list-large .video').remove();
			$('.list-large .thumb').show().removeClass('loading');
		
			beeTube.ajaxVideo(this);
		
			return false;
		}
	});
}
});
			
// Home Featured, Full Width
$(function() {
	var stage = $('.home-featured-full .stage'),
		carouselStage = stage.find('.carousel');
	beeTube.stageSetup(stage);
	if(jQuery().jcarousel) {
	carouselStage.jcarousel({wrap: 'circular'});
	beeTube.autoScroll(carouselStage);
	beeTube.targetedStage(carouselStage);
	var carouselNav = $('.fcarousel-6').deCarousel();
	beeTube.connectedControl(carouselStage, carouselNav);
	beeTube.clickAjax('.home-featured-full .stage .item-video .thumb a', stage, carouselStage);
	}
});	

// Home Featured, Standard Layout
$(function() {
	var stage = $('.home-featured .stage');
	var carouselStage = stage.find('.carousel');
	beeTube.stageSetup(stage);
	if(jQuery().jcarousel) {
	carouselStage.jcarousel({wrap: 'circular'});
	beeTube.autoScroll(carouselStage);
	beeTube.targetedStage(carouselStage);

	// Setup the navigation carousel
	var carouselNav = $('.home-featured .nav .carousel-clip')
		.jcarousel({
			vertical: true,
			wrap: 'circular'
		});
	
	// Setup controls for the navigation carousel
	$('.home-featured .carousel-prev').jcarouselControl({target: '-=4'});
	$('.home-featured .carousel-next').jcarouselControl({target: '+=4'});
		
	beeTube.connectedControl(carouselStage, carouselNav);
	}	
	beeTube.clickAjax('.home-featured .stage .item-video .thumb a', stage, carouselStage);
});

   $(".sortby").click(function () {
      $('.orderby').toggle('slide');
   });
$( '#cbp-qtrotator' ).cbpQTRotator();
$().iTopPage();
	
	$('.forget a') .click(function () {
		$('.user-container') .slideUp(1000);
		$('.forgot-container') .slideDown(1000);
	});
	$('.search-toggle').click(function(){
			    
		$( "#header-search .searchform-div" ).toggle( "right" );
		 $( this ).toggleClass( "search-toggle-hover" );
		});
		
		$(".profilebtn").click(function () {
		 $(".newpostbtn").removeClass("author-optionn");
		$(this) .addClass("author-option");
		  $('.new-post').fadeOut();
		  $('.user-profile').fadeIn('slow');
	   });
	   
	   $(".newpostbtn").click(function () {
	   $(".profilebtn").removeClass("author-option");
		$(this) .addClass("author-optionn");
		  $('.user-profile').fadeOut();
		  $('.new-post').fadeIn('slow');		  
	   });
	   
	   $("input.video-embed-code").click(function () {
	   	  $('.vid-option').hide();
		  $('div.video-embed-code').fadeIn('slow');		  
	   });
	   
	   $("input.video-custom").click(function () {
	   	  $('.vid-option').hide();
		  $('div.video-custom').fadeIn('slow');		  
	   });
	   
	   $("input.video-url").click(function () {
	   	  $('.vid-option').hide();
		  $('div.video-url').fadeIn('slow');		  
	   });


}(jQuery));