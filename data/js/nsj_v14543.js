/**
 *
 *
 **/
var SUBTYPE_PROGRESSION = "progression";
var SUBTYPE_TUTORIAL = "tutorial";
var SUBTYPE_LEVEL_UP = "level_up";
var SUBTYPE_QUEST = "quest";
var SUBTYPE_PURCHASE = "purchase";
var EVENT_TUTORIAL_START = "tutorial_start";
var EVENT_TUTORIAL_COMPLETE = "tutorial_complete";
var EVENT_LEVEL_UP_STUB = "level_up_";
var EVENT_QUEST_STUB = "quest_";
var EVENT_PURCHASE_STUB = "purchase_";

/**
 * Variable declaration
 **/
var NSJ = {};
NSJ._gameCode = "";
NSJ._applifierID = undefined;
NSJ._ktApi = null;
NSJ._installTrackerURL = null;
NSJ._me = null;


/**
 * Initializes everything.
 * 
 *
 **/
/**
 * @param gameCode should be a short string, usually two or three letters.
 * @param kaApiKey should be the string used to access Kontagent. Available from the web page.
 * @param installTrackerURL should be the url given by Nexon for tracking information
 * @param applifierID the ID given by applifier for this game
 * @param useTestServer set this to true to use the test server of Kontagent
 */
NSJ.init = function(gameCode, ktApiKey, installTrackerURL, applifierID, useTestServer) {
	if (undefined===useTestServer) {
		useTestServer = false;
	}
	NSJ._gameCode = gameCode;
	NSJ._applifierID = applifierID;
	NSJ._initKt(ktApiKey, useTestServer);
	NSJ._installTrackerURL = installTrackerURL;
}


/**
 * This function can be used to access kontagent directly.
 */
NSJ.getKtApi = function() {
	return NSJ._ktApi;
}


/**
 * NSJ Tracking functions.
 *
 **/
NSJ.callInstallTracker = function(fbuid) {
	if (null!=NSJ._installTrackerURL) {
		NSJ._installTracker(fbuid);
	}
}

/**
 * Should be called as soon as the fbuid is obtained.
 */
NSJ.trackPageRequest = function(fbuid) {
	// We don't need to worry about sending this track message too often, because Kontagent keeps track of time to seperate sessions
	NSJ._ktApi.trackPageRequest(fbuid);
}


/**
 * Send user info to Kontagent, but only once a day at most
 */
NSJ.trackUserInfo = function() {
	var trackUserInfoCookie = NSJ._getCookie('trackUserInfo');
	if (null!=trackUserInfoCookie) {
		FB.api("/me",function(meResponse) {
			NSJ._trackUserInformation(meResponse);
		});
		NSJ._setCookie('trackUserInfo', 'yes', 1);
	}
}

NSJ.trackUserInfoWithResponse = function(meResponse) {
	var trackUserInfoCookie = NSJ._getCookie('trackUserInfo');
	if (null!=trackUserInfoCookie) {
		NSJ._trackUserInformation(meResponse);
		NSJ._setCookie('trackUserInfo', 'yes', 1);
	}
}

/**
 * Call to signify the start of the tutorial
 * @param fbuid user's FB ID
 * @param level integer value, should probably be 1 for this
 */
NSJ.trackTutorialStart = function(fbuid, level) {
	var params = {
		"subtype1":SUBTYPE_PROGRESSION,
		"subtype2":SUBTYPE_TUTORIAL,
		"level":level
	};
	NSJ._ktApi.trackEvent(fbuid, EVENT_TUTORIAL_START, params);
}

/**
 * Call to signifiy the end of the tutorial
 * @param fbuid user's FB ID
 * @param level integer value
 */
NSJ.trackTutorialComplete = function(fbuid, level) {
	var params = {
		"subtype1":SUBTYPE_PROGRESSION,
		"subtype2":SUBTYPE_TUTORIAL,
		"level":level
	};
	NSJ._ktApi.trackEvent(fbuid, EVENT_TUTORIAL_COMPLETE, params);
}

