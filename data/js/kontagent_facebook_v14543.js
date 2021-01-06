// Clone the Facebook JS SDK so we can override its methods
var BASE_FB = {};


function setKtParams() {
    BASE_FB.init = FB.init;
    BASE_FB.login = FB.login;
    BASE_FB.ui = FB.ui;
    BASE_FB.api = FB.api;
    // reference to Kontagent API object. Instantiated in FB.init().
    FB._ktApi = null;
    bindToFacebookSDK();
    if (window.fbAsyncInit) {
        BASE_FB.callback();
    }
}

function bindToFacebookSDK() {

    FB.getKontagentApi = function() {

        return FB._ktApi;
    }


    FB.init = function(options) {
        BASE_FB.init(options);

        // instantiate Kontagent API object
        FB._ktApi = new KontagentApi(KT_API_KEY, {
            "useTestServer": KT_USE_TEST_SERVER, 
            "useHttps": (KT_USE_HTTPS == 'auto') ? FB._isHttps() : KT_USE_HTTPS
        })


        // Perform the landing page tracking. The timeout/delay is neccessary
        // otherwise
        // FB will throw an error if we start making API calls too quickly.
        setTimeout("FB._trackLanding()", 1000);
    }

    FB.login = function (cb, opts) {
        // Override the callback function to also send off an ApplicationAdded and
        // UserInformation
        // message on success.
        var ktCb = function (loginResponse) {
            if (loginResponse.authResponse) {
                // Track Application Added
                FB._ktApi.trackApplicationAdded(loginResponse.authResponse.userID, {
                    "uniqueTrackingTag": (KT_GET["kt_u"]) ? KT_GET["kt_u"] : null,
                    "shortUniqueTrackingTag": (KT_GET["kt_su"]) ? KT_GET["kt_su"] : null
                });
                
                FB._trackUserInformation();
                FB._trackSpruceMedia();
            }
            
            // Fire off the original callback
            if (cb) {
                cb(loginResponse);
            }
        }


        BASE_FB.login(ktCb, opts);

    }

    FB.ui = function (params, cb) {
        var ktCb = cb;
        var authResponse = FB.getAuthResponse();
        
        // Make sure the user is logged in and authenticated
        if (authResponse && authResponse.userID) {	
            // Implement the appropriate callback depending on what method they are
                // trying to call.
            switch(params.method.toLowerCase()) {
                case 'apprequests':
                    var uniqueTrackingTag = FB._ktApi.genUniqueTrackingTag();
                
                    // Append Kontagents tracking parameters to the data param.
                    params.data = FB._appendKtVarsToDataField(params.data, {
                        "kt_track_inr": 1,
                        "kt_u": uniqueTrackingTag,
                        "kt_st1": params.subtype1,
                        "kt_st2": params.subtype2,
                        "kt_st3": params.subtype3
                    });
                    
                    ktCb = function(uiResponse) {
                        if (uiResponse) {
                            if (uiResponse.request_ids && uiResponse.request_ids.length > 0) {
                                // Non-efficient requests, we need to make an extra call to retrieve the recipient UIDs
                                FB._getRecipientUserIdsFromRequestIds(uiResponse.request_ids.join(','), function(response) {
                                    FB._ktApi.trackInviteSent(authResponse.userID, response.recipientUserIds, uniqueTrackingTag, {
                                        "subtype1": params.subtype1,
                                        "subtype2": params.subtype2,
                                        "subtype3": params.subtype3
                                    });
                                });
                            } else if (uiResponse.request && uiResponse.to && uiResponse.to.length > 0) {
                                // "Request 2.0 Efficient" mode. We have access to the UIDs
                                FB._ktApi.trackInviteSent(authResponse.userID, uiResponse.to.join(','), uniqueTrackingTag, {
                                    "subtype1": params.subtype1,
                                    "subtype2": params.subtype2,
                                    "subtype3": params.subtype3
                                });
                            }
                        }
                        
                        if (cb) {
                            cb(uiResponse);
                        }
                    };
                    break;
                    
                case('feed'):
                    var uniqueTrackingTag = FB._ktApi.genUniqueTrackingTag();
                    




                    if (params.link) {
                        params.link = FB._appendKtVarsToUrl(KT_REDIRECT_URL, {
                            "kt_track_psr": 1,
                            "kt_u": uniqueTrackingTag,
                            "kt_st1": params.subtype1,
                            "kt_st2": params.subtype2,
                            "kt_st3": params.subtype3,
                            "kt_redir_url": params.link
                        });
                    }

                    if (params.actions && params.actions.length && params.actions.length > 0) {
                        for(var i=0; i<params.actions.length; i++) {
                            if (params.actions[i]['link']) {
                                params.actions[i]['link'] = FB._appendKtVarsToUrl(PATH_TO_REDIRECT_PAGE, {
                                    "kt_track_psr": 1,
                                    "kt_u": uniqueTrackingTag,
                                    "kt_st1": params.subtype1,
                                    "kt_st2": params.subtype2,
                                    "kt_st3": params.subtype3,
                                    "kt_redir_url": params.actions[i]['link']
                                });
                            }
                        }
                    }


                    ktCb = function(uiResponse) {
                        if (uiResponse && uiResponse.post_id) {
                            FB._ktApi.trackStreamPost(authResponse.userID, uniqueTrackingTag, 'stream', {
                                "subtype1": params.subtype1,
                                "subtype2": params.subtype2,
                                "subtype3": params.subtype3
                            });
                        }
                        
                        if (cb) {
                            cb(uiResponse);
                        }
                    };
                    break;
                case("oauth"):
                    // TODO: implement this. Currently, there is a bug in FB SDK.
                    // NOTE: remember to check for presence of KT_GET['su']//KT_GET['u']
                    break;
            }

        }


        BASE_FB.ui(params, ktCb);
    }

    FB._trackLanding = function()

    {

        var authResponse = FB.getAuthResponse();


        // Page Requests are always tracked on the client side.
        if (authResponse && authResponse.userID) {
            FB._ktApi.trackPageRequest(authResponse.userID);

        }






        if (KT_SEND_CLIENT_SIDE) {
            if (authResponse && authResponse.userID) {





                //if (KT_GET['kt_track_apa'] && !KT_GET['error']) {
                    if (!KT_IS_INSTALLED_SESSION_SET) {

                        FB._ktApi._sendHttpRequestViaImgTag(KT_REDIRECT_URL + "?kt_set_session=1");
                        KT_IS_INSTALLED_SESSION_SET = true;


                        FB._ktApi.trackApplicationAdded(authResponse.userID, {
                            "uniqueTrackingTag": (KT_GET['kt_u']) ? KT_GET['kt_u'] : null,
                            "shortUniqueTrackingTag": (KT_GET['kt_su']) ? KT_GET['kt_su'] : null
                        });



                        FB._trackUserInformation();
                    }
                    
                    FB._trackSpruceMedia();	

                //}





                
                if (KT_GET['kt_track_ins']) {
                    if (KT_GET['request_ids'] && FB._isArray(KT_GET['request_ids'])) {
                        // Non-efficient Requests, we need to make an extra call to get the uids
                        FB._getRecipientUserIdsFromRequestIds(KT_GET['request_ids'].join(','), function(response) {
                            FB._ktApi.trackInviteSent(
                                authResponse.userID, 
                                response.recipientUserIds,
                                KT_GET['kt_u'],
                                {
                                    "subtype1": (KT_GET['kt_st1']) ? KT_GET['kt_st1'] : null,
                                    "subtype2": (KT_GET['kt_st2']) ? KT_GET['kt_st2'] : null,
                                    "subtype3": (KT_GET['kt_st3']) ? KT_GET['kt_st3'] : null
                                }
                            );
                        });
                    } else if (KT_GET['request'] && KT_GET['to'] && FB._isArray(KT_GET['to'])) {
                        // Request 2.0 Efficient mode, we have direct access to recipeint uids
                        FB._ktApi.trackInviteSent(
                            authResponse.userID, 
                            KT_GET['to'].join(','),
                            KT_GET['kt_u'],
                            {
                                "subtype1": (KT_GET['kt_st1']) ? KT_GET['kt_st1'] : null,
                                "subtype2": (KT_GET['kt_st2']) ? KT_GET['kt_st2'] : null,
                                "subtype3": (KT_GET['kt_st3']) ? KT_GET['kt_st3'] : null
                            }
                        );
                    }
                }
            
                if (KT_GET['kt_track_pst'] && KT_GET['post_id']) {
                    FB._ktApi.trackStreamPost(authResponse.userID, KT_GET['kt_u'], 'stream', {
                        "subtype1": (KT_GET['kt_st1']) ? KT_GET['kt_st1'] : null,
                        "subtype2": (KT_GET['kt_st2']) ? KT_GET['kt_st2'] : null,
                        "subtype3": (KT_GET['kt_st3']) ? KT_GET['kt_st3'] : null
                    });
                }
            }
            
            if (KT_GET['kt_track_psr']) {
                FB._ktApi.trackStreamPostResponse(KT_GET['kt_u'], 'stream', {
                    "recipientUserId": (authResponse && authResponse.userID) ? authResponse.userID : null,
                    "subtype1": (KT_GET['kt_st1']) ? KT_GET['kt_st1'] : null,
                    "subtype2": (KT_GET['kt_st2']) ? KT_GET['kt_st2'] : null,
                    "subtype3": (KT_GET['kt_st3']) ? KT_GET['kt_st3'] : null
                });
            }
            
            if (KT_GET['kt_type']) {
                // The shortUniqueTrackingTag is generated on the serverside landing
                // method.
                FB._ktApi.trackThirdPartyCommClick(KT_GET['kt_type'], KT_GET['kt_su'], {
                    "userId": (authResponse && authResponse.userID) ? authResponse.userID : null,
                    "subtype1": (KT_GET['kt_st1']) ? KT_GET['kt_st1'] : null,
                    "subtype2": (KT_GET['kt_st2']) ? KT_GET['kt_st2'] : null,
                    "subtype3": (KT_GET['kt_st3']) ? KT_GET['kt_st3'] : null
                });
            }
        }

    }

    // Appends KT tracking parameters to the data field of the Requests Dialog
    // (see FB documentation for details).

    FB._appendKtVarsToDataField = function(dataString, vars) 
    {

        dataString += '|';
        
        for (var key in vars) {
            if (vars[key] != null && typeof vars[key] != 'undefined') {
                dataString += key + '=' + vars[key] + '&';
            }
        }
        
        return FB._removeTrailingAmpersand(dataString);

    }

    // Appends variables to a given URL. "vars" dataStringshould be an object
    // in the form: {"var_name": var_value, ...}
    FB._appendKtVarsToUrl = function(url, vars) 
    {

        if (url.indexOf('?') == -1) {
            url += '?';
        } else {
            url += '&';

        }

        for (var key in vars) {
            if (vars[key] != null && typeof vars[key] != 'undefined') {
                url += key + '=' + vars[key] + '&';
            }
        }
        
        return FB._removeTrailingAmpersand(url);
    }


    FB._trackUserInformation = function()
    {
        // Track the User Information

        BASE_FB.api('/me', function(apiMeResponse) {

            BASE_FB.api('/me/friends', function(apiFriendsResponse) {
                var gender, birthYear, friendCount;


                if (apiMeResponse.gender) {
                    gender = apiMeResponse.gender.substring(0,1);
                }
                if (apiMeResponse.birthday) {
                    var birthdayPieces = apiMeResponse.birthday.split('/');
                
                    if (birthdayPieces.length == 3) {
                        birthYear = birthdayPieces[2];
                    }
                }
                if (apiFriendsResponse.data) {
                    friendCount = apiFriendsResponse.data.length;
                }
                
                FB._ktApi.trackUserInformation(apiMeResponse.id, {
                    "gender": gender,
                    "birthYear": birthYear,
                    "friendCount": friendCount
                });
            });
        });

    }



    FB._trackSpruceMedia = function() {
        // Spruce Media Ad Tracking
        if (KT_GET['spruce_adid']) {
            FB._ktApi._sendHttpRequestViaImgTag(window.location.protocol + "//bp-pixel.socialcash.com/100480/pixel.ssps?spruce_adid=" + KT_GET["spruce_adid"] + "&spruce_sid=" + FB._ktApi.genShortUniqueTrackingTag());
        }

    }

    // Given a comma-separated list of requestIds will return the recipient userIds (comma-separated)
    FB._getRecipientUserIdsFromRequestIds = function(requestIds, callback)
    {
        BASE_FB.api('', {"ids": requestIds}, function(response) {
            var recipientUserIds = '';
        
            for(var key in response) {
                recipientUserIds += response[key].to.id + ',';
            }
            
            recipientUserIds = FB._removeTrailingComma(recipientUserIds);
            
            callback({"recipientUserIds": recipientUserIds});
        });

    }

    // Returns whether the current URL is HTTPS

    FB._isHttps = function()
    {
        if (window.location.protocol == 'https:') {

            return true;
        } else {
            return false;
        }
    }

    // Returns true of the variable is an array, false otherwise.
    FB._isArray = function(variable) {
        if (!variable) {
            return false;
        } else if (variable instanceof Array) {

            return true;
        } else {
            return false;
        }
    }

    FB._removeTrailingAmpersand = function(string) 
    {

        if (string.charAt(string.length-1) == '&') {
            return string.slice(0, -1);
        } else {
            return string;
        }
    }

    FB._removeTrailingComma = function(string) 
    {

        if (string.charAt(string.length-1) == ',') {
            return string.slice(0, -1);
        } else {
            return string;
        }
    }

}

