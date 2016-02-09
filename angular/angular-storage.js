angular.module('ngStorage', []).

service('$storage', function($parse){

	var isDefined = angular.isDefined,
		isUndefined = angular.isUndefined,
		isNumber = angular.isNumber,
		isString = angular.isString;
		isObject = angular.isObject,
		isArray = angular.isArray,
		extend = angular.extend,
		toJson = angular.toJson;

	var storageType;
	var indexDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;

	// Cookies Variables
	var maxageConfig;
	var pathConfig;
	var domainConfig;

	// CHECK si el navegador soporta localStorage
    var SupportsStorage = (function () {
		try {
			var supported = ('localStorage' in window && window['localStorage'] !== null);
			// Cuando Safari (OS X or iOS) estan en modo privado, el localStorage esta activado
			// pero si intentas llamar a -> setItem nos da una exception
			//
			// "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to add something to storage
			// that exceeded the quota."
			if (supported) {
				webStorage = window['localStorage'];
				var key = 'test__' + Math.round(Math.random() * 1e7);
				webStorage.setItem(key, '');
				webStorage.removeItem(key);
			}
			return supported;

		} catch (e) {
			return false;
		}
    }());

    // CHECK si el naveegador soporta Cookies
	var SupportsCookies = (function() {
		try {
			return window.navigator.cookieEnabled ||
				("cookie" in document && (document.cookie.length > 0 ||
				(document.cookie = "test").indexOf.call(document.cookie, "test") > -1));
		} catch (e) {
			return false;
		}
	}());

	// CHECK si el navegador soporta IndexedDB
	var SupportsIndexedDB = (function () {
		try{
			var supported = ('indexedDB' in window && window['indexedDB'] !== null);
			return supported;
		}catch(e){
			return false;
		}
	}());




	// LOCALSTORAGE AND SESSIONSTORAGE METODOS
	var setStorage = function (key, value) {
		if(SupportsStorage){
			if(isObject(value)){
				value = toJson(value);
			}
			window[storageType].setItem(key, value);
			return true;
		}else{
			return setCookie(key, value);
		}
	}
	var getStorage = function (key) {
		if (SupportsStorage){
			var item = window[storageType] ? window[storageType].getItem(key) : null;
			if (!item || item === 'null') {
				return null;
			}

			try {
				return JSON.parse(item);
			} catch (e) {
				return item;
			}
		}else{
			return getCookie(key);
		}
	}
	var removeStorage = function (key) {
		if(SupportsStorage){
			window[storageType].removeItem(key);
			return true;
		}else{
			return removeCookie(key);
		}
	}
	var clearStorage = function () {
		if(SupportsStorage){
			window[storageType].clear();
			return true;
		}else{
			return false;
		}
	}
	var bindStorageToScope = function (scope, key, def, lsKey) {
		lsKey = lsKey || key;
		var value = getStorage(lsKey);

		if (value === null && isDefined(def)) {
			value = def;
		} else if (isObject(value) && isObject(def)) {
			value = extend(def, value);
		}

		$parse(key).assign(scope, value);

		var afterStorageType = storageType;
		return scope.$watch(key, function(newVal) {
				storageType = afterStorageType;
				setStorage(lsKey, newVal);
			}, isObject(scope[key]));
	}
	// LOCALSTORAGE AND SESSIONSTORAGE METODOS FIN




	// COOKIES METODOS
	var setCookie = function (key, value) {
		if(SupportsCookies){
			var datastructure = key+'='+value
			if(maxageConfig!='' && maxageConfig!=null){
				datastructure += ';max-age='+maxageConfig;
			}
			if (pathConfig!='' && pathConfig!=null){
				datastructure += ';path='+pathConfig;
			}
			if (domainConfig!='' && domainConfig!=null){
				datastructure += ';domain='+domainConfig;
			}
			document.cookie = datastructure+';';
			return true;
		}else{
			return false;
		}
	}
	var getCookie = function (key) {
		if(SupportsCookies){
			var cookies = document.cookie && document.cookie.split(';') || [];
			for(var i=0; i < cookies.length; i++) {
				var thisCookie = cookies[i];
				while (thisCookie.charAt(0) === ' ') {
					thisCookie = thisCookie.substring(1,thisCookie.length);
				}
				if (thisCookie.indexOf(key + '=') === 0) {
					var storedValues = decodeURIComponent(thisCookie.substring(key.length + 1, thisCookie.length));
					try {
						return JSON.parse(storedValues);
					} catch(e) {
						return storedValues;
					}
				}
			}
			return null;
		}else{
			return false;
		}
	}
	var removeCookie = function (key) {
		if(SupportsCookies){
			// var expires = 'text;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
			var expires = ';max-age=1;';
			document.cookie = key +'='+null+expires;
			//setCookie(key,expires);
			return true;
		}else{
			return false;
		}
	}
	var clearCookie = function () {
		if (SupportsCookies) {
			var thisCookie = null, thisKey = null;
			// var prefixLength = prefix.length;
			var cookies = document.cookie.split(';');
			for(var i = 0; i < cookies.length; i++) {
				thisCookie = cookies[i];
				while (thisCookie.charAt(0) === ' ') {
					thisCookie = thisCookie.substring(1, thisCookie.length);
				}
				var key = thisCookie.substring(0, thisCookie.indexOf('='));

				if(key!='' && key!=undefined && key!=null){
					removeCookie(key);
				}
			}
			return true;
		}else{
			return false;
		}
	}
	var bindCookieToScope = function (scope, key, def, lsKey) {
		lsKey = lsKey || key;
		var value = getCookie(lsKey);

		if (value === null && isDefined(def)) {
			value = def;
		} else if (isObject(value) && isObject(def)) {
			value = extend(def, value);
		}

		$parse(key).assign(scope, value);
		return scope.$watch(key, function(newVal) {
				setCookie(lsKey, newVal);
			}, isObject(scope[key]));
	}
	// COOKIES METODOS FIN

	return {
		local: {
			set: function (key, value) {
				storageType = 'localStorage';
				return setStorage(key, value);
			},
			get: function (key) {
				storageType = 'localStorage';
				return getStorage(key);
			},
			remove: function (key) {
				storageType = 'localStorage';
				return removeStorage(key);
			},
			removeAll: function () {
				storageType = 'localStorage';
				return clearStorage();
			},
			bindScope:  function (scope, key, def, lsKey){
				storageType = 'localStorage';
				return bindStorageToScope(scope, key, def, lsKey);
			},
			isSupport: SupportsStorage
		},

		session: {
			set: function (key, value) {
				storageType = 'sessionStorage';
				return setStorage(key, value);
			},
			get: function (key) {
				storageType = 'sessionStorage';
				return getStorage(key);
			},
			remove: function (key) {
				storageType = 'sessionStorage';
				return removeStorage(key);
			},
			removeAll: function () {
				storageType = 'sessionStorage';
				return clearStorage();
			},
			bindScope:  function (scope, key, def, lsKey){
				storageType = 'sessionStorage';
				return bindStorageToScope(scope, key, def, lsKey);
			},
			isSupport: SupportsStorage
		},

		cookie: {
			set: setCookie,
			get: getCookie,
			remove: removeCookie,
			removeAll: clearCookie,
			bindScope: bindCookieToScope,
			setDomain: function (domain) {
				if (angular.isString(domain)) {
					domainConfig = domain;
				}
				return this;
			},
			setMaxAge: function (age) {
				if(angular.isNumber(age)){
					maxageConfig = age;
				}
				return this;
			},
			setPath: function (path) {
				if (angular.isString(path)) {
					pathConfig = path
				}
				return this;
			},
			isSupport: SupportsCookies
		},

		database: {
		}
	}
});