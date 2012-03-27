// PhoneGap simulator (shim) for desktop debugging
// Written by Jonathan Prince (except where noted) in March-2012

// Window.onload should be the last event in the load process, wait 200ms for any other code to finish
window.addEventListener('load', function(){
    phonegapdesktop.internal.initialiseData();
    
    setTimeout(function(){
    
        // Map mouse events to touch events
        document.onmousedown = function(e){
            phonegapdesktop.internal.dispatchTouchEvent(e, "touchstart");
            phonegapdesktop.internal.touchActive = true;
            phonegapdesktop.internal.dispatchTouchEvent(e, "touchmove");
        };
        
        document.onmousemove = function(e){
            if (phonegapdesktop.internal.touchActive) {
                phonegapdesktop.internal.dispatchTouchEvent(e, "touchmove");
            }
        };
        
        document.onmouseup = function(e){
            phonegapdesktop.internal.dispatchTouchEvent(e, "touchmove");
            phonegapdesktop.internal.touchActive = false;
            phonegapdesktop.internal.dispatchTouchEvent(e, "touchend");
        };
        
        // Map Ctrl+Alt+{Key} to fire events
        document.onkeydown = function(e){
            e = e || window.event;
            if (e.altKey && e.ctrlKey) {
                phonegapdesktop.internal.fireEvent(e.keyCode);
            }
        };
        
        phonegapdesktop.utility.timedPopup(25, 90, 70, 7, "PhoneGap Desktop<br/>Ctrl+Alt + H for events help", 1000, "DarkBlue");
        
        document.removeEventListener("DOMContentLoaded", arguments.callee, false);
        var readyEvent = document.createEvent('HTMLEvents');
        readyEvent.initEvent('deviceready', true, true);
        document.dispatchEvent(readyEvent);
    }, phonegapdesktop.internal.getDebugValue("internal", "startupDelay") || 200)
}, false);