////////////////////////////////////////////////////////////////////////////////

/*
* Kontagent class constructor
*
* @constructor
*
* @param {string} apiKey The app's Kontagent API key
* @param {object} [optionalParams] An object containing paramName => value
* @param {bool} [optionalParams.useTestServer] Whether to send messages to the Kontagent Test Server
* @param {bool} [optionalParams.validateParams] Whether to validate the parameters passed into the tracking method
*/
function KontagentApi(apiKey, optionalParams) {
	this._baseApiUrl = "http://api.geo.kontagent.net/api/v1/";
	this._baseHttpsApiUrl = "https://api.geo.kontagent.net/api/v1/";
	this._baseTestServerUrl = "http://test-server.kontagent.com/api/v1/";

	this._apiKey = apiKey;

	if (optionalParams) {
		this._useTestServer = (optionalParams.useTestServer) ? optionalParams.useTestServer : false;
		this._useHttps = (optionalParams.useHttps) ? optionalParams.useHttps : false;
		this._validateParams = (optionalParams.validateParams) ? optionalParams.validateParams : false;
	}
}

/*{
* Sends an HTTP request by creating an <img> tag given a URL.
*
* @param {string} url The request URL
* @param {function} [successCallback] The callback function to execute once message has been sent successfully
*/
KontagentApi.prototype._sendHttpRequestViaImgTag = function(url, successCallback)
{
	var img = new Image();
	
	// The onerror callback will always be triggered because no image header is returned by our API.
	// Which is fine because the request would have still gone through.
	if (successCallback) {
		img.onerror = successCallback;
		img.onload = successCallback;
	}

	img.src = url;
}