/**
 * Called whenever the user's level goes up. If there's no clear "Level" in the game, something else that indicates progression can be used.
 * @param fbuid user's FB ID
 * @param level integer value
 */
NSJ.trackLevelUp = function(fbuid, level) {
	var params = {
		"subtype1":SUBTYPE_PROGRESSION,
		"subtype2":SUBTYPE_LEVEL_UP,
		"level":level
	};
	NSJ._ktApi.trackEvent(fbuid, EVENT_LEVEL_UP_STUB+level.toString(), params);
}

/**
 * Called whenever a quest is completed
 * @param fbuid A String indicating the user's FB ID
 * @param questID A human readable string that identifies the quest
 * @param level the level at which the player completed the quest
 * @param questCatalog (Optional) a string to categorize the quest
 * @param questSubCatalog (Optional) a string to further categorize the quest
 * @param value (Optional) a value that can be used to store a numerical data associated with the quest
 */
NSJ.trackQuest = function(fbuid, questID, level, questCatalog, questSubCatalog, value) {
	var params = {
		"subtype":SUBTYPE_QUEST,
		"level":level
	};
	if (undefined!==questCatalog) {
		params['subtype2'] = questCatalog;
		if (undefined!==questSubCatalog) {
			params['subtype3'] = questSubCatalog;
		}
	}
	if (undefined!==value) {
		params['value'] = value;
	}
	NSJ._ktApi.trackEvent(fbuid, EVENT_QUEST_STUB+questID, params);
}


/**
 * Called whenever user makes a monetary purchase
 * @param type A string value. If FB Credit, then it should use "direct".
 * @param itemID A string value. The identifier for the item. Should be a human readable, but concise, tag.
 * @param price The price of the item in cents.
 * @param level The current "level" of the player.
 * @param category (Optional)The category of the item.
 * @param subCategory (Optional)The subcategory of the item.
 */
NSJ.trackItemPurchase = function(fbuid, type, itemID, price, level, category, subCategory) {
	var revenueParams = {
		"type":type
	};
	NSJ._ktApi.trackRevenue(fbuid, price, revenueParams);
	
	var params = {
			"subtype1":SUBTYPE_PURCHASE,
			"level":level
	};
	if (undefined!==category) {
		params['subtype2'] = category;
		if (undefined!==subCategory) {
			params['subtype3'] = subCategory;
		}
	}
	NSJ._ktApi.trackEvent(fbuid, EVENT_PURCHASE_STUB+itemID, params);
}


/**
 * NSJ Banner loading functions
 *
 **/
NSJ.createHeader = function(headerCallback) {
	var callbackWrapper = function(data) {
		var headerDiv = document.createElement('div');
		headerDiv.innerHTML = data;
		headerCallback(headerDiv);
	}
	
	/*
	$.ajax({
		url:"../nsj_backend/header.php",
		success:callbackWrapper
	});
	*/
	
	var headerString = "" +
	"<iframe id=\"top_banner\" src=\"http://dndtflmyv9r9w.cloudfront.net/socialplatform/facebook/"+NSJ._gameCode+"/app/html/nx-nav.html\" width=\"100%\" height=\"116\" scrolling=\"no\" style=\"overflow: hidden;\" frameBorder=\"0\"></iframe>" +
	"";
	
	callbackWrapper(headerString);
}

/**
 * This method is for obtaining the HTML for the footer, and connecting that via callback function.
 * @param footerCallback the callback Function will receive an div element which should be connected to the html
 */
NSJ.createFooter = function(footerCallback) {
	var callbackWrapper = function(data) {
		var footerDiv = document.createElement('div');
		footerDiv.innerHTML = data;
		footerCallback(footerDiv);
		NSJ._initApplifier();
	}
	
	var footerString = "" +
	"<div id=\"applifierPanel\">" +
	"	<!-- Applifier cross-promo code begin -->" +
	"	<div id=\"applifier_bar\"></div>" +
	"	<!-- Applifier cross-promo code end -->" +
	"</div>" +
	"<div class=\"footer\">" +
	"	<ul>" +
	"		<li><a href=\"<?php echo $SUPPORT_LINK ?>\" target=\"_blank\">Support</a> |</li>" +
	"		<li><a id=\"tos\" class=\"popup\">Terms of Service</a> |</li>" +
	"		<li><a id=\"pp\" class=\"popup\">Privacy Policy</a></li>" +
	"   </ul>" +     
	"</div>";
	
	callbackWrapper(footerString);
}


