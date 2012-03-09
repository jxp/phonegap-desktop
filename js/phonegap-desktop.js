// PhoneGap simulator (shim) for desktop debugging

// Window.onload should be the last event in the load process, wait 200ms for any other code to finish
window.addEventListener('load', setTimeout(function(){
    phonegapdesktop.internal.initialiseData();
    
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
    
    document.removeEventListener("DOMContentLoaded", arguments.callee, false);
    var readyEvent = document.createEvent('HTMLEvents');
    readyEvent.initEvent('deviceready', true, true);
    document.dispatchEvent(readyEvent);
}, 200), false);


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
        
        
        this.debugdata = phonegapdesktop.utility.mergeRecursive(this.debugdata, phonegapdesktop.utility.parseJSON(data));
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
        
        if (Object.prototype.toString.call(node[element]) === '[object Array]') {
            // Pick an element from the array
            if (node.arraySequence || this.debugdata.internal.arraySequence) {
                if (typeof(node[indexPrefix + element]) == 'number') {
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
        
        switch (keyCode) {
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
                setBatteryProperties(customEvent);
                break;
            case 76: // Battery <L>ow
                eventName = 'batterylow';
                setBatteryProperties(customEvent);
                break;
            case 65: // B<a>ttery Status
                eventName = 'batterystatus';
                setBatteryProperties(customEvent);
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
                
                if (eventName != '') {
                    customEvent.initEvent(eventName, true, true);
                    document.dispatchEvent(readyEvent);
                }
        }
    },
    
    setBatteryProperties: function(eventObject){
        var batteryInfo = phonegapdesktop.internal.getDebugValue('events', 'battery');
        for (var prop in batteryInfo) {
            eventObject[prop] = batteryInfo[prop];
        }
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
            CaptureError(phonegapdesktop.internal.getDebugValue('capture', 'error'));
        }
        else {
            var mediaFiles = phonegapdesktop.internal.getDebugValue('capture', 'media');
            for (var media in mediaFiles) {
                media = new phonegapdesktop.objects.MediaFile(media);
            }
            captureSuccess(mediaFiles);
        }
    }
};

phonegapdesktop.utility = {

    // mergeRecursive function copied from http://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects-dynamically
    mergeRecursive: function(obj1, obj2){
    
        for (var p in obj2) {
            try {
                // Property in destination object set; update its value.
                if (obj2[p].constructor == Object) {
                    obj1[p] = mergeRecursive(obj1[p], obj2[p]);
                }
                else {
                    obj1[p] = obj2[p];
                }
            } 
            catch (e) {
                // Property in destination object not set; create it and set its value.
                obj1[p] = obj2[p];
            }
        }
        
        return obj1;
    },
    
    
    // parseJSON function copied from http://stackoverflow.com/questions/3238457/getjson-without-jquery
    parseJSON: function(data){
        if (typeof data !== "string" || !data) {
            return null;
        }
        
        // Make sure leading/trailing whitespace is removed (IE can't handle it) 
        data = this.trim(data);
        
        // Make sure the incoming data is actual JSON 
        // Logic borrowed from http://json.org/json2.js 
        if (/^[\],:{}\s]*$/.test(data.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
        
            // Try to use the native JSON parser first 
            return window.JSON && window.JSON.parse ? window.JSON.parse(data) : (new Function("return " + data))();
            
        }
        else {
            throw "Invalid JSON: " + data;
        }
    },
    
    // trim12 function copied from http://blog.stevenlevithan.com/archives/faster-trim-javascript
    trim: function(str){
        var str = str.replace(/^\s\s*/, ''), ws = /\s/, i = str.length;
        while (ws.test(str.charAt(--i))) 
            ;
        return str.slice(0, i + 1);
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
            if (cameraOptions && cameraOptions.destinationType != undefined && cameraOptions.destinationType == Camera.DestinationType.FILE_URI) {
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
}

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
CompassError.COMPASS_NOT_SUPPORTED = 20

navigator.network = { connection: {}};
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
        mergeRecursive(tempContact, properties);
        return new tempContact;
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
}

Contact.prototype.clone = function(){
    var cloneContact = new Contact();
    phonegapdesktop.utility.mergeRecursive(cloneContact, that);
    return cloneContact;
};
Contact.prototype.remove = function(removeSuccess, removeError){
    if (phonegapdesktop.internal.randomException("contacts")) {
        removeError(phonegapdesktop.internal.getDebugValue("contacts", "error"));
    }
    else {
        removeSuccess(phonegapdesktop.internal.getDebugValue("contacts", "array"));
    }
    
};
Contact.prototype.save = function(saveSuccess, saveError){
    if (phonegapdesktop.internal.randomException("contacts")) {
        saveError(phonegapdesktop.internal.getDebugValue("contacts", "error"));
    }
    else {
        saveSuccess(that);
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

Media.prototype.play = function(){
    if (phonegapdesktop.internal.randomException("media")) {
        that.ErrorCallback(phonegapdesktop.internal.getDebugValue("media", "error"));
    }
    else {
        that.SuccessCallback();
    }
};
Media.prototype.pause = function(){
    if (phonegapdesktop.internal.randomException("media")) {
        that.ErrorCallback(phonegapdesktop.internal.getDebugValue("media", "error"));
    }
    else {
        that.SuccessCallback();
    }
};
Media.prototype.release = function(){
};
Media.prototype.seekTo = function(milliSeconds){
};
Media.prototype.startRecord = function(){
    if (phonegapdesktop.internal.randomException("media")) {
        that.ErrorCallback(phonegapdesktop.internal.getDebugValue("media", "error"));
    }
    else {
        that.SuccessCallback();
    }
    
};
Media.prototype.stopRecord = function(){
    if (phonegapdesktop.internal.randomException("media")) {
        that.ErrorCallback(phonegapdesktop.internal.getDebugValue("media", "error"));
    }
    else {
        that.SuccessCallback();
    }
};
Media.prototype.stop = function(){
    if (phonegapdesktop.internal.randomException("media")) {
        that.ErrorCallback(phonegapdesktop.internal.getDebugValue("media", "error"));
    }
    else {
        that.SuccessCallback();
    }
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
        alertCallback();
    },
    confirm: function(message, confirmCallback, title, buttonLabels){
        var isConfirmed = confirm(message);
        confirmCallback((isConfirmed) ? 1 : 2);
    },
    beep: function(times){
        // TODO add display of beep
    },
    vibrate: function(milliseconds){
        // TODO add display of vibrate
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