/*
* Sends the API message by creating an <img> tag.
*
* @param {string} messageType The message type to send ('apa', 'ins', etc.)
* @param {object} params An object containing paramName => value (ex: 's'=>123456789)
* @param {function} [successCallback] The callback function to execute once message has been sent successfully
* @param {function(error)} [validationErrorCallback] The callback function to execute on validation failure
*/
KontagentApi.prototype._sendMessage = function(messageType, params, successCallback, validationErrorCallback) {
	// add a timestamp param to prevent browser caching
	params['ts'] =  new Date().getTime();

	if (this._validateParams == true) {
		var result;

		for (var paramKey in params) {
			result = KtValidator.validateParameter(messageType, paramKey, params[paramKey]);

			if (result != true) {
				if (validationErrorCallback) {
					validationErrorCallback(result);
				}

				return;
			}
		}
	}

	var url;	

	if (this._useTestServer == true) {
		url = this._baseTestServerUrl + this._apiKey + "/" + messageType + "/?" + this._httpBuildQuery(params);
	} else {
		if (this._useHttps == true) {
			url = this._baseHttpsApiUrl + this._apiKey + "/" + messageType + "/?" + this._httpBuildQuery(params);
		} else {
			url = this._baseApiUrl + this._apiKey + "/" + messageType + "/?" + this._httpBuildQuery(params);
		}
	}

	this._sendHttpRequestViaImgTag(url, successCallback);
}

/*
* Generate URL-encoded query string (same as PHP's http_build_query())
*
* @param {object} data The object containing key, value data to encode
*
* @return {string) A URL-encoded string
*/
KontagentApi.prototype._httpBuildQuery = function(data) {
	var query, key, val;
	var tmpArray = [];

	for(key in data) {
		val = encodeURIComponent(decodeURIComponent(data[key].toString()));
		key = encodeURIComponent(decodeURIComponent(key));

		tmpArray.push(key + "=" + val);  
	}

	return tmpArray.join("&");
}

