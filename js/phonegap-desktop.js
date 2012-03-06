// PhoneGap stub for desktop debugging
document.addEventListener("DOMContentLoaded", function(){
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
		if (e.altKey && e.ctrlKey)
		{
			phonegapdesktop.internal.fireEvent(e.keyCode);
		}
	}
	
    document.removeEventListener("DOMContentLoaded", arguments.callee, false);
    var readyEvent = document.createEvent('HTMLEvents');
    readyEvent.initEvent('deviceready', true, true);
    document.dispatchEvent(readyEvent);
}, false);


var phonegapdesktop = {}
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
        
        
        this.debugdata = this.mergeRecursive(this.debugdata, this.parseJSON(data));
    },
    
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
		switch (keyCode) {
			case 80: 	// <P>ause
				break;
			case 82: 	// <R>esume
				break;
			case 79:	// <O>nline
				break;
			case 70:	// O<f>fline
				break;
			case 66:	// <B>ackbutton
				break;
			case 67:	// Battery <C>ritical
				alert('Battery critical');
				break;
			case 76:	// Battery <L>ow
				break;
			case 65:	// B<a>ttery Status
				break;
			case 77:	// <M>enu button
				break;
			case 83:	// <S>earch
				break;
			case 84:	// S<t>art call
				break;
			case 69:	// <E>nd call
				break;
			case 68:	// Volume <D>own
				break;
			case 85:	// Volume <U>p 
				break;
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
	
	intervalFunction : function(successCallback, errorCallback, frequency, nodeName, elementName){
		return setInterval(function(){
			if (phonegapdesktop.internal.randomException(nodeName)){
				errorCallback('A random error from ' + nodeName);
			}
			else {
				successCallback(phonegapdesktop.internal.getDebugValue(nodeName, elementName));
			}
		}, frequency);
	},
	
	cancelIntervalFunction: function(functionID){
		clearInterval(functionID);
	}
}
// End of PhoneGapDesktop internal methods and properties


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
			if (cameraOptions && cameraOptions.destinationType != undefined && cameraOptions.destinationType == Camera.DestinationType.DATA_URL) {
				cameraSuccess(phonegapdesktop.internal.getDebugValue('camera', 'pictures_base64'));
			}
			else {
				cameraSuccess(phonegapdesktop.internal.getDebugValue('camera', 'pictures_url'));
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
    },
    captureImage: function(captureSuccess, captureError, options){
    },
    captureVideo: function(captureSuccess, captureError, options){
    }
};

navigator.compass = {
    getCurrentHeading: function(compassSuccess, compassError, compassOptions){
    },
    watchHeading: function(compassSuccess, compassError, compassOptions){
    },
    clearWatch: function(watchID){
    },
    watchHeadingFilter: function(compassSuccess, compassError, compassOptions){
    },
    clearWatchFilter: function(watchID){
    }
};

navigator.network = {};
navigator.network.connection = {
    type: 0
};

navigator.contacts = {
    create: function(properties){
    },
    find: function(contactFields, contactSuccess, contactError, contactFindOptions){
    }
};

window.device = {};
phonegapdesktop.internal.setDynamicProperty(window.device, "device", "name");
phonegapdesktop.internal.setDynamicProperty(window.device, "device", "phonegap");
phonegapdesktop.internal.setDynamicProperty(window.device, "device", "platform");
phonegapdesktop.internal.setDynamicProperty(window.device, "device", "uuid");
phonegapdesktop.internal.setDynamicProperty(window.device, "device", "version");

// NOTE: FileAPI should be supported by browsers NEED TO CHECK

navigator.geolocation = {
    getCurrentPosition: function(geolocationSuccess, geolocationError, geolocationOptions){
    },
    watchPosition: function(geolocationSuccess, geolocationError, geolocationOptions){
    },
    clearWatch: function(watchID){
    }
};
Media = function(src, mediaSuccess, mediaError, mediaStatus){
    this.Source = src;
    this.SuccessCallback = mediaSuccess;
    this.ErrorCallback = mediaError;
    this.StatusCallback = mediaStatus;
    
    this.getCurrentPosition = function(mediaSuccess, mediaError){
    };
    this.getDuration = function(){
    };
    this.play = function(){
    };
    this.pause = function(){
    };
    this.release = function(){
    };
    this.seekTo = function(milliseconds){
    };
    this.startRecord = function(){
    };
    this.stopRecord = function(){
    };
    this.stop = function(){
    };
    return this;
}

navigator.notification = {
    alert: function(message, alertCallback, title, buttonName){
    },
    confirm: function(message, confirmCallback, title, buttonLabels){
    },
    beep: function(times){
    },
    vibrate: function(milliseconds){
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


