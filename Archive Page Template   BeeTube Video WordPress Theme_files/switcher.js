jQuery(document).ready(function(){
								
jQuery('#style-switch').animate({left:-90});
		
jQuery('#t-row-left-ss').animate({left:0});

var selector = 1;

jQuery('#t-row-left-ss').click(function(){
										
	if (selector == 1) {
	
	jQuery('#style-switch').animate({left:0});
		
	jQuery('#t-row-left-ss').animate({left:90});
	jQuery('#t-row-left-ss').addClass('yabru');
	
	

	
	selector = 0;
	
	}
	else {
		
		jQuery('#style-switch').animate({left:-90});
		
	jQuery('#t-row-left-ss').animate({left:0});
	jQuery('#t-row-left-ss').removeClass('yabru');
		
		selector = 1;
		}
		
		
});
jQuery('.revers').click(function(){
jQuery('#style-switch').animate({left:-90});
		
jQuery('#t-row-left-ss').animate({left:0});
jQuery('#t-row-left-ss').removeClass('revers');
});

});
