$(function() {
	// Resize the page to the current page size - pull function from library.js
	resetPageSize();
	
	// HELP PAGE CONTROLS
	// initialise variables for questions and answers
	var qa = $(".help-welcome ul li"),
		question = $(".question"),
		answers = $(".answer");
		
	// hide answers on page load to reduce page size
	$( answers ).css("display", "none");
	
	// toggle answer visibility when questions are clicked on
	$( question ).click( function() {
		// set variable for relevant answer to the question clicked
		var answer = $( this ).parent("li").find(".answer");
		
		$( answer ).toggle();		
		$( answer ).parent("li.q-closed").toggleClass("q-open");
	});
});
