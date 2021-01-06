$(function() {
	// Resize the page to the current page size - pull function from library.js
	resetPageSize();
	
	// Hide game-pad div if player loads game into the allies page
	if( $('#game-pad') ){
		$('#game-pad').remove();
	}
	
	// GIFT PAGE CONTROLS	
	// initialise for all gift buttons - available, selected and unavailable
	var giftButton = $("#gift-options").find("li"),
		acceptButton = $(".accept"),
		closeButton = $("span.x");
	
	/* 	display gift information when gift is hovered over */
	$( giftButton ).hover( function() {
		$( this ).find(".gift-info").css("visibility", "visible");
		}, function() {
		$( this ).find(".gift-info").css("visibility", "hidden");
	});
	
	/* 	update the gift button class when it's clicked on to either show an item's
		selected, or deselected */
	$( giftButton ).click( function() {
		// on click reset specific variables for gifts that are available and selected
		var giftAvailable = $("#gift-options").find("li.gift"),
			giftSelected = $("#gift-options").find("li.gift-selected"),
			giftLocked = $("#gift-options").find("li.gift-locked"),
			giftCheck = $(this).find("input[name='gift']"),
			friendId = $("input[name='friend-id']").val();
			
		// remove any previous selections if they exist
		$(giftSelected).removeClass('gift-selected');
		$(giftSelected).addClass('gift');
		
		// update the new gift selection visually
		$(this).removeClass('gift');
		$(this).addClass('gift-selected');
		// select the appropriate new checkbox
		$(giftCheck).attr('checked', 'checked');
		
		// set selected items variables to be sent on form submission
		var giftKey = giftCheck.attr("itemkey"),
			giftName = giftCheck.val();
		
		// make sure all unavailable gifts remain so
		$(giftLocked).removeClass('gift');
		$(giftLocked).removeClass('gift-selected');
		
		// check for friend ID to define onsubmit variable
		if( friendId != null ){
			var onSubmit = "giftRequestToFriend('" + giftKey + "', '" + giftName + "', '" + friendId + "'); return false;";
		} else {
			var onSubmit = "giftRequest('" + giftKey + "', '" + giftName + "'); return false;";				
		}	
		// that it's checkbox is never checked, nor the form variables set O.o
		if( $(this).hasClass('gift-locked')) {
			$(this).find("input[name='gift']").removeAttr('checked');
			giftKey = null;
			giftName = null;
			// and that if the onsubmit field was activated previously, that it's removed
			$('span#send-gift').html('');
		} else {
			// and update onsubmit field
			$("span#send-gift").html("<a href='?' onclick=\"" + onSubmit + "\"><input type=\"submit\" name=\"gift-submit\" class=\"gift-submit social-button\" value=\"\" /></a>");
		}
	});
	
	// hide appropriate gift request when accept gift button is clicked
	$( acceptButton ).click( function() {
		// set variables of required data to send via ajax
		var giftRequest = $(this).parent("span").parent("li");
			
		$(this).parent("span").html("Gift is on its way.");
		$(giftRequest).before("<li class='gift-accepted'></li>");

		//Process remote queue to show results in game instantly
		flashProcessQueue();
	});
	
	// resize div#gift-npc to the height of the gifts available IF the height is greater than 591
	var npc = $("div#gift-npc"),
		options = $("div#gift-options");
		
	if( options.height() > 591 ) {
		// define full height of options div including padding
		var optionsHeight = options.height(),
			npcHeight = optionsHeight + 18;
			
		$(npc).css("height", npcHeight);
	}
});
