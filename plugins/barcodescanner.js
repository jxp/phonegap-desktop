phonegapdesktop.internal.parseConfigFile('plugins/barcodescanner.json');

if (!window.plugins){
	window.plugins = {};
}

window.plugins.barcodeScanner = {
	scan: function(successCallback, errorCallback){
		if (phonegapdesktop.internal.randomException("barcodescanner")) {
			errorCallback('A random error was generated');
		}
		else {
			successCallback(phonegapdesktop.internal.getDebugValue('barcodescanner', 'scans'));
		}
		
	},
	
	encode : function(type, data, successCallback, errorCallback, options) {}
}