/**
 * 
 * Below are private methods or utility methods.
 * 
 */

NSJ._initKt = function(ktApiKey, useTestServer) {
	NSJ._ktApi = new KontagentApi(ktApiKey, {"useTestServer":useTestServer});
}


/**
 * Track user's page request, which is the same as tracking a login or a game session.
 *
 **/

//Sends demographic info to Kontagent.
//Uses cookies to try to send only once a day at most.
NSJ._trackUserInformation = function(meResponse) {
	var responseParam = {};
	if (meResponse.gender) {
		responseParam['gender'] = meResponse.gender.substring(0, 1);
	}
	if (meResponse.birthday) {
		var birthdayPieces = apiMeResponse.birthday.split('/');
		if (birthdayPieces.length == 3) {
			responseParam['brithYear'] = birthdayPieces[2];
		}
	}
	NSJ._ktApi.trackUserInformation(meResponse.id, responseParam);
}

 /**
  * 
  * send a packet to our Install Tracker
  */
 NSJ._installTracker = function(userID) {
     var request =
     {
      "fbid" : userID,       // Facebook Users unique id
      "referrer" : "Normal"
     }
     var reqStr = JSON.stringify(request);
     NSJ._makeCORSRequest("POST", NSJ._installTrackerURL, reqStr, null);
 }

 /**
  * Simple function for making HTTP calls.
  */
  NSJ._makeCORSRequest = function(method, url, data, callback) {
      var xhr = new XMLHttpRequest();
      if ("withCredentials" in xhr){
          xhr.open(method, url, true);
          xhr.setRequestHeader ("Content-Type", "text/plain; charset=UTF-8");
      } else if (typeof XDomainRequest != "undefined"){
          xhr = new XDomainRequest();
          xhr.open(method, url);
      } else {
          xhr = null;
      }
      if (xhr) {
          xhr.onload = function() {
              var response = {};
              if(xhr.responseText) {
                  response.responseText = xhr.responseText;
                  response.httpStatusCode = "200";

                   if(xhr.status)
                      response.httpStatusCode = xhr.status;
                       callback(response);
              }
          };
           xhr.onerror = function(e) {
              if(e) {
                  callback(e);
              } else {
                  callback("Error occurred.");
              }
           };
           //xhr.send(jQuery.toJSON(data));
           xhr.send(data);
      } else {
          Log("CORS is not supported in this browser");
      }
  }
 
NSJ._setCookie = function(name, value, days) {
	var expiration = new Date();
	expiration.setTime(date.getTime()+(days*24*60*60*1000));
	var expires = "; expires="+expiration.toGMTString();
	document.cookie = name+"-"+value+expires+"; path=/";
}

NSJ._getCookie = function (name) {
	var nameEQ = name + "=";
	var cookieArray = document.cookie.split(';');
	for (var i=0; i<cookieArray.length; ++i) {
		var cookie = cookieArray[i];
		while (cookie.charAt(0)==' ') {
			cookie = cookie.substring(1, cookie.length);
			if (0==cookie.indexOf(nameEQ)) {
				return cookie.substring(nameEQ.length, cookie.length);
			}
		}
	}
	return null;
}

NSJ._initApplifier = function() {
	if (undefined!==NSJ._applifierID) {
		(function() {
			window.applifierAsyncInit = function() {
				var bar = new Applifier.Bar({applicationId: NSJ._applifierID, barType: "bar", barContainer: "#applifier_bar"});
			};

			var a = document.createElement('script'); a.type = 'text/javascript'; a.async = true;
			a.src = (('https:' == document.location.protocol) ? 'https://secure' : 'http://cdn') + '.applifier.com/applifier.min.js';
			var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(a, s);
		})();
	}
}