/*
* Returns random 4-character hex
*
* @return {string} Random 4-character hex value
*/
KontagentApi.prototype._s4 = function() {
	return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

/*
* Generates a unique tracking tag.
*
*  @return {string} The unique tracking tag
*/
KontagentApi.prototype.genUniqueTrackingTag = function() {
	var uniqueTrackingTag = "";
	
	for(i=0; i<4; i++) {
		uniqueTrackingTag += this._s4();
	}
	
	return uniqueTrackingTag;
}

/*
* Generates a short unique tracking tag.
*
*  @return {string} The short unique tracking tag
*/
KontagentApi.prototype.genShortUniqueTrackingTag = function() {
	var shortUniqueTrackingTag = "";
	
	for(i=0; i<2; i++) {
		shortUniqueTrackingTag += this._s4();
	}
	
	return shortUniqueTrackingTag;

}

/*
* Sends an Invite Sent message to Kontagent.
*
* @param {int} userId The UID of the sending user
* @param {string} recipientUserIds A comma-separated list of the recipient UIDs
* @param {string} uniqueTrackingTag 32-digit hex string used to match 
* 	InviteSent->InviteResponse->ApplicationAdded messages. 
* 	See the genUniqueTrackingTag() helper method.
* @param {object} [optionalParams] An object containing paramName => value
* @param {string} [optionalParams.subtype1] Subtype1 value (max 32 chars)
* @param {string} [optionalParams.subtype2] Subtype2 value (max 32 chars)
* @param {string} [optionalParams.subtype3] Subtype3 value (max 32 chars)
* @param {function} [successCallback] The callback function to execute once message has been sent successfully
* @param {function(error)} [validationErrorCallback] The callback function to execute on validation failure
*/
KontagentApi.prototype.trackInviteSent = function(userId, recipientUserIds, uniqueTrackingTag, optionalParams, successCallback, validationErrorCallback) {
	var apiParams = {
		s : userId,
		r : recipientUserIds,
		u : uniqueTrackingTag
	};
	
	if (optionalParams != null && typeof optionalParams != 'undefined') {
		if (optionalParams.subtype1) { apiParams.st1 = optionalParams.subtype1; }
		if (optionalParams.subtype2) { apiParams.st2 = optionalParams.subtype2; }
		if (optionalParams.subtype3) { apiParams.st3 = optionalParams.subtype3; }
	}

	this._sendMessage("ins", apiParams, successCallback, validationErrorCallback);
}

/*
* Sends an Invite Response message to Kontagent.
*
* @param {string} uniqueTrackingTag 32-digit hex string used to match 
*	InviteSent->InviteResponse->ApplicationAdded messages. 
*	See the genUniqueTrackingTag() helper method.
* @param {object} [optionalParams] An object containing paramName => value
* @param {string} [optionalParams.recipientUserId] The UID of the responding user
* @param {string} [optionalParams.subtype1] Subtype1 value (max 32 chars)
* @param {string} [optionalParams.subtype2] Subtype2 value (max 32 chars)
* @param {string} [optionalParams.subtype3] Subtype3 value (max 32 chars)
* @param {function} [successCallback] The callback function to execute once message has been sent successfully
* @param {function(error)} [validationErrorCallback] The callback function to execute on validation failure
*/
KontagentApi.prototype.trackInviteResponse = function(uniqueTrackingTag, optionalParams, successCallback, validationErrorCallback) {
	var apiParams = {
		i : 0,
		u : uniqueTrackingTag
	};
	
	if (optionalParams != null && typeof optionalParams != 'undefined') {
		if (optionalParams.recipientUserId) { apiParams.r = optionalParams.recipientUserId; }
		if (optionalParams.subtype1) { apiParams.st1 = optionalParams.subtype1; }
		if (optionalParams.subtype2) { apiParams.st2 = optionalParams.subtype2; }
		if (optionalParams.subtype3) { apiParams.st3 = optionalParams.subtype3; }
	}	
	
	this._sendMessage("inr", apiParams, successCallback, validationErrorCallback);
}

/*
* Sends an Notification Sent message to Kontagent.
*
* @param {int} userId The UID of the sending user
* @param {string} recipientUserIds A comma-separated list of the recipient UIDs
* @param {string} uniqueTrackingTag 32-digit hex string used to match 
*	NotificationSent->NotificationResponse->ApplicationAdded messages. 
*	See the genUniqueTrackingTag() helper method.
* @param {object} [optionalParams] An object containing paramName => value
* @param {string} [optionalParams.subtype1] Subtype1 value (max 32 chars)
* @param {string} [optionalParams.subtype2] Subtype2 value (max 32 chars)
* @param {string} [optionalParams.subtype3] Subtype3 value (max 32 chars)
* @param {function} [successCallback] The callback function to execute once message has been sent successfully
* @param {function(error)} [validationErrorCallback] The callback function to execute on validation failure
*/
KontagentApi.prototype.trackNotificationSent = function(userId, recipientUserIds, uniqueTrackingTag, optionalParams, successCallback, validationErrorCallback) {
	var apiParams = {
		s : userId,
		r : recipientUserIds,
		u : uniqueTrackingTag
	};
	
	if (optionalParams != null && typeof optionalParams != 'undefined') {
		if (optionalParams.subtype1) { apiParams.st1 = optionalParams.subtype1; }
		if (optionalParams.subtype2) { apiParams.st2 = optionalParams.subtype2; }
		if (optionalParams.subtype3) { apiParams.st3 = optionalParams.subtype3; }
	}
	
	this._sendMessage("nts", apiParams, successCalback, validationErrorCallback);
}

/*
* Sends an Notification Response message to Kontagent.
*
* @param {string} uniqueTrackingTag 32-digit hex string used to match 
*	NotificationSent->NotificationResponse->ApplicationAdded messages. 
*	See the genUniqueTrackingTag() helper method.
* @param {object} [optionalParams] An object containing paramName => value
* @param {string} [optionalParams.recipientUserId] The UID of the responding user
* @param {string} [optionalParams.subtype1] Subtype1 value (max 32 chars)
* @param {string} [optionalParams.subtype2] Subtype2 value (max 32 chars)
* @param {string} [optionalParams.subtype3] Subtype3 value (max 32 chars)
* @param {function} [successCallback] The callback function to execute once message has been sent successfully
* @param {function(error)} [validationErrorCallback] The callback function to execute on validation failure
*/
KontagentApi.prototype.trackNotificationResponse = function(uniqueTrackingTag, optionalParams, successCallback, validationErrorCallback) {
	var apiParams = {
		i : 0,
		u : uniqueTrackingTag
	};
	
	if (optionalParams != null && typeof optionalParams != 'undefined') {
		if (optionalParams.recipientUserId) { apiParams.r = optionalParams.recipientUserId; }
		if (optionalParams.subtype1) { apiParams.st1 = optionalParams.subtype1; }
		if (optionalParams.subtype2) { apiParams.st2 = optionalParams.subtype2; }
		if (optionalParams.subtype3) { apiParams.st3 = optionalParams.subtype3; }
	}
	
	this._sendMessage("ntr", apiParams, successCallback, validationErrorCallback);
}

/*
* Sends an Notification Email Sent message to Kontagent.
*
* @param {int} userId The UID of the sending user
* @param {string} recipientUserIds A comma-separated list of the recipient UIDs
* @param {string} uniqueTrackingTag 32-digit hex string used to match 
*	NotificationEmailSent->NotificationEmailResponse->ApplicationAdded messages. 
*	See the genUniqueTrackingTag() helper method.
* @param {object} [optionalParams] An object containing paramName => value
* @param {string} [optionalParams.subtype1] Subtype1 value (max 32 chars)
* @param {string} [optionalParams.subtype2] Subtype2 value (max 32 chars)
* @param {string} [optionalParams.subtype3] Subtype3 value (max 32 chars)
* @param {function} [successCallback] The callback function to execute once message has been sent successfully
* @param {function(error)} [validationErrorCallback] The callback function to execute on validation failure
*/
KontagentApi.prototype.trackNotificationEmailSent = function(userId, recipientUserIds, uniqueTrackingTag, optionalParams, successCallback, validationErrorCallback) {
	var apiParams = {
		s : userId,
		r : recipientUserIds,
		u : uniqueTrackingTag
	};
	
	if (optionalParams != null && typeof optionalParams != 'undefined') {
		if (optionalParams.subtype1) { apiParams.st1 = optionalParams.subtype1; }
		if (optionalParams.subtype2) { apiParams.st2 = optionalParams.subtype2; }
		if (optionalParams.subtype3) { apiParams.st3 = optionalParams.subtype3; }
	}

	this._sendMessage("nes", apiParams, successCallback, validationErrorCallback);
}

/*
* Sends an Notification Email Response message to Kontagent.
*

* @param {string} uniqueTrackingTag 32-digit hex string used to match 
*	NotificationEmailSent->NotificationEmailResponse->ApplicationAdded messages. 
*	See the genUniqueTrackingTag() helper method.
* @param {object} [optionalParams] An object containing paramName => value
* @param {string} [optionalParams.recipientUserId] The UID of the responding user
* @param {string} [optionalParams.subtype1] Subtype1 value (max 32 chars)
* @param {string} [optionalParams.subtype2] Subtype2 value (max 32 chars)
* @param {string} [optionalParams.subtype3] Subtype3 value (max 32 chars)
* @param {function} [successCallback] The callback function to execute once message has been sent successfully
* @param {function(error)} [validationErrorCallback] The callback function to execute on validation failure
*/
KontagentApi.prototype.trackNotificationEmailResponse = function(uniqueTrackingTag, optionalParams, successCallback, validationErrorCallback) {
	var apiParams = {
		i : 0,
		u : uniqueTrackingTag
	};
	
	if (optionalParams != null && typeof optionalParams != 'undefined') {
		if (optionalParams.recipientUserId) { apiParams.r = optionalParams.recipientUserId; }
		if (optionalParams.subtype1) { apiParams.st1 = optionalParams.subtype1; }
		if (optionalParams.subtype2) { apiParams.st2 = optionalParams.subtype2; }
		if (optionalParams.subtype3) { apiParams.st3 = optionalParams.subtype3; }
	}
	
	this._sendMessage("nei", apiParams, successCallback, validationErrorCallback);
}

/*
* Sends an Stream Post message to Kontagent.
*
* @param {int} userId The UID of the sending user
* @param {string} uniqueTrackingTag 32-digit hex string used to match 
*	NotificationEmailSent->NotificationEmailResponse->ApplicationAdded messages. 
*	See the genUniqueTrackingTag() helper method.
* @param {string} type The Facebook channel type
*	(feedpub, stream, feedstory, multifeedstory, dashboard_activity, or dashboard_globalnews).
* @param {object} [optionalParams] An object containing paramName => value
* @param {string} [optionalParams.subtype1] Subtype1 value (max 32 chars)
* @param {string} [optionalParams.subtype2] Subtype2 value (max 32 chars)
* @param {string} [optionalParams.subtype3] Subtype3 value (max 32 chars)
* @param {function} [successCallback] The callback function to execute once message has been sent successfully
* @param {function(error)} [validationErrorCallback] The callback function to execute on validation failure
*/
KontagentApi.prototype.trackStreamPost = function(userId, uniqueTrackingTag, type, optionalParams, successCallback, validationErrorCallback) {
	var apiParams = {
		s : userId,
		u : uniqueTrackingTag,
		tu : type
	};
	
	if (optionalParams != null && typeof optionalParams != 'undefined') {
		if (optionalParams.subtype1) { apiParams.st1 = optionalParams.subtype1; }
		if (optionalParams.subtype2) { apiParams.st2 = optionalParams.subtype2; }
		if (optionalParams.subtype3) { apiParams.st3 = optionalParams.subtype3; }
	}

	this._sendMessage("pst", apiParams, successCallback, validationErrorCallback);
}

/*
* Sends an Stream Post Response message to Kontagent.
*
* @param {string} uniqueTrackingTag 32-digit hex string used to match 
*	NotificationEmailSent->NotificationEmailResponse->ApplicationAdded messages. 
*	See the genUniqueTrackingTag() helper method.
* @param {string} type The Facebook channel type
*	(feedpub, stream, feedstory, multifeedstory, dashboard_activity, or dashboard_globalnews).
* @param {object} [optionalParams] An object containing paramName => value
* @param {string} [optionalParams.recipientUserId] The UID of the responding user
* @param {string} [optionalParams.subtype1] Subtype1 value (max 32 chars)
* @param {string} [optionalParams.subtype2] Subtype2 value (max 32 chars)
* @param {string} [optionalParams.subtype3] Subtype3 value (max 32 chars)
* @param {function} [successCallback] The callback function to execute once message has been sent successfully
* @param {function(error)} [validationErrorCallback] The callback function to execute on validation failure
*/
KontagentApi.prototype.trackStreamPostResponse = function(uniqueTrackingTag, type, optionalParams, successCallback, validationErrorCallback) {
	var apiParams = {
		i : 0,
		u : uniqueTrackingTag,
		tu : type
	};
	
	if (optionalParams != null && typeof optionalParams != 'undefined') {
		if (optionalParams.recipientUserId) { apiParams.r = optionalParams.recipientUserId; }
		if (optionalParams.subtype1) { apiParams.st1 = optionalParams.subtype1; }
		if (optionalParams.subtype2) { apiParams.st2 = optionalParams.subtype2; }
		if (optionalParams.subtype3) { apiParams.st3 = optionalParams.subtype3; }
	}

	this._sendMessage("psr", apiParams, successCallback, validationErrorCallback);
}

/*
* Sends an Custom Event message to Kontagent.
*
* @param {int} userId The UID of the user
* @param {string} eventName The name of the event
* @param {object} [optionalParams] An object containing paramName => value
* @param {int} [optionalParams.value] A value associated with the event
* @param {int} [optionalParams.level] A level associated with the event (must be positive)
* @param {string} [optionalParams.subtype1] Subtype1 value (max 32 chars)
* @param {string} [optionalParams.subtype2] Subtype2 value (max 32 chars)
* @param {string} [optionalParams.subtype3] Subtype3 value (max 32 chars)
* @param {function} [successCallback] The callback function to execute once message has been sent successfully
* @param {function(error)} [validationErrorCallback] The callback function to execute on validation failure
*/
KontagentApi.prototype.trackEvent = function(userId, eventName, optionalParams, successCallback, validationErrorCallback) {
	var apiParams = {
		s : userId,
		n : eventName
	};
	
	if (optionalParams != null && typeof optionalParams != 'undefined') {
		if (optionalParams.value) { apiParams.v = optionalParams.value; }
		if (optionalParams.level) { apiParams.l = optionalParams.level; }
		if (optionalParams.subtype1) { apiParams.st1 = optionalParams.subtype1; }
		if (optionalParams.subtype2) { apiParams.st2 = optionalParams.subtype2; }
		if (optionalParams.subtype3) { apiParams.st3 = optionalParams.subtype3; }
	}	

	this._sendMessage("evt", apiParams, successCallback, validationErrorCallback);
}

/*
* Sends an Application Added message to Kontagent.
*
* @param {int} userId The UID of the installing user
* @param {object} [optionalParams] An object containing paramName => value
* @param {string} [optionalParams.uniqueTrackingTag] 16-digit hex string used to match 
*	Invite/StreamPost/NotificationSent/NotificationEmailSent->ApplicationAdded messages. 
*	See the genUniqueTrackingTag() helper method.
* @param {string} [optionalParams.shortUniqueTrackingTag] 8-digit hex string used to match 
*	ThirdPartyCommClicks->ApplicationAdded messages. 
*	See the genShortUniqueTrackingTag() hesendMessagelper method.
* @param {function} [successCallback] The callback function to execute once message has been sent successfully
* @param {function(error)} [validationErrorCallback] The callback function to execute on validation failure
*/
KontagentApi.prototype.trackApplicationAdded = function(userId, optionalParams, successCallback, validationErrorCallback) {
	var apiParams = {s : userId};
	
	if (optionalParams != null && typeof optionalParams != 'undefined') {
		if (optionalParams.uniqueTrackingTag) { apiParams.u = optionalParams.uniqueTrackingTag; }
		if (optionalParams.shortUniqueTrackingTag) { apiParams.su = optionalParams.shortUniqueTrackingTag; }
	}

	this._sendMessage("apa", apiParams, successCallback, validationErrorCallback);
}

/*
* Sends an Application Removed message to Kontagent.
*
* @param {int} userId The UID of the removing user
* @param {function} [successCallback] The callback function to execute once message has been sent successfully
* @param {function(error)} [validationErrorCallback] The callback function to execute on validation failure
*/
KontagentApi.prototype.trackApplicationRemoved = function(userId, successCallback, validationErrorCallback) {
	var apiParams = {s : userId};
	
	this._sendMessage("apr", apiParams, successCallback, validationErrorCallback);
}

/*
* Sends an Third Party Communication Click message to Kontagent.
*
* @param {string} type The third party comm click type (ad, partner).
* @param {string} shortUniqueTrackingTag 8-digit hex string used to match 
*	ThirdPartyCommClicks->ApplicationAdded messages. 
* @param {object} [optionalParams] An object containing paramName => value
* @param {string} [optionalParams.userId] The UID of the user
* @param {string} [optionalParams.subtype1] Subtype1 value (max 32 chars)
* @param {string} [optionalParams.subtype2] Subtype2 value (max 32 chars)
* @param {string} [optionalParams.subtype3] Subtype3 value (max 32 chars)
* @param {function} [successCallback] The callback function to execute once message has been sent successfully
* @param {function(error)} [validationErrorCallback] The callback function to execute on validation failure
*/
KontagentApi.prototype.trackThirdPartyCommClick = function(type, shortUniqueTrackingTag, optionalParams, successCallback, validationErrorCallback) {
	var apiParams = {
		i : 0,
		tu : type,
		su : shortUniqueTrackingTag
	};
	
	if (optionalParams != null && typeof optionalParams != 'undefined') {
		if (optionalParams.userId) { apiParams.s = optionalParams.userId; }
		if (optionalParams.subtype1) { apiParams.st1 = optionalParams.subtype1; }
		if (optionalParams.subtype2) { apiParams.st2 = optionalParams.subtype2; }
		if (optionalParams.subtype3) { apiParams.st3 = optionalParams.subtype3; }
	}	
	
	this._sendMessage("ucc", apiParams, successCallback, validationErrorCallback);
}

/*
* Sends an Page Request message to Kontagent.
*
* @param {int} userId The UID of the user
* @param {object} [optionalParams] An object containing paramName => value
* @param {string} [optionalParams.ipAddress] The current users IP address
* @param {string} [optionalParams.pageAddress] The current page address (ex: index.html)
* @param {function} [successCallback] The callback function to execute once message has been sent successfully
* @param {function(error)} [validationErrorCallback] The callback function to execute on validation failure
*/
KontagentApi.prototype.trackPageRequest = function(userId, optionalParams, successCallback, validationErrorCallback) {
	var apiParams = {
		s : userId
	};
	
	if (optionalParams != null && typeof optionalParams != 'undefined') {
		if (optionalParams.ipAddress) { apiParams.ip = optionalParams.ipAddress; }
		if (optionalParams.pageAddress) { apiParams.u = optionalParams.pageAddress; }
	}

	this._sendMessage("pgr", apiParams, successCallback, validationErrorCallback);
}

/*
* Sends an User Information message to Kontagent.
*
* @param {int} userId The UID of the user
* @param {object} [optionalParams] An object containing paramName => value
* @param {int} [optionalParams.birthYear] The birth year of the user
* @param {string} [optionalParams.gender] The gender of the user (m,f,u)
* @param {string} [optionalParams.country] The 2-character country code of the user
* @param {int} [optionalParams.friendCount] The friend count of the user
* @param {function} [successCallback] The callback function to execute once message has been sent successfully
* @param {function(error)} [validationErrorCallback] The callback function to execute on validation failure
*/
KontagentApi.prototype.trackUserInformation = function (userId, optionalParams, successCallback, validationErrorCallback) {
	var apiParams = {s : userId};
	
	if (optionalParams != null && typeof optionalParams != 'undefined') {
		if (optionalParams.birthYear) { apiParams.b = optionalParams.birthYear; }
		if (optionalParams.gender) { apiParams.g = optionalParams.gender; }
		if (optionalParams.country) { apiParams.lc = optionalParams.country; }
		if (optionalParams.friendCount) { apiParams.f = optionalParams.friendCount; }
	}
	
	this._sendMessage("cpu", apiParams, successCallback, validationErrorCallback);
}

/*
* Sends an Goal Count message to Kontagent.
*
* @param {int} userId The UID of the user
* @param {object} [optionalParams] An object containing paramName => value
* @param {int} [optionalParams.goalCount1] The amount to increment goal count 1 by
* @param {int} [optionalParams.goalCount2] The amount to increment goal count 2 by
* @param {int} [optionalParams.goalCount3] The amount to increment goal count 3 by
* @param {int} [optionalParams.goalCount4] The amount to increment goal count 4 by
* @param {function} [successCallback] The callback function to execute once message has been sent successfully
* @param {function(error)} [validationErrorCallback] The callback function to execute on validation failure
*/
KontagentApi.prototype.trackGoalCount = function(userId, optionalParams, successCallback, validationErrorCallback) {
	var apiParams = {s : userId};
	
	if (optionalParams != null && typeof optionalParams != 'undefined') {
		if (optionalParams.goalCount1) { apiParams.gc1 = optionalParams.goalCount1; }
		if (optionalParams.goalCount2) { apiParams.gc2 = optionalParams.goalCount2; }
		if (optionalParams.goalCount3) { apiParams.gc3 = optionalParams.goalCount3; }
		if (optionalParams.goalCount4) { apiParams.gc4 = optionalParams.goalCount4; }
	}

	this._sendMessage("gci", apiParams, successCallback, validationErrorCallback);
}

/*
* Sends an Revenue message to Kontagent.
*
* @param {int} userId The UID of the user
* @param {int} value The amount of revenue in cents
* @param {object} [optionalParams] An object containing paramName => value
* @param {string} [optionalParams.type] The transaction type (direct, indirect, advertisement, credits, other)
* @param {string} [optionalParams.subtype1] Subtype1 value (max 32 chars)
* @param {string} [optionalParams.subtype2] Subtype2 value (max 32 chars)
* @param {string} [optionalParams.subtype3] Subtype3 value (max 32 chars)
* @param {function} [successCallback] The callback function to execute once message has been sent successfully
* @param {function(error)} [validationErrorCallback] The callback function to execute on validation failure
*/
KontagentApi.prototype.trackRevenue = function(userId, value, optionalParams, successCallback, validationErrorCallback) {
	var apiParams = {
		s : userId,
		v : value
	};
	
	if (optionalParams != null && typeof optionalParams != 'undefined') {
		if (optionalParams.type) { apiParams.tu = optionalParams.type; }
		if (optionalParams.subtype1) { apiParams.st1 = optionalParams.subtype1; }
		if (optionalParams.subtype2) { apiParams.st2 = optionalParams.subtype2; }
		if (optionalParams.subtype3) { apiParams.st3 = optionalParams.subtype3; }
	}

	this._sendMessage("mtu", apiParams, successCallback, validationErrorCallback);
}

////////////////////////////////////////////////////////////////////////////////

/*
* Helper class to validate the paramters for the Kontagent API messages. All 
* 	methods are static so no need to instantiate this class.
*
* @constructor
*/
function KtValidator() {
}

/*
* Validates a parameter of a given message type.
* IMPORTANT: When evaluating the return, use a strict-type comparison: if(response === true) {}
*
* @param {string} messageType The message type that the param belongs to (ex: ins, apa, etc.)
* @param {string} paramName The name of the parameter (ex: s, su, u, etc.)
* @param {mixed} paramValue The value of the parameter
*
* @returns {mixed} Returns true on success and an error message string on failure.
*/
KtValidator.validateParameter = function(messageType, paramName, paramValue) {
	return KtValidator['_validate' + KtValidator._upperCaseFirst(paramName)](messageType, paramName, paramValue);
}

KtValidator._upperCaseFirst = function(stringVal) {
	return stringVal.charAt(0).toUpperCase() + stringVal.slice(1);
}

KtValidator._validateB = function(messageType, paramName, paramValue) {
	// birthyear param (cpu message)
	if (typeof paramValue == "undefined" || paramValue != parseInt(paramValue) 
		|| paramValue < 1900 || paramValue > 2011
	) {
		return 'Invalid birth year.';
	} else {
		return true;
	}

}

KtValidator._validateF = function(messageType, paramName, paramValue) {
	// friend count param (cpu message)
	if (typeof paramValue == "undefined" || paramValue != parseInt(paramValue) || paramValue < 0) {
		return 'Invalid friend count.'
	} else {
		return true;
	}
}

KtValidator._validateG = function(messageType, paramName, paramValue) {	
	// gender param (cpu message)
	var regex = /^[mfu]$/;

	if (typeof paramValue == "undefined" || !regex.test(paramValue)) {
		return 'Invalid gender.';
	} else {
		return true;
	}
}

KtValidator._validateGc1 = function(messageType, paramName, paramValue) {
	// goal count param (gc1, gc2, gc3, gc4 messages)
	if (typeof paramValue == "undefined" || paramValue != parseInt(paramValue) 
		|| paramValue < -16384 || paramValue > 16384
	) {
		return 'Invalid goal count value.';
	} else {
		return true;
	}
}

KtValidator._validateGc2 = function(messageType, paramName, paramValue) {
	return KtValidator._validateGc1(messageType, paramName, paramValue);
}

KtValidator._validateGc3 = function(messageType, paramName, paramValue) {
	return KtValidator._validateGc1(messageType, paramName, paramValue);
}

KtValidator._validateGc4 = function(messageType, paramName, paramValue) {
	return KtValidator._validateGc1(messageType, paramName, paramValue);
}

KtValidator._validateI = function(messageType, paramName, paramValue) {
	// isAppInstalled param (inr, psr, ner, nei messages)
	var regex = /^[01]$/;

	if (typeof paramValue == "undefined" || !regex.test(paramValue)) {
		return 'Invalid isAppInstalled value.';
	} else {
		return true;
	}
}

KtValidator._validateIp = function(messageType, paramName, paramValue) {
	// ip param (pgr messages)
	var regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\.\d{1,3})?$/; 

	if (typeof paramValue == "undefined" || !regex.test(paramValue)) {
		return 'Invalid IP address value.';
	} else {
		return true;
	}
}

