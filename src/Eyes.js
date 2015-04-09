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
        MutableImage = EyesSDK.MutableImage,
        ViewportSize = require('./ViewportSize'),
        promise = require('protractor').promise,
        ElementFinderWrapper = require('./ElementFinderWrappers').ElementFinderWrapper,
        ElementArrayFinderWrapper = require('./ElementFinderWrappers').ElementArrayFinderWrapper;

    var EyesUtils = require('eyes.utils'),
        PromiseFactory = EyesUtils.PromiseFactory,
        BrowserUtils = EyesUtils.BrowserUtils;

    EyesUtils.setPromiseFactory(PromiseFactory);
    ViewportSize.setPromiseFactory(PromiseFactory);

    /**
     *
     * @param {String} serverUrl
     * @param {Boolean} isDisabled - set to true to disable Applitools Eyes and use the protractor webdriver directly.
     * @constructor
     **/
    function Eyes(serverUrl, isDisabled) {
        EyesBase.call(this, PromiseFactory, serverUrl || EyesBase.DEFAULT_EYES_SERVER, isDisabled);
    }

    Eyes.prototype = new EyesBase();
    Eyes.prototype.constructor = Eyes;

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype._getBaseAgentId = function () {
        return 'eyes-protractor/0.0.32';
    };

    function _init(that, flow, isDisabled) {
        // extend protractor element to return ours
        if (!isDisabled) {
            var originalElementFn = global.element;
            global.element = function (locator) {
                return new ElementFinderWrapper(originalElementFn(locator), that, that._logger);
            };

            global.element.all = function (locator) {
                return new ElementArrayFinderWrapper(originalElementFn.all(locator), that, that._logger);
            };
        }
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

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype.open = function (driver, appName, testName, viewportSize) {
        var that = this,
            flow = that._flow = driver.controlFlow();

        that._driver = driver;

        _init(that, flow, this._isDisabled);

        if (this._isDisabled) {
            return that._flow.execute(function () {
            });
        }

        return flow.execute(function () {
            return EyesBase.prototype.open.call(that, appName, testName, viewportSize);
        });
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype.close = function (throwEx) {
        var that = this;

        if (this._isDisabled) {
            return that._flow.execute(function () {
            });
        }

        if (throwEx === undefined) {
            throwEx = true;
        }

        return that._flow.execute(function () {
            return EyesBase.prototype.close.call(that, false)
                .then(function (results) {
                    if (results.isPassed || !throwEx) {
                        return results;
                    } else {
                        throw EyesBase.buildTestError(results, that._sessionStartInfo.scenarioIdOrName,
                            that._sessionStartInfo.appIdOrName);
                    }
                });
        });
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param mode Use one of the values in EyesBase.FailureReport.
     */
    Eyes.prototype.setFailureReport = function (mode) {
        if (mode === EyesBase.FailureReport.Immediate) {
            this._failureReportOverridden = true;
            mode = EyesBase.FailureReport.OnClose;
        }

        EyesBase.prototype.setFailureReport.call(this, mode);
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype.checkWindow = function (tag, matchTimeout) {
        var that = this;
        if (this._isDisabled) {
            return that._flow.execute(function () {
            });
        }
        return that._flow.execute(function () {
            return EyesBase.prototype.checkWindow.call(that, tag, false, matchTimeout)
                .then(function (result) {
                    if (result.asExpected || !that._failureReportOverridden) {
                        return result;
                    } else {
                        throw EyesBase.buildTestError(result, that._sessionStartInfo.scenarioIdOrName,
                            that._sessionStartInfo.appIdOrName);
                    }
                });
        });
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype.checkRegion = function (region, tag, matchTimeout) {
        var that = this;
        if (this._isDisabled) {
            return that._flow.execute(function () {
            });
        }
        return that._flow.execute(function () {
            return EyesBase.prototype.checkWindow.call(that, tag, false, matchTimeout, region)
                .then(function (result) {
                    if (result.asExpected || !that._failureReportOverridden) {
                        return result;
                    } else {
                        throw EyesBase.buildTestError(result, that._sessionStartInfo.scenarioIdOrName,
                            that._sessionStartInfo.appIdOrName);
                    }
                });
        });
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype.checkRegionByElement = function (element, tag, matchTimeout) {
        var that = this,
            size;
        if (this._isDisabled) {
            return that._flow.execute(function () {
            });
        }
        return that._flow.execute(function () {
            return element.getSize()
                .then(function (elementSize) {
                    size = elementSize;
                    return element.getLocation();
                })
                .then(function (point) {
                    var region = {height: size.height, width: size.width, left: point.x, top: point.y};
                    return EyesBase.prototype.checkWindow.call(that, tag, false, matchTimeout, region)
                        .then(function (result) {
                            if (result.asExpected || !that._failureReportOverridden) {
                                return result;
                            } else {
                                throw EyesBase.buildTestError(result, that._sessionStartInfo.scenarioIdOrName,
                                    that._sessionStartInfo.appIdOrName);
                            }
                        });
                });
        });
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype.checkRegionBy = function (by, tag, matchTimeout) {
        var that = this,
            element,
            size;
        if (this._isDisabled) {
            return that._flow.execute(function () {
            });
        }
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
                    return EyesBase.prototype.checkWindow.call(that, tag, false, matchTimeout, region)
                        .then(function (result) {
                            if (result.asExpected || !that._failureReportOverridden) {
                                return result;
                            } else {
                                throw EyesBase.buildTestError(result, that._sessionStartInfo.scenarioIdOrName,
                                    that._sessionStartInfo.appIdOrName);
                            }
                        });
                });
        });
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype._waitTimeout = function (ms) {
        return this._flow.timeout(ms);
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype.getScreenShot = function () {
        var that = this;
        var parsedImage;
        return that._driver.takeScreenshot()
            .then(function(screenshot64) {
                parsedImage = new MutableImage(new Buffer(screenshot64, 'base64'), that._promiseFactory);
                return parsedImage.getSize();
            })
            .then(function(imageSize) {
                return BrowserUtils.findImageNormalizationFactor(that._driver, imageSize, that._viewportSize);
            })
            .then(function(factor) {
                if (factor === 1) {
                    return parsedImage;
                }

                return parsedImage.scaleImage(factor)
                    .then(function () {
                        return parsedImage;
                    });
            });
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype.getTitle = function () {
        return this._driver.getTitle();
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype.getInferredEnvironment = function () {
        var res = "useragent:";
        return this._driver.executeScript('return navigator.userAgent').then(function (userAgent) {
            return res + userAgent;
        }, function () {
            return res;
        });
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype.getViewportSize = function () {
        return ViewportSize.getViewportSize(this._driver);
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype.setViewportSize = function (size) {
        return ViewportSize.setViewportSize(this._driver, size);
    };



    module.exports = Eyes;
}());
