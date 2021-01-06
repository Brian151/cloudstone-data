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

function reloadPage()
{
	parent.location = BASE_URL;
}

function endTrial()
{
	document.location = BASE_URL + '?endTrial=true&kongregate_user_id=0';
}

function feedPost(name, link, picture, caption, description, message, subtype1, subtype2, subtype3)
{
	if(parent.kongregate.services.isGuest())
	{
		showMyLogin();
		return;
	}
	parent.kongregate.services.showFeedPostBox({
		content: caption,
		image_uri: picture,
		kv_params: {
			kv_doug: "Top doug!"
		}
	});
}



function rubiesTab()
{
	if(parent.kongregate.services.isGuest())
	{
		showMyLogin();
		return;
	}
	$('#game').flashHide();
	$('#content').show();
	$('#content').load("/main/rubies?uid="+UID);
}

function goldTab()
{
	if(parent.kongregate.services.isGuest())
	{
		showMyLogin();
		return;
	}
	$('#game').flashHide();
	$('#content').show();
	$('#content').load("/main/gold?uid="+UID);
}

function showGame()
{
	$('#content').hide();
	//$('#gz').show();
	$('#game').flashShow();
}

function resetPageSize()
{
	
}

function invite()
{
	if(parent.kongregate.services.isGuest())
	{
		showMyLogin();
		return;
	}
	parent.kongregate.services.showInvitationBox({
		content: "Come try out this awesome game!"
	});
}

function inviteFriends()
{
	if(parent.kongregate.services.isGuest())
	{
		showMyLogin();
		return;
	}
	invite();
}

function flashProcessQueue()
{
	//set the remote queue on a timeout to give us some confidence that the last action was processed
	setTimeout('document["pugmain"].processRemoteQueue();', 2500);
}

function purchase(id)
{
	if(parent.kongregate.services.isGuest())
	{
		showMyLogin();
		return;
	}
	parent.kongregate.mtx.purchaseItems([id], onPurchaseResult );
}
function onPurchaseResult(result)
{
	if(result.success)
	{
		$.post("/main/CheckKongregateInventory", function(data)
		{
			flashProcessQueue();
			showGame();
		});
	}
	else
	{
	}
}
function offers()
{
	if(parent.kongregate.services.isGuest())
	{
		showMyLogin();
		return;
	}
	parent.kongregate.mtx.showKredPurchaseDialog("offers");
}
function shout()
{
	if(!parent.kongregate.services.isGuest())
	{
		parent.kongregate.services.showShoutBox("I accidentally ate the whole thing!");
	}
}

///////// START KONTAGENT FUNCTIONS ////////////////

// For Flash Kontagent Calls
function trackEvent(userID, eventName, optionalParams)
{
	ktApi.trackEvent(userID, eventName, optionalParams);
}
	
function trackGoal(userId, optionalParams)
{
    ktApi.trackGoalCount(userId, optionalParams);
}

function trackKeepAlive(userId)
{
	if(userId == 'Guest')
		{
			return;
		}
	ktApi.trackPageRequest(userId, {pageAddress: 'flash'});
}