// Internal library functions 
var phonegapdesktop = {};
phonegapdesktop.internal = {
    debugdata: {},
    
    initialiseData: function(){
        // Load the default config file
        this.parseConfigFile('debugdata.json');
        
        // Check if the default specifies an alternate file to use
        if (this.debugdata.internal.currentFile) {
            this.parseConfigFile(this.debugdata.internal.currentFile);
        }
        
    },
    
    parseConfigFile: function(fileName){
        var data = '';
        var jsonReq = new XMLHttpRequest();
        try {
            jsonReq.open("GET", fileName, false);
        } 
        catch (err) {
            jsonReq = new ActiveXObject('Microsoft.XMLHTTP');
            jsonReq.open("GET", fileName, false);
        }
        jsonReq.send();
        
        data = jsonReq.responseText;
        
        
        phonegapdesktop.internal.debugdata = phonegapdesktop.utility.mergeRecursive(phonegapdesktop.internal.debugdata, JSON.parse(data));
    },
    
    dispatchTouchEvent: function(mouseArgs, eventName){
        var activeElement = document.elementFromPoint(mouseArgs.pageX, mouseArgs.pageY);
        
        if (activeElement) {
            var touchEvent = document.createEvent("HTMLEvents");
            touchEvent.touches = [{
                pageX: mouseArgs.pageX,
                pageY: mouseArgs.pageY
            }];
            touchEvent.initEvent(eventName, true, true);
            try {
                activeElement.dispatchEvent(touchEvent);
            } 
            catch (err) {
                alert(err);
            }
        }
        
    },
    getDebugValue: function(nodeName, element){
        var indexPrefix = '_lastIndex_';
        var useIndex = 0;
        var node = this.debugdata[nodeName];
        var inSequence = true;
        
        if (Object.prototype.toString.call(node[element]) === '[object Array]') {
            // Pick an element from the array
            if (node.arraySequence != undefined) {
                inSequence = node.arraySequence;
            }
            else {
                inSequence = phonegapdesktop.internal.debugdata.internal.arraySequence;
            }
            if (inSequence) {
                if (typeof(node[indexPrefix + element]) === 'number') {
                    useIndex = node[indexPrefix + element] + 1;
                    if (useIndex >= node[element].length) {
                        useIndex = 0;
                    }
                }
                node[indexPrefix + element] = useIndex;
                
                return node[element][useIndex];
            }
            else {
                return node[element][Math.floor(Math.random() * node[element].length)];
            }
            
        }
        else {
            // Return the raw element
            return node[element];
        }
    },
    
    fireEvent: function(keyCode){
        var customEvent = document.createEvent('HTMLEvents');
        var eventName = '';
        var helpHTML = '<span style="font-size: 1.2em;">Firing events</span><p style="text-align:left">Phone events can be fired by using Ctrl + Alt + the keys below</p><ul style="text-align: left"><li>P - Pause the app</li>';
        helpHTML += '<li>R - Resume the app</li><li>O - Phone has gone online</li><li>F - Phone has gone offline</li>';
        helpHTML += '<li>B - Back button pressed</li><li>I - Battery Critical</li><li>L - Battery Low</li>';
        helpHTML += '<li>A - Battery status change</li><li>M - Menu button pressed</li><li>S - Search button pressed</li>';
        helpHTML += '<li>T - Start call button</li><li>E - End call button</li><li>D - Volume Down button</li>';
        helpHTML += '<li>U - Volume up button</li></ul>';
        
        
        switch (keyCode) {
            case 72: // <H>elp
                phonegapdesktop.utility.timedPopup(10, 10, 77, 78, helpHTML, 3000, "DarkBlue");
                break;
            case 80: // <P>ause
                eventName = 'pause';
                break;
            case 82: // <R>esume
                eventName = 'resume';
                break;
            case 79: // <O>nline
                eventName = 'online';
                break;
            case 70: // O<f>fline
                eventName = 'offline';
                break;
            case 66: // <B>ackbutton
                eventName = 'backbutton';
                break;
            case 73: // Battery Cr<i>tical
                eventName = 'batterycritical';
                phonegapdesktop.internal.setBatteryProperties(customEvent);
                break;
            case 76: // Battery <L>ow
                eventName = 'batterylow';
                phonegapdesktop.internal.setBatteryProperties(customEvent);
                break;
            case 65: // B<a>ttery Status
                eventName = 'batterystatus';
                phonegapdesktop.internal.setBatteryProperties(customEvent);
                break;
            case 77: // <M>enu button
                eventName = 'menubutton';
                break;
            case 83: // <S>earch
                eventName = 'searchbutton';
                break;
            case 84: // S<t>art call
                eventName = 'startcallbutton';
                break;
            case 69: // <E>nd call
                eventName = 'endcallbutton';
                break;
            case 68: // Volume <D>own
                eventName = 'volumedownbutton';
                break;
            case 85: // Volume <U>p 
                eventName = 'volumeupbutton';
                break;
        }
        
        if (eventName !== '') {
            customEvent.initEvent(eventName, true, true);
            document.dispatchEvent(customEvent);
        }
    },
    
    setBatteryProperties: function(eventObject){
        var batteryInfo = phonegapdesktop.internal.getDebugValue('events', 'battery');
        phonegapdesktop.utility.mergeRecursive(eventObject, batteryInfo);
    },
    
    
    randomException: function(sectionName){
        if (sectionName && this.debugdata[sectionName].exceptionThreshold) {
            return (Math.random() < this.debugdata[sectionName].exceptionThreshold);
        }
        
        return (Math.random() < this.debugdata.internal.exceptionThreshold);
    },
    
    setDynamicProperty: function(obj, debugElement, debugNode){
    
        if (obj.__defineGetter__) {
            obj.__defineGetter__(debugNode, function(){
                return phonegapdesktop.internal.getDebugValue(debugElement, debugNode);
            });
        }
        if (Object.defineProperty) {
            Object.defineProperty(obj, debugNode, {
                get: function(){
                    return phonegapdesktop.internal.getDebugValue(debugElement, debugNode);
                }
            });
        }
        
    },
    
    intervalFunction: function(successCallback, errorCallback, frequency, nodeName, elementName, errorElement){
        return setInterval(function(){
            if (phonegapdesktop.internal.randomException(nodeName)) {
                if (errorElement) {
                    errorCallback(phonegapdesktop.internal.getDebugValue(nodeName, errorElement));
                }
                else {
                    errorCallback('A random error from ' + nodeName);
                }
            }
            else {
                successCallback(phonegapdesktop.internal.getDebugValue(nodeName, elementName));
            }
        }, frequency);
    },
    
    cancelIntervalFunction: function(functionID){
        clearInterval(functionID);
    },
    
    mediaHandler: function(successCallback, errorCallback, options){
        if (phonegapdesktop.internal.randomException("capture")) {
            errorCallback(phonegapdesktop.internal.getDebugValue('capture', 'error'));
        }
        else {
            var mediaFiles = phonegapdesktop.internal.getDebugValue('capture', 'media');
            for (var media in mediaFiles) {
                media = new phonegapdesktop.objects.MediaFile(media);
            }
            successCallback(mediaFiles);
        }
    },
    
    beeper: function(times){
        if (times > 0) {
            phonegapdesktop.utility.timedPopup(20, 90, 60, 5, "Beep", 300, "Green", phonegapdesktop.internal.beepPause, times - 1);
        }
    },
    
    beepPause: function(times){
        if (times > 0) {
            setTimeout(function(){
                phonegapdesktop.internal.beeper(times)
            }, 300);
        }
    }
    
};

