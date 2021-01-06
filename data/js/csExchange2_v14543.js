$(function() {
	// Resize the page to the current page size - pull function from library.js
	resetPageSize();
	
	// set up variables for page
	var exchangePage = $("#exchange-welcome"),
		exchangeHeader = $("#exchange-header"),
		exchangeNpc = $("#exchange-npc"),
		currencyToggle = $("#toggle-currency"),
		currencyIcon = $("#currency-icon"),
		rubyOptions = $("#ruby-options"),
		goldOptions = $("#gold-options");
	
	$( exchangePage ).css("height", "635px");
	$( exchangeHeader ).css("background-position", "0px -286px");
	$( exchangeNpc ).addClass("gold-npc");
	$( currencyIcon ).css("background-position", "-463px -137px");	
	$( rubyOptions ).css("display", "none");
	
	$( currencyToggle ).toggle( function() {
			// show ruby options
			$( exchangePage ).css("height", "715px");
			$( exchangeHeader ).css("background-position", "0px 0px");
			$( exchangeNpc ).removeClass("gold-npc");
			$( exchangeNpc ).addClass("ruby-npc");
			$( currencyIcon ).css("background-position", "-463px -96px");
			$( currencyToggle ).attr("title", "Buy Gold");
			$( goldOptions ).css("display", "none");
			$( rubyOptions ).css("display", "block");
		}, function() {
			// show gold options
			$( exchangePage ).css("height", "635px");
			$( exchangeHeader ).css("background-position", "0px -286px");
			$( exchangeNpc ).removeClass("ruby-npc");
			$( exchangeNpc ).addClass("gold-npc");
			$( currencyIcon ).css("background-position", "-463px -137px");
			$( currencyToggle ).attr("title", "Buy Rubies");
			$( rubyOptions ).css("display", "none");
			$( goldOptions ).css("display", "block");
	});	
});