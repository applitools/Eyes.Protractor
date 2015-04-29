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
        promise = require('protractor').promise,
        ElementFinderWrapper = require('./ElementFinderWrappers').ElementFinderWrapper,
        ElementArrayFinderWrapper = require('./ElementFinderWrappers').ElementArrayFinderWrapper;

    var EyesUtils = require('eyes.utils'),
        PromiseFactory = EyesUtils.PromiseFactory,
        MutableImage = EyesUtils.MutableImage,
        BrowserUtils = EyesUtils.BrowserUtils;

    /**
     *
     * @param {String} serverUrl
     * @param {Boolean} isDisabled - set to true to disable Applitools Eyes and use the protractor webdriver directly.
     * @constructor
     **/
    function Eyes(serverUrl, isDisabled) {
        this._forceFullPage = false;
        this._promiseFactory = new PromiseFactory();
        EyesBase.call(this, this._promiseFactory, serverUrl || EyesBase.DEFAULT_EYES_SERVER, isDisabled);
    }

    Eyes.prototype = new EyesBase();
    Eyes.prototype.constructor = Eyes;

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype._getBaseAgentId = function () {
        return 'eyes-protractor/0.0.35';

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
        that._promiseFactory.setFactoryMethods(function (asyncAction) {
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
    /**
     * Visually validates a region in the screenshot.
     *
     * @param {Object} region The region to validate (in screenshot coordinates).
     *                          Object is {width: *, height: *, top: *, left: *}
     * @param {string} tag An optional tag to be associated with the screenshot.
     * @param {int} matchTimeout The amount of time to retry matching.
     * @return {Promise} A promise which is resolved when the validation is finished.
     */
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
    /**
     * Visually validates a region in the screenshot.
     *
     * @param {WebElement} element The element defining the region to validate.
     * @param {string} tag An optional tag to be associated with the screenshot.
     * @param {int} matchTimeout The amount of time to retry matching.
     * @return {Promise} A promise which is resolved when the validation is finished.
     */
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
                    var region = {height: size.height, width: size.width, left: point.x, top: point.y, relative: true};
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
    /**
     * Visually validates a region in the screenshot.
     *
     * @param {By} by The WebDriver selector used for finding the region to validate.
     * @param {string} tag An optional tag to be associated with the screenshot.
     * @param {int} matchTimeout The amount of time to retry matching.
     * @return {Promise} A promise which is resolved when the validation is finished.
     */
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
                    var region = {height: size.height, width: size.width, left: point.x, top: point.y, relative: true};
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
        var promise = this._forceFullPage ? BrowserUtils.getFullPageScreenshot(that._driver,
            that._promiseFactory, that._viewportSize) : that._driver.takeScreenshot();
        return promise.then(function(screenshot64) {
                parsedImage = new MutableImage(new Buffer(screenshot64, 'base64'), that._promiseFactory);
                return parsedImage.getSize();
            })
            .then(function(imageSize) {
                return BrowserUtils.findImageNormalizationFactor(that._driver, imageSize, that._viewportSize);
            }).then(function(factor) {
                if (factor === 0.5) {
                    that._logger.verbose('Eyes.getScreenshot() - scaling to fix retina size issue!');
                    return parsedImage.scaleImage(factor);
                }
                return parsedImage;
            }).then(function () {
                return parsedImage.getSize();
            }).then(function (imageSize) {
                // If the image is a viewport screenshot, we want to save the current scroll position (we'll need it
                // for check region).
                var isViewportScreenshot = imageSize.width <= that._viewportSize.width
                    && imageSize.height <= that._viewportSize.height;
                if (isViewportScreenshot) {
					that._logger.verbose('Eyes.getScreenshot() - viewport screenshot found!');
                    return BrowserUtils.getCurrentScrollPosition(that._driver).then(function (scrollPosition) {
						that._logger.verbose('Eyes.getScreenshot() - scroll position: ', scrollPosition);
						return parsedImage.setCoordinates(scrollPosition);
                    });
                }
            }).then(function () {
                return parsedImage;
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
        return ViewportSize.getViewportSize(this._driver, this._promiseFactory);
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype.setViewportSize = function (size) {
        return ViewportSize.setViewportSize(this._driver, size, this._promiseFactory);
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype.setForceFullPageScreenshot = function(force) {
        this._forceFullPage = force;
    };

    module.exports = Eyes;
}());
