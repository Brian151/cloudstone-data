
function getFlashMovie(movieName) {
var isIE = navigator.appName.indexOf("Microsoft") != -1;
return (isIE) ? window[movieName] : document[movieName];
}


function flashSave()
{
	//getFlashMovie("MainFlash").saveBeforeCrash();
}
function flashProcessQueue()
{
	//set the remote queue on a timeout to give us some confidence that the last action was processed
	setTimeout('document["pugmain"].processRemoteQueue();', 2500);
}

function flashGeneratePauseImage()
{
    //document.getElementById('pugmain').generatePausedImage();
	document["pugmain"].generatePausedImage();
}

$(window).unload(function() {
  flashSave();
});

(function($){
  var hideClassName = 'flashHide';
  $.fn.extend({
    flashHide: function() {
      return this.each(function(){
        $(this).addClass(hideClassName);
      });
    },
    flashShow: function() {
      return this.each(function(){
        $(this).removeClass(hideClassName);
      });
    }
  });
})(jQuery);

// Call to place hold for current loading window
function loadPlaceHolder()
{
	$('#content').html("<img src='http://s3.amazonaws.com/playsaurus/loading.gif'>");
}

// Fix to push HTML out from behind the game window when it's loaded
$(function() {
	$('#game').after('<div id="game-pad"></div>');
});

$(function () {
	$("div.fb-like-box").hide();
});

function alliesTab()
{
	hideGame();
	showContent();
	removeTabHighlights();
	highlightTab("ally-tab");
	loadPlaceHolder();
	$('#content').load("/main/allies");
}

function friendsTab()
{
	hideGame();
	showContent();
	removeTabHighlights();
	highlightTab("play-tab");
	loadPlaceHolder();
	$('#content').load("/main/InviteFriends");
}

function giftsTab()
{
	hideGame();
	showContent();
	removeTabHighlights();
	highlightTab("gift-tab");
	loadPlaceHolder();
	$('#content').load("/main/gifts?");	
}

function helpTab()
{
	hideGame();
	showContent();
	removeTabHighlights();
	highlightTab("help-tab");
	loadPlaceHolder();
	$('#content').load("/main/help");
}

function goldTab()
{
	hideGame();
	showContent();
	removeTabHighlights();
	highlightTab("ruby-tab");
	loadPlaceHolder();
	$('#content').load("/main/gold");
}

function rubiesTab()
{
	hideGame();
	showContent();
	removeTabHighlights();
	highlightTab("ruby-tab");
	loadPlaceHolder();
	$('#content').load("/main/rubies");
}

function giftToFriend(friendId)
{
	hideGame();
	showContent();
	removeTabHighlights();
	highlightTab("gift-tab");
	loadPlaceHolder();
	$('#content').load("/main/gifts?friendId=" + friendId);
}

function showContent()
{
	$('#content').show();
}
function hideGame()
{
	$('#game').flashHide();	
	$('#game-pad').remove();
	$("div.fb-like-box").show();
	$("div#shortcuts-debug").hide();
	//$('#game').hide();
	//$('#game').css('top', '-10000px');
}

function showGame()
{
	$('#content').hide();
	removeTabHighlights();
	highlightTab("play-tab");
	$("div.fb-like-box").hide();
	$("div#shortcuts-debug").show();
	//$('#game').show();
	//$('#game').css('top', '100px');
	$('#game').flashShow();
	$('#game').after('<div id="game-pad"></div>');
}

function removeTabHighlights()
{
	$("ul.tabs").find("li").removeClass("selected");
}
function highlightTab(pageTab)
{
	$('li#' + pageTab).addClass("selected");
}

function giftAction(action, appRequestId)
{
	var data = { action: action, appRequestId: appRequestId },
		giftRequest = $(this).parent("span").parent("li");
	$.post('/main/ajaxGifts', data );
}

function allyAction(action, appRequestId)
{
	var data = { action: action, requestId: appRequestId };
	$.post('/main/ajaxAllies', data, function(data) { if(data != '') alert(data); });
}