phonegapdesktop.utility = {

    // mergeRecursive function copied from http://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects-dynamically
    mergeRecursive: function(obj1, obj2){
    
        for (var p in obj2) {
            try {
                // Property in destination object set; update its value.
                if (obj2[p].constructor === Object) {
                    obj1[p] = phonegapdesktop.utility.mergeRecursive(obj1[p], obj2[p]);
                }
                else {
                    obj1[p] = obj2[p];
                }
            } 
            catch (e) {
                obj1[p] = obj2[p];
            }
        }
        
        return obj1;
    },
        
    timedPopup: function(left, top, width, height, content, interval, borderColor, callback, callbackParams){
        var newDiv = document.createElement('div');
        var styleText = "position: absolute; background-color: White; text-align: center; border-radius: 5px; font-family: 'Arial'; font-size: 0.75em; z-index: 1; padding: 4px; display: table;";
        
        newDiv.id = 'timedPopup';
        newDiv.style.cssText = styleText + "left: " + left + "%; top: " + top + "%; width: " + width + "%; min-height: " + height + "%; border: solid 5px " + borderColor;
        newDiv.innerHTML = "<span style='display: table-cell; vertical-align: middle; text-align: center;'>" + content + "</span>";
        document.documentElement.appendChild(newDiv);
        
        setTimeout(function(){
            var popupDiv = document.getElementById('timedPopup');
            document.documentElement.removeChild(popupDiv);
            if (callback) {
                callback(callbackParams);
            }
        }, interval);
    },
    
	// Copied from http://stackoverflow.com/questions/728360/copying-an-object-in-javascript
    clone: function(obj){
        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" != typeof obj) 
            return obj;
        
        // Handle Date
        if (obj instanceof Date) {
            var copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }
        
        // Handle Array
        if (obj instanceof Array) {
            var copy = [];
            var len = obj.length;
            for (var i = 0; i < len; ++i) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }
        
        // Handle Object
        if (obj instanceof Object) {
            var copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) 
                    copy[attr] = phonegapdesktop.utility.clone(obj[attr]);
            }
            return copy;
        }
        
        throw new Error("Unable to copy obj! Its type isn't supported.");
    }
    
};

phonegapdesktop.objects = {

    MediaFile: function(data){
        // Copy the properties into this object
        phonegapdesktop.utility.mergeRecursive(this, data);
    }
    
};
// End of PhoneGap desktop internal methods and properties


// Start of PhoneGap API stub functions
navigator.accelerometer = {
    getCurrentAcceleration: function(accelerometerSuccess, accelerometerError){
        if (phonegapdesktop.internal.randomException("accelerometer")) {
            accelerometerError('A randome error was generated');
        }
        else {
            accelerometerSuccess(phonegapdesktop.internal.getDebugValue('accelerometer', 'acceleration'));
        }
    },
    watchAcceleration: function(accelerometerSuccess, accelerometerError, accelerometerOptions){
        return phonegapdesktop.internal.intervalFunction(accelerometerSuccess, accelerometerError, accelerometerOptions.frequency, "accelerometer", "acceleration");
    },
    clearWatch: function(watchID){
        phonegapdesktop.internal.cancelIntervalFunction(watchID);
    }
};

navigator.camera = {
    getPicture: function(cameraSuccess, cameraError, cameraOptions){
        if (phonegapdesktop.internal.randomException("camera")) {
            cameraError('A random error was generated');
        }
        else {
            if (cameraOptions && cameraOptions.destinationType !== undefined && cameraOptions.destinationType === Camera.DestinationType.FILE_URI) {
                cameraSuccess(phonegapdesktop.internal.getDebugValue('camera', 'pictures_url'));
            }
            else {
                if (cameraOptions.encodingType === Camera.EncodingType.PNG) {
                    cameraSuccess(phonegapdesktop.internal.getDebugValue('camera', 'pictures_base64_png'));
                }
                else {
                    cameraSuccess(phonegapdesktop.internal.getDebugValue('camera', 'pictures_base64_jpg'));
                }
            }
        }
    }
};

