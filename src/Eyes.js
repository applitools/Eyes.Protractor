/*
 ---

 name: Eyes

 description: The main type - to be used by the users of the library to access all functionality.

 provides: [Eyes]
 requires: [eyes.sdk, ElementFinderWrapper, ViewportSize, protractor]

 ---
 */

(function () {
    "use strict";

    var EyesSDK = require('eyes.sdk'),
        EyesBase = EyesSDK.EyesBase,
        ViewportSize = require('./ViewportSize'),
        PromiseFactory = EyesSDK.EyesPromiseFactory,
        promise = require('protractor').promise,
        ElementFinderWrapper = require('./ElementFinderWrapper');

    /**
     *
     * C'tor = initializes the module settings
     *
     * @param {String} serverUrl
     * @param {Boolean} isDisabled - set to true to disable Applitools Eyes and use the protractor webdriver directly.
     *
     **/
    function Eyes(serverUrl, isDisabled) {
        EyesBase.call(this, serverUrl || EyesBase.DEFAULT_EYES_SERVER, isDisabled);
    }

    Eyes.prototype = new EyesBase();
    Eyes.prototype.constructor = Eyes;

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype._getBaseAgentId = function () {
        return 'eyes-protractor/0.0.14';
    };

    function _init(that, flow) {
        // extend protractor element to return ours
        var originalElementFn = global.element;
        global.element = function (locator) {
            return new ElementFinderWrapper(originalElementFn(locator), that, that._logger);
        };

        // Set PromiseFactory to work with the protractor control flow and promises
        PromiseFactory.setFactoryMethods(function (asyncAction) {
            return flow.execute(function () {
                var deferred = promise.defer();
                asyncAction(deferred.fulfill, deferred.reject);
                return deferred.promise;
            });
        }, function () {
            return promise.defer();
        });
    }

    Eyes.prototype.open = function (driver, appName, testName, viewportSize) {
        var that = this,
            flow = that._flow = driver.controlFlow();

        that._driver = driver;

        _init(that, flow);

        return flow.execute(function () {
            return EyesBase.prototype.open.call(that, appName, testName, viewportSize);
        });
    };

    Eyes.prototype.checkWindow = function (tag, matchTimeout) {
        var that = this;
        return that._flow.execute(function () {
            return EyesBase.prototype.checkWindow.call(that, tag, false, matchTimeout);
        });
    };

    Eyes.prototype.checkRegion = function (region, tag, matchTimeout) {
        var that = this;
        return that._flow.execute(function () {
            return EyesBase.prototype.checkWindow.call(that, tag, false, matchTimeout, region);
        });
    };

    Eyes.prototype.checkRegionByElement = function (element, tag, matchTimeout) {
        var that = this,
            size;

        return that._flow.execute(function () {
            return element.getSize()
                .then(function (elementSize) {
                    size = elementSize;
                    return element.getLocation();
                })
                .then(function (point) {
                    var region = {height: size.height, width: size.width, left: point.x, top: point.y};
                    return EyesBase.prototype.checkWindow.call(that, tag, false, matchTimeout, region);
                });
        });
    };

    Eyes.prototype.checkRegionBy = function (by, tag, matchTimeout) {
        var that = this,
            element,
            size;

        return that._flow.execute(function () {
            return that._driver.findElement(by)
                .then(function (elem) {
                    element = elem;
                    return element.getSize();
                })
                .then(function (elementSize) {
                    size = elementSize;
                    return element.getLocation();
                })
                .then(function (point) {
                    var region = {height: size.height, width: size.width, left: point.x, top: point.y};
                    return EyesBase.prototype.checkWindow.call(that, tag, false, matchTimeout, region);
                });
        });
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype._waitTimeout = function (ms) {
        return this._flow.timeout(ms);
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype.getScreenShot = function () {
        return this._driver.takeScreenshot().then(function (screenShot64) {
            // Notice that returning a value from inside "then" automatically wraps the return value with a promise,
            // so we don't have to do it explicitly.
            return new Buffer(screenShot64, 'base64');
        });
    };

    Eyes.prototype.getTitle = function () {
        return this._driver.getTitle();
    };

    Eyes.prototype.getInferredEnvironment = function () {
        var res = "useragent:";
        return this._driver.executeScript('return navigator.userAgent').then(function (userAgent) {
            return res + userAgent;
        }, function () {
            return res;
        });
    };

    Eyes.prototype.getViewportSize = function () {
        return ViewportSize.getViewportSize(this._driver);
    };

    Eyes.prototype.setViewportSize = function (size) {
        return ViewportSize.setViewportSize(this._driver, size);
    };

    module.exports = Eyes;
}());