KtValidator._validateL = function(messageType, paramName, paramValue) {
	// level param (evt messages)
	if (typeof paramValue == "undefined" || paramValue != parseInt(paramValue) || paramValue < 0) {
		return 'Invalid level value.';
	} else {
		return true;
	}
}

KtValidator._validateLc = function(messageType, paramName, paramValue) {
	// country param (cpu messages)
	var regex = /^[A-Z]{2}$/;

	if (typeof paramValue == "undefined" || !regex.test(paramValue)) {
		return 'Invalid country value.';
	} else {
		return true;
	}
}

KtValidator._validateLp = function(messageType, paramName, paramValue) {
	// postal/zip code param (cpu messages)
	// this parameter isn't being used so we just return true for now
	return true;
}

KtValidator._validateLs = function(messageType, paramName, paramValue) {
	// state param (cpu messages)
	// this parameter isn't being used so we just return true for now
	return true;
}

KtValidator._validateN = function(messageType, paramName, paramValue) {
	// event name param (evt messages)
	var regex = /^[A-Za-z0-9-_]{1,32}$/;

	if (typeof paramValue == "undefined" || !regex.test(paramValue)) {
		return 'Invalid event name value.';
	} else {
		return true;
	}
}

KtValidator._validateR = function(messageType, paramName, paramValue) {
	// Sending messages include multiple recipients (comma separated) and
	// response messages can only contain 1 recipient UID.
	if (messageType == 'ins' || messageType == 'nes' || messageType == 'nts') {
		// recipients param (ins, nes, nts messages)
		var regex = /^[0-9]+(,[0-9]+)*$/;

		if (typeof paramValue == "undefined" || !regex.test(paramValue)) {
			return 'Invalid recipient user ids.';
		}
	} else if (messageType == 'inr' || messageType == 'psr' || messageType == 'nei' || messageType == 'ntr') {
		// recipient param (inr, psr, nei, ntr messages)
		if (typeof paramValue == "undefined" || paramValue != parseInt(paramValue)) {
			return 'Invalid recipient user id.';
		}
	}

	return true;
}