// Constants used for camera options
var Camera = {
    DestinationType: {
        DATA_URL: 0, // Return base64 encoded string
        FILE_URI: 1 // Return file uri (content://media/external/images/media/2 for Android)
    },
    PictureSourceType: {
        PHOTOLIBRARY: 0,
        CAMERA: 1,
        SAVEDPHOTOALBUM: 2
    },
    EncodingType: {
        JPEG: 0, // Return JPEG encoded image
        PNG: 1 // Return PNG encoded image
    },
    
    MediaType: {
        PICTURE: 0, // allow selection of still pictures only. DEFAULT. Will return format specified via DestinationType
        VIDEO: 1, // allow selection of video only, WILL ALWAYS RETURN FILE_URI
        ALLMEDIA: 2 // allow selection from all media types
    }
};

navigator.device = {};
navigator.device.capture = {
    captureAudio: function(captureSuccess, captureError, options){
        phonegapdesktop.internal.mediaHandler(captureSuccess, captureError, options);
    },
    captureImage: function(captureSuccess, captureError, options){
        phonegapdesktop.internal.mediaHandler(captureSuccess, captureError, options);
    },
    captureVideo: function(captureSuccess, captureError, options){
        phonegapdesktop.internal.mediaHandler(captureSuccess, captureError, options);
    }
};
phonegapdesktop.objects.MediaFile.prototype.getFormatData = function(successCallback, errorCallback){
    if (phonegapdesktop.internal.randomException("capture")) {
        errorCallback();
    }
    else {
        successCallback(phonegapdesktop.internal.getDebugValue('capture', 'mediaformat'));
    }
};

var CaptureError = {};
CaptureError.CAPTURE_INTERNAL_ERR = 0;
CaptureError.CAPTURE_APPLICATION_BUSY = 1;
CaptureError.CAPTURE_INVALID_ARGUMENT = 2;
CaptureError.CAPTURE_NO_MEDIA_FILES = 3;
CaptureError.CAPTURE_NOT_SUPPORTED = 20;

navigator.compass = {
    getCurrentHeading: function(compassSuccess, compassError, compassOptions){
        if (phonegapdesktop.internal.randomException("compass")) {
            compassError(phonegapdesktop.internal.getDebugValue('compass', 'error'));
        }
        else {
            compassSuccess(phonegapdesktop.internal.getDebugValue('compass', 'heading'));
        }
    },
    watchHeading: function(compassSuccess, compassError, compassOptions){
        return phonegapdesktop.internal.intervalFunction(compassSuccess, compassError, compassOptions.frequency, "compass", "heading", "error");
    },
    clearWatch: function(watchID){
        phonegapdesktop.internal.cancelIntervalFunction(watchID);
    },
    watchHeadingFilter: function(compassSuccess, compassError, compassOptions){
        return phonegapdesktop.internal.intervalFunction(compassSuccess, compassError, compassOptions.frequency || 5000, "compass", "heading", "error");
    },
    clearWatchFilter: function(watchID){
        phonegapdesktop.internal.cancelIntervalFunction(watchID);
    }
};

var CompassError = {};
CompassError.COMPASS_INTERNAL_ERR = 0;
CompassError.COMPASS_NOT_SUPPORTED = 20;

navigator.network = {
    connection: {}
};
phonegapdesktop.internal.setDynamicProperty(navigator.network.connection, "connection", "type");

var Connection = {};
Connection.UNKNOWN = "unknown";
Connection.ETHERNET = "ethernet";
Connection.WIFI = "wifi";
Connection.CELL_2G = "2g";
Connection.CELL_3G = "3g";
Connection.CELL_4G = "4g";
Connection.NONE = "none";

navigator.contacts = {
    create: function(properties){
        var tempContact = new Contact();
        phonegapdesktop.utility.mergeRecursive(tempContact, properties);
        return tempContact;
    },
    find: function(contactFields, contactSuccess, contactError, contactFindOptions){
        if (phonegapdesktop.internal.randomException("contacts")) {
            contactError(phonegapdesktop.internal.getDebugValue("contacts", "error"));
        }
        else {
            contactSuccess(phonegapdesktop.internal.getDebugValue("contacts", "array"));
        }
    }
};