function allyRequest(id)
{
	var data = { action: 'request', id: id };
	$.post('/main/ajaxAllies', data, function(data) { if(data != '') alert(data); });	
}


function removeAlly(id, removeButton, inviteButton)
{
	if(confirm('Are you sure?'))
	{
		var data = { removeAlly: true, id: id };
		$.post('/main/ajaxAllies', data, function(data) { if(data != '') alert(data); });
		$(removeButton).hide();
		$(inviteButton).show();
	}
}

// Resize the FB iframe to the current page height
function resetPageSize()
{
	var pageHeight = $("#fb-root").parent("body").height();
	FB.Canvas.setSize({ height: pageHeight });
}

// For Flash Kontagent Calls
function trackEvent(userID, eventName, optionalParams)
{
	var ktApi = FB.getKontagentApi();
	ktApi.trackEvent(userID, eventName, optionalParams);
}
	
function trackGoal(userId, optionalParams)
{
    var ktApi = FB.getKontagentApi();
    ktApi.trackGoalCount(userId, optionalParams);
	//alert('sending goal');
}

function trackCommClick(userId, type)
{
	var ktApi = FB.getKontagentApi();
	var shortTag = FB.getKontagentApi().genShortUniqueTrackingTag();
	var optionalParams = {
		userId: userId, 
		subtype1: "st1", 
		subtype2: "st2", 
		subtype3: "st3"
	};
	ktApi.trackThirdPartyCommClick(type, shortTag, optionalParams);
}

// Used in conjunction with Facebook's setURLhandler in order to process requests while on canvas page
function redirectAppRequest(request_ids)
{
	// Grab latest request_id
	var requestIds = request_ids.split(",");
	var requestId = requestIds.pop();
	FB.api("/" + requestId, function(data)
	{
		var strParts = data.data.split("|");
		var JSONdata = strParts[0];
		var dataObj = eval('(' + JSONdata + ')');
		var modelName = dataObj.model;
		console.log(modelName);
		if(modelName.indexOf("Gift") != -1)
		{
			giftsTab();
		}
		else if (modelName.indexOf("Ally") != -1)
		{
			alliesTab();
		}
	});
}

function hideFlash(params)
{
	if($('li#' + 'play-tab').hasClass("selected"))
	{
		if(params.state == 'opened')
		{	
			try
			{
				flashGeneratePauseImage();
			}
			catch (e)
			{
				$("#content").html("<img id='pauseContent' src=''><h1>Game is paused</h1>");
			}
			
			
		}
		else
		{
			$("#content").html("");
		}
	}
}

function placePauseImage(base64str)
{
    $("#content").html("<img src='data:image/jpeg;base64," + base64str + "'/>");
}



function checkNotifications()
{
	$.post('/main/getUserData', { self: true}, function (data) {
		var obj = JSON.parse(data);
		for (var notification in obj.notifications.notifications)
		{
			alert(obj.notifications.notifications[notification].text);
			$.post('/main/readNotification', { key: notification});
		}
	});
	setTimeout("checkNotifications()", 5000);
}

function displayFlashScreenshot() {
  // Call the Flash Actionscript method to create the dynamic screenshot data
  var screenshotData =
    document.getElementById('pugmain').exportScreenshot();

  // Set the screenshot image data as a base64 encoded data URI
  // in the img src attribute
  document.getElementById('screenshotObject').src = 'data:image/jpeg;base64,'
    + screenshotData;

  // Set the screenshot img dimensions to match the Flash object tag.
  document.getElementById('screenshotObject').width = flashObject.width;
  document.getElementById('screenshotObject').height = flashObject.height;
        
  // Move the Flash object off the screen and place the screenshot img
  document.getElementById('game').style.top = '-10000px';
  document.getElementById('imageContent').style.top = '';
}

function hideFlashScreenshot() {
  // Move the screenshot img off the screen and place the Flash object
  document.getElementById('game').style.top = '';
  document.getElementById('imageContent').style.top = '-10000px';
}

function onFlashHide(info) {
  if(info.state == 'opened') {
    displayFlashScreenshot();
  } else {
    hideFlashScreenshot();
  }
}