KtValidator._validateS = function(messageType, paramName, paramValue) {
	// userId param
	if (typeof paramValue == "undefined" || paramValue != parseInt(paramValue)) {
		return 'Invalid user id.';
	} else {
		return true;
	}
}

KtValidator._validateSt1 = function(messageType, paramName, paramValue) {
	// subtype1 param
	var regex = /^[A-Za-z0-9-_]{1,32}$/;

	if (typeof paramValue == "undefined" || !regex.test(paramValue)) {
		return 'Invalid subtype value.';
	} else {
		return true;
	}
}

KtValidator._validateSt2 = function(messageType, paramName, paramValue) {
	return KtValidator._validateSt1(messageType, paramName, paramValue);
}

KtValidator._validateSt3 = function(messageType, paramName, paramValue) {
	return KtValidator._validateSt1(messageType, paramName, paramValue);
}

KtValidator._validateSu = function(messageType, paramName, paramValue) {
	// short tracking tag param
	var regex = /^[A-Fa-f0-9]{8}$/;

	if (typeof paramValue == "undefined" || !regex.test(paramValue)) {
		return 'Invalid short unique tracking tag.';
	} else {
		return true;
	}
}

KtValidator._validateTs = function(messageType, paramName, paramValue) {
	// timestamp param (pgr message)
	if (typeof paramValue == "undefined" || paramValue != parseInt(paramValue)) {
		return 'Invalid timestamp.';
	} else {
		return true;
	}
}

