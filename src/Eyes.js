/*
 ---

 name: Eyes

 description: The main type - to be used by the users of the library to access all functionality.

 provides: [Eyes]
 requires: [eyes.sdk, EyesRemoteWebElement, ViewportSize, protractor]

 ---
 */

(function () {
    "use strict";

    var EyesSDK = require('eyes.sdk'),
        EyesBase = EyesSDK.EyesBase,
        ViewportSize = require('./ViewportSize'),
        PromiseFactory = EyesSDK.EyesPromiseFactory,
        promise = require('protractor').promise,
        EyesRemoteWebElement = require('./EyesRemoteWebElement');

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

    Eyes.prototype.open = function (driver, appName, testName, viewportSize) {
        var that = this,
            flow = that._flow = driver.controlFlow(),
            originalElementFn = global.element;

        that._driver = driver;

        // extend protractor element to return ours
        global.element = function (locator) {
            return originalElementFn(locator).then(function (element) {
                return new EyesRemoteWebElement(element, that, that._logger);
            });
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

        return flow.execute(function () {
            var deferred = promise.defer();
            try {
                EyesBase.prototype.open.call(that, appName, testName, viewportSize)
                    .then(function () {
                        deferred.fulfill(that._driver);
                    });
            } catch (err) {
                that._logger.log(err);
                deferred.reject(err);
            }

            return deferred.promise;
        });
    };

    Eyes.prototype.close = function (throwEx) {
        if (throwEx === undefined) {
            throwEx = true;
        }

        return this._flow.execute(function () {
            var deferred = promise.defer();
            try {
                EyesBase.prototype.close.call(this, throwEx)
                    .then(function (results) {
                        deferred.fulfill(results);
                    }.bind(this), function (err) {
                        deferred.reject(err);
                    });
            } catch (err) {
                deferred.reject(err);
                if (throwEx) {
                    throw new Error(err.message);
                }
            }

            return deferred.promise;

        }.bind(this));
    };

    Eyes.prototype.checkWindow = function (tag, matchTimeout) {
        return this._flow.execute(function () {
            var deferred = promise.defer();
            try {
                EyesBase.prototype.checkWindow.call(this, tag, false, matchTimeout)
                    .then(function () {
                        deferred.fulfill();
                    }.bind(this), function (err) {
                        this._logger.log(err);
                        deferred.reject(err);
                    }.bind(this));
            } catch (err) {
                this._logger.log(err);
                deferred.reject(err);
            }

            return deferred.promise;
        }.bind(this));
    };

    Eyes.prototype.checkRegion = function (region, tag, matchTimeout) {
        return this._flow.execute(function () {
            var deferred = promise.defer();
            try {
                EyesBase.prototype.checkWindow.call(this, tag, false, matchTimeout, region)
                    .then(function () {
                        deferred.fulfill();
                    }.bind(this), function (err) {
                        this._logger.log(err);
                        deferred.reject(err);
                    }.bind(this));
            } catch (err) {
                this._logger.log(err);
                deferred.reject(err);
            }

            return deferred.promise;
        }.bind(this));
    };

    Eyes.prototype.checkRegionByElement = function (element, tag, matchTimeout) {
        return this._flow.execute(function () {
            var deferred = promise.defer();
            try {
                element.getSize().then(function (size) {
                    element.getLocation().then(function (point) {
                        var region = {height: size.height, width: size.width, left: point.x, top: point.y};
                        EyesBase.prototype.checkWindow.call(this, tag, false, matchTimeout, region)
                            .then(function () {
                                deferred.fulfill();
                            }.bind(this), function (err) {
                                this._logger.log(err);
                                deferred.reject(err);
                            }.bind(this));
                    }.bind(this));
                }.bind(this));
            } catch (err) {
                this._logger.log(err);
                deferred.reject(err);
            }

            return deferred.promise;
        }.bind(this));
    };

    Eyes.prototype.checkRegionBy = function (by, tag, matchTimeout) {
        return this._flow.execute(function () {
            var deferred = promise.defer();
            try {
                this._driver.findElement(by).then(function (element) {
                    element.getSize().then(function (size) {
                        element.getLocation().then(function (point) {
                            var region = {height: size.height, width: size.width, left: point.x, top: point.y};
                            EyesBase.prototype.checkWindow.call(this, tag, false, matchTimeout, region)
                                .then(function () {
                                    deferred.fulfill();
                                }.bind(this), function (err) {
                                    this._logger.log(err);
                                    deferred.reject(err);
                                }.bind(this));
                        }.bind(this));
                    }.bind(this));
                }.bind(this));
            } catch (err) {
                this._logger.log(err);
                deferred.reject(err);
            }

            return deferred.promise;
        }.bind(this));
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
