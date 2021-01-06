$(function() {
	// Resize the page to the current page size - pull function from library.js
	resetPageSize();
	
	// Hide game-pad div if player loads game into the allies page
	if( $('#game-pad') ){
		$('#game-pad').remove();
	}

	// ALLY PAGE CONTROLS
	// initialise variables for existing ally elements
	var allyIndicator = $(".ally-actions").find("span.ally-true"),
		ally = $(allyIndicator).parent("span").parent("li"),
		allyAvatar = $(ally).find("span.player-avatar img"),
		allyLvl = $(ally).find("span.lvl-box"),
		allyXp = $(ally).find("span.xp-box");
	
	// initialise variables for ally action buttons
	var	allyConfirm = $(".confirm"),
		allyIgnore = $(".ignore"),
		allyRequest = $(".request"),
		allyRemove = $(".remove");
	
	// update css for existing allies so they stand out more
	$(ally).css("background-position", "0px -124px");
	$(ally).css("color", "#d2880c");
	$(allyAvatar).css("border", "3px solid #d2880c");
	$(allyAvatar).css("-moz-border-radius", "3px");
	$(allyAvatar).css("border-radius", "3px");
	$(allyAvatar).css("margin", "0 15px 0 0");	
	$(allyLvl).css("background-color", "#d2880c");
	$(allyXp).css("background-color", "#d2880c");
		
	// ally request button clicked
	$( allyRequest ).click( function() {
		$( this ).parent("span").html("<span class='button-response'>Request sent!</span>");
	});
	
	// confirm button clicked to accept ally request
	$( allyConfirm ).click( function() {
		$( this ).parent("span").parent("span").html("Ally confirmed:");

		//Process remote queue to show results in game instantly
		flashProcessQueue();
	});
	
	// ignore button clicked to ignore ally request
	$( allyIgnore ).click( function() {
		$( this ).parent("span").parent("span").html("Ally request ignored:");
	});
	
	// remove button clicked to remove an existing ally
	$( allyRemove ).click( function() {
		var thisAlly = $( this ).parent("span").parent("span").parent("li"),
			thisAllyGift = $( this ).parent("span").parent("span").find("input.gift-ally");
		
		// update ally css
		$( thisAlly ).css("background-position", "0px 0px");
		$( thisAlly ).css("color", "#7fa59a");
		$( thisAlly ).find("span.player-avatar img").css("border", "3px solid #7fa59a");
		$( thisAlly ).find("span.lvl-box").css("background-color", "#7fa59a");
		$( thisAlly ).find("span.xp-box").css("background-color", "#7fa59a");
		$( this ).parent("span").removeClass("ally-true");
		$( thisAllyGift ).removeClass("gift-ally");
		$( thisAllyGift ).addClass("gift");
		
		// confirm removal
		$( this ).parent("span").html("<span class='button-response'>Removed</span>");
	});
	
	// OPEN INVITE FRIENDS WINDOW
	var inviteAlliesWindow = $(".invite-more-friends"),
		inviteAlliesButton = $(".invite");
	
	$( inviteAlliesWindow ).css("display", "none");
	
	$( inviteAlliesButton ).click( function() {
		$( inviteAlliesWindow ).toggle();
	});
});