// All these contact objects are required to be in the global namespace
function Contact(id, displayName, name, nickname, phoneNumbers, emails, addresses, ims, organizations, birthday, note, photos, categories, urls){
    this.id = id;
    this.displayName = displayName;
    this.name = name;
    this.nickname = nickname;
    this.phoneNumbers = phoneNumbers;
    this.emails = emails;
    this.addresses = addresses;
    this.ims = ims;
    this.organizations = organizations;
    this.birthday = birthday;
    this.note = note;
    this.photos = photos;
    this.categories = categories;
    this.urls = urls;
    
    var that = this;
    
    this.clone = function(){
        return phonegapdesktop.utility.clone(that);
    };
    
    this.save = function(saveSuccess, saveError){
        if (phonegapdesktop.internal.randomException("contacts")) {
            saveError(phonegapdesktop.internal.getDebugValue("contacts", "error"));
        }
        else {
            saveSuccess(that);
        }
    };
}

Contact.prototype.remove = function(removeSuccess, removeError){
    if (phonegapdesktop.internal.randomException("contacts")) {
        removeError(phonegapdesktop.internal.getDebugValue("contacts", "error"));
    }
    else {
        removeSuccess(phonegapdesktop.internal.getDebugValue("contacts", "array"));
    }
    
};

function ContactName(formatted, familyName, givenName, middleName, prefix, suffix){
    this.formatted = formatted;
    this.familyName = familyName;
    this.givenName = givenName;
    this.middleName = middleName;
    this.honorificPrefix = prefix;
    this.honorificSuffix = suffix;
}

function ContactField(fieldType, value, preferred){
    this.type = fieldType;
    this.value = value;
    this.pref = preferred;
}

function ContactAddress(preferred, addressType, formatted, street, area, region, postCode, country){
    this.pref = preferred;
    this.type = addressType;
    this.formatted = formatted;
    this.streetAddress = street;
    this.locality = area;
    this.region = region;
    this.postalCode = postCode;
    this.country = country;
}

function ContactOrganization(preferred, orgType, name, department, title){
    this.pref = preferred;
    this.type = orgType;
    this.name = name;
    this.department = department;
    this.title = title;
}

function ContactFindOptions(filter, multiple){
    this.filter = filter;
    this.multiple = multiple;
}

var ContactError = {};
ContactError.UNKNOWN_ERROR = 0;
ContactError.INVALID_ARGUMENT_ERROR = 1;
ContactError.TIMEOUT_ERROR = 2;
ContactError.PENDING_OPERATION_ERROR = 3;
ContactError.IO_ERROR = 4;
ContactError.NOT_SUPPORTED_ERROR = 5;
ContactError.PERMISSION_DENIED_ERROR = 20;

window.device = {};
phonegapdesktop.internal.setDynamicProperty(window.device, "device", "name");
phonegapdesktop.internal.setDynamicProperty(window.device, "device", "phonegap");
phonegapdesktop.internal.setDynamicProperty(window.device, "device", "platform");
phonegapdesktop.internal.setDynamicProperty(window.device, "device", "uuid");
phonegapdesktop.internal.setDynamicProperty(window.device, "device", "version");

// NOTE: FileAPI should be supported by browsers 

// Geolocation object may already be defined by the browser, need to make sure we can override the functions if so
navigator.geolocation = navigator.geolocation || {};

// NOTE This only works occaisionally in Firefox
navigator.geolocation.getCurrentPosition = function(geolocationSuccess, geolocationError, geolocationOptions){
    if (phonegapdesktop.internal.randomException("geolocation")) {
        geolocationError(phonegapdesktop.internal.getDebugValue("geolocation", "error"));
    }
    else {
        geolocationSuccess(phonegapdesktop.internal.getDebugValue("geolocation", "position"));
    }
};

navigator.geolocation.watchPosition = function(geolocationSuccess, geolocationError, geolocationOptions){
    return phonegapdesktop.internal.intervalFunction(geolocationSuccess, geolocationError, geolocationOptions.frequency, "geolocation", "position", "error");
};

navigator.geolocation.clearWatch = function(watchID){
    phonegapdesktop.internal.cancelIntervalFunction(watchID);
};