KtValidator._validateTu = function(messageType, paramName, paramValue) {
	// type parameter (mtu, pst/psr, ucc messages)
	// acceptable values for this parameter depends on the message type
	var regex;

	if (messageType == 'mtu') {
		regex = /^(direct|indirect|advertisement|credits|other)$/;
	
		if (typeof paramValue == "undefined" || !regex.test(paramValue)) {
			return 'Invalid monetization type.';
		}
	} else if (messageType == 'pst' || messageType == 'psr') {
		regex = /^(feedpub|stream|feedstory|multifeedstory|dashboard_activity|dashboard_globalnews)$/;

		if (typeof paramValue == "undefined" || !regex.test(paramValue)) {
			return 'Invalid stream post/response type.';
		}
	} else if (messageType == 'ucc') {
		regex = /^(ad|partner)$/;

		if (typeof paramValue == "undefined" || !regex.test(paramValue)) {
			return 'Invalid third party communication click type.';
		}
	}
	
	return true;
}

KtValidator._validateU = function(messageType, paramName, paramValue) {
	// unique tracking tag parameter for all messages EXCEPT pgr.
	// for pgr messages, this is the "page address" param
	if (messageType != 'pgr') {
		var regex = /^[A-Fa-f0-9]{16}$/;

		if (typeof paramValue == "undefined" || !regex.test(paramValue)) {
			return 'Invalid unique tracking tag.';
		}
	}
	
	return true;
}

KtValidator._validateV = function(messageType, paramName, paramValue) {
	// value param (mtu, evt messages)
	if (typeof paramValue == "undefined" || paramValue != parseInt(paramValue)) {
		return 'Invalid value.';
	} else {
		return true;
	}
}

if (window.fbAsyncInit) {
    BASE_FB.callback = window.fbAsyncInit;
    window.fbAsyncInit = setKtParams;
} else {
    setKtParams();
}