var PositionError = {};
PositionError.PERMISSION_DENIED = 1;
PositionError.POSITION_UNAVAILABLE = 2;
PositionError.TIMEOUT = 3;



function Media(src, mediaSuccess, mediaError, mediaStatus){
    this.Source = src;
    this.SuccessCallback = mediaSuccess;
    this.ErrorCallback = mediaError;
    this.StatusCallback = mediaStatus;
    var audioObj = new Audio(src);
	audioObj.load();
    var that = this;
    
	var supportedFile = function() {
		var mimeTypes = {
			".ogg" : 'audio/ogg; codecs="vorbis"',
			".wav" : 'audio/wav',
			".mp3" : 'audio/mpeg',
			".m4a" : 'audio/mp4',
			".aac" : 'audio/mp4; codecs="mp4a.40.5"'
		}
		
		var fileType = src.substr(src.lastIndexOf('.')) || src;
		
		return (mimeTypes[fileType] && audioObj.canPlayType(mimeTypes[fileType]));
	};
	
	
    this.play = function(){
        if (phonegapdesktop.internal.randomException("media")) {
            that.ErrorCallback(phonegapdesktop.internal.getDebugValue("media", "error"));
        }
        else {
			if (supportedFile()) {
				audioObj.play();
			}
			else {
		        phonegapdesktop.utility.timedPopup(35, 90, 60, 5, "Unsupported audio: " + (src.substr(src.lastIndexOf('.')) || src), 1000, "DarkBlue");
			}
            that.SuccessCallback();
        }
    };
    this.pause = function(){
        if (phonegapdesktop.internal.randomException("media")) {
            that.ErrorCallback(phonegapdesktop.internal.getDebugValue("media", "error"));
        }
        else {
			audioObj.pause();
            that.SuccessCallback();
        }
    };
    
    this.startRecord = function(){
        if (phonegapdesktop.internal.randomException("media")) {
            that.ErrorCallback(phonegapdesktop.internal.getDebugValue("media", "error"));
        }
        else {
            that.SuccessCallback();
        }
        
    };
    this.stopRecord = function(){
        if (phonegapdesktop.internal.randomException("media")) {
            that.ErrorCallback(phonegapdesktop.internal.getDebugValue("media", "error"));
        }
        else {
            that.SuccessCallback();
        }
    };
    this.stop = function(){
        if (phonegapdesktop.internal.randomException("media")) {
            that.ErrorCallback(phonegapdesktop.internal.getDebugValue("media", "error"));
        }
        else {
			audioObj.pause();
            that.SuccessCallback();
        }
    };
}

Media.prototype.getCurrentPosition = function(mediaSuccess, mediaError){
    if (phonegapdesktop.internal.randomException("media")) {
        mediaError(phonegapdesktop.internal.getDebugValue("media", "error"));
    }
    else {
        mediaSuccess(phonegapdesktop.internal.getDebugValue("media", "position"));
    }
};

Media.prototype.getDuration = function(){
    return phonegapdesktop.internal.getDebugValue("media", "duration");
};

Media.prototype.release = function(){
};
Media.prototype.seekTo = function(milliSeconds){
};


var MediaError = {};
MediaError.MEDIA_ERR_NONE_ACTIVE = 0;
MediaError.MEDIA_ERR_ABORTED = 1;
MediaError.MEDIA_ERR_NETWORK = 2;
MediaError.MEDIA_ERR_DECODE = 3;
MediaError.MEDIA_ERR_NONE_SUPPORTED = 4;



navigator.notification = {

    alert: function(message, alertCallback, title, buttonName){
        alert(message);
        if (alertCallback)
        {
            alertCallback();
        }
    },
    confirm: function(message, confirmCallback, title, buttonLabels){
        var isConfirmed = confirm(message);
        if (confirmCallback)
        {
            confirmCallback((isConfirmed) ? 1 : 2);
        }
    },
    beep: function(times){
        phonegapdesktop.internal.beeper(times);
    },
    vibrate: function(milliseconds){
        phonegapdesktop.utility.timedPopup(20, 90, 60, 5, "Vibrate", milliseconds, "Orange");
    }
};

// NOTE: Storage functions should be provided by the browser

// This is not documented in the API for some reason
navigator.app = {
    loadUrl: function(url, props){
    },
    
    cancelLoadUrl: function(){
    },
    
    clearHistory: function(){
    },
    
    backHistory: function(){
    },
    
    exitApp: function(){
        window.close();
    }
};


