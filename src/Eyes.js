/*
 ---

 name: Eyes

 description: The main type - to be used by the users of the library to access all functionality.

 provides: [Eyes]
 requires: [eyes.sdk, ElementFinderWrapper, ViewportSize, protractor]

 ---
 */

(function() {
  'use strict';

  var EyesSDK = require('eyes.sdk');
  var EyesBase = EyesSDK.EyesBase;
  var ViewportSize = require('./ViewportSize');
  var promise = require('q');
  var EyesUtils = require('eyes.utils');
  var PromiseFactory = EyesUtils.PromiseFactory;
  var BrowserUtils = EyesUtils.BrowserUtils;
  var ElementFinderWrapper = require('./ElementFinderWrappers').ElementFinderWrapper;
  var ElementArrayFinderWrapper = require('./ElementFinderWrappers').ElementArrayFinderWrapper;

  /**
   *
   * @param {String} serverUrl
   * @param {Boolean} isDisabled - set to true to disable Applitools Eyes and use the protractor webdriver directly.
   * @constructor
   **/
  function Eyes(serverUrl, isDisabled) {
    this._forceFullPage = false;
    this._imageRotationDegrees = 0;
    this._automaticRotation = true;
    this._isLandscape = false;
    this._hideScrollbars = false;
    this._stitchMode = Eyes.StitchMode.Scroll;
    this._promiseFactory = new PromiseFactory();
    EyesBase.call(this, this._promiseFactory, serverUrl || EyesBase.DEFAULT_EYES_SERVER, isDisabled);
  }

  Eyes.prototype = new EyesBase();
  Eyes.prototype.constructor = Eyes;

  Eyes.StitchMode = Object.freeze({
    // Uses scrolling to get to the different parts of the page.
    Scroll: 'Scroll',
    // Uses CSS transitions to get to the different parts of the page.
    CSS: 'CSS'
  });

  //noinspection JSUnusedGlobalSymbols
  Eyes.prototype._getBaseAgentId = function() {
    return 'eyes-protractor/0.0.48';
  };

  function _init(that, flow, isDisabled) {
    // extend protractor element to return ours
    if (!isDisabled) {
      var originalElementFn = global.element;
      global.element = function(locator) {
        return new ElementFinderWrapper(originalElementFn(locator), that, that._logger);
      };

      global.element.all = function(locator) {
        return new ElementArrayFinderWrapper(originalElementFn.all(locator), that, that._logger);
      };
    }
    // Set PromiseFactory to work with the protractor control flow and promises
    that._promiseFactory.setFactoryMethods(function(asyncAction) {
      return flow.execute(function() {
        var deferred = promise.defer();
        asyncAction(deferred.fulfill, deferred.reject);
        return deferred.promise;
      });
    }, function() {
      return promise.defer();
    });
  }

  //noinspection JSUnusedGlobalSymbols
  Eyes.prototype.open = function(driver, appName, testName, viewportSize) {
    var that = this;
    var flow = that._flow = driver.controlFlow();
    _init(that, flow, this._isDisabled);

    if (this._isDisabled) {
      return that._flow.execute(function() {
      });
    }

    that._driver = driver;

    return flow.execute(function() {
      return that._driver.getCapabilities()
        .then(function(capabilities) {
          var platformName = capabilities.caps_.platformName;
          var platformVersion = capabilities.caps_.platformVersion;
          var orientation = capabilities.caps_.orientation || capabilities.caps_.deviceOrientation;

          var majorVersion;
          if (!platformVersion || platformVersion.length < 1) {
            return;
          }
          majorVersion = platformVersion.split('.', 2)[0];
          if (platformName.toUpperCase() === 'ANDROID') {
            // We only automatically set the OS, if the user hadn't manually set it previously.
            if (!that.getHostOS()) {
              that.setHostOS('Android ' + majorVersion);
            }
          } else if (platformName.toUpperCase() === 'IOS') {
            if (!that.getHostOS()) {
              that.setHostOS('iOS ' + majorVersion);
            }
          } else {
            return;
          }

          if (orientation && orientation.toUpperCase() === 'LANDSCAPE') {
            that._isLandscape = true;
          }
        })
        .then(function() {
          return EyesBase.prototype.open.call(that, appName, testName, viewportSize);
        });
    });
  };

  //noinspection JSUnusedGlobalSymbols
  Eyes.prototype.close = function(throwEx) {
    var that = this;

    if (this._isDisabled) {
      return that._flow.execute(function() {
      });
    }
    if (throwEx === undefined) {
      throwEx = true;
    }

<<<<<<< HEAD
        return that._flow.execute(function() {
            // FIXME - remove this if the replacement code below works
            //return EyesBase.prototype.close.call(that, false)
            //    .then(function(results) {
            //        if (results.isPassed || !throwEx) {
            //            return results;
            //        } else {
            //            throw EyesBase.buildTestError(results, that._sessionStartInfo.scenarioIdOrName,
            //                that._sessionStartInfo.appIdOrName);
            //        }
            //    });
            return EyesBase.prototype.close.call(that, throwEx)
                .then(function(results) {
                    return results;
                }, function (err) {
                    throw err;
                });
        });
    };

    /**
     * A helper function for creating region objects to be used in checkWindow
     * @param {Object} point A point which represents the location of the region (x,y).
     * @param {Object} size The size of the region (width, height).
     * @param {boolean} isRelative Whether or not the region coordinates are relative to the image coordinates.
     * @return {Object} A region object.
     */
    var createRegion = function (point, size, isRelative) {
        return {left: Math.ceil(point.x), top: Math.ceil(point.y), width: Math.ceil(size.width),
            height: Math.ceil(size.height), relative: isRelative};
    };

    /**
     * A helper function for calling the checkWindow on {@code EyesBase} and handling the result.
     * @param {Eyes} eyes The Eyes object (a derivative of EyesBase) on which to perform the call.
     * @param {String} tag The tag for the current visual checkpoint.
     * @param {boolean} ignoreMismatch Whether or not the server should ignore a mismatch.
     * @param {int} retryTimeout The timeout. (Milliseconds).
     * @param {Object} region The region to check. Should be of the form  {width, height, left, top}.
     * @returns {Promise} A promise which resolves to the checkWindow result, or an exception of the result failed
     *                      and failure reports are immediate.
     */
    var callCheckWindowBase = function (eyes, tag, ignoreMismatch, retryTimeout, region) {
        return EyesBase.prototype.checkWindow.call(eyes, tag, false, retryTimeout, region)
            .then(function(result) {
                if (result.asExpected || !eyes._failureReportOverridden) {
                    return result;
                } else {
                    throw EyesBase.buildTestError(result, eyes._sessionStartInfo.scenarioIdOrName,
                        eyes._sessionStartInfo.appIdOrName);
                }
            });
    };

    //noinspection JSUnusedGlobalSymbols
    Eyes.prototype.checkWindow = function(tag, matchTimeout) {
        var that = this;
        if (that._isDisabled) {
            return that._flow.execute(function() {
            });
        }
        return that._flow.execute(function() {
            return callCheckWindowBase(that, tag, false, matchTimeout, undefined);
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
     * @return {Object} A promise which is resolved when the validation is finished.
     */
    Eyes.prototype.checkRegion = function(region, tag, matchTimeout) {
        var that = this;
        if (this._isDisabled) {
            return that._flow.execute(function() {
            });
        }
        return that._flow.execute(function() {
            return callCheckWindowBase(that, tag, false, matchTimeout, region)
=======
    return that._flow.execute(function() {
      return EyesBase.prototype.close.call(that, false)
        .then(function(results) {
          if (results.isPassed || !throwEx) {
            return results;
          } else {
            throw EyesBase.buildTestError(results, that._sessionStartInfo.scenarioIdOrName,
              that._sessionStartInfo.appIdOrName);
          }
>>>>>>> 0a87d59634a05c0ff75086738893180948d8335d
        });
    });
  };

  /**
   * A helper function for creating region objects to be used in checkWindow
   * @param {Object} point A point which represents the location of the region (x,y).
   * @param {Object} size The size of the region (width, height).
   * @param {boolean} isRelative Whether or not the region coordinates are relative to the image coordinates.
   * @return {Object} A region object.
   */
  var createRegion = function (point, size, isRelative) {
    return {left: Math.ceil(point.x), top: Math.ceil(point.y), width: Math.ceil(size.width),
      height: Math.ceil(size.height), relative: isRelative};
  };

  /**
   * A helper function for calling the checkWindow on {@code EyesBase} and handling the result.
   * @param {Eyes} eyes The Eyes object (a derivative of EyesBase) on which to perform the call.
   * @param {String} tag The tag for the current visual checkpoint.
   * @param {boolean} ignoreMismatch Whether or not the server should ignore a mismatch.
   * @param {int} retryTimeout The timeout. (Milliseconds).
   * @param {Object} region The region to check. Should be of the form  {width, height, left, top}.
   * @returns {Promise} A promise which resolves to the checkWindow result, or an exception of the result failed
   *                      and failure reports are immediate.
   */
  var callCheckWindowBase = function (eyes, tag, ignoreMismatch, retryTimeout, region) {
    return EyesBase.prototype.checkWindow.call(eyes, tag, false, retryTimeout, region)
      .then(function(result) {
        if (result.asExpected || !eyes._failureReportOverridden) {
          return result;
        } else {
          throw EyesBase.buildTestError(result, eyes._sessionStartInfo.scenarioIdOrName,
            eyes._sessionStartInfo.appIdOrName);
        }
      });
  };

  //noinspection JSUnusedGlobalSymbols
  Eyes.prototype.checkWindow = function(tag, matchTimeout) {
    var that = this;
    if (that._isDisabled) {
      return that._flow.execute(function() {
      });
    }
    return that._flow.execute(function() {
      return callCheckWindowBase(that, tag, false, matchTimeout, undefined);
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
   * @return {Object} A promise which is resolved when the validation is finished.
   */
  Eyes.prototype.checkRegion = function(region, tag, matchTimeout) {
    var that = this;
    if (this._isDisabled) {
      return that._flow.execute(function() {
      });
    }
    return that._flow.execute(function() {
      return callCheckWindowBase(that, tag, false, matchTimeout, region)
    });
  };

  //noinspection JSUnusedGlobalSymbols
  /**
   * Visually validates a region in the screenshot.
   *
   * @param {Object} element The element defining the region to validate.
   * @param {string} tag An optional tag to be associated with the screenshot.
   * @param {int} matchTimeout The amount of time to retry matching.
   * @return {Object} A promise which is resolved when the validation is finished.
   */
  Eyes.prototype.checkRegionByElement = function(element, tag, matchTimeout) {
    var that = this;
    var size;
    if (this._isDisabled) {
      return that._flow.execute(function() {
      });
    }
    return that._flow.execute(function() {
      return element.getSize()
        .then(function(elementSize) {
          size = elementSize;
          return element.getLocation();
        })
        .then(function(point) {
          return callCheckWindowBase(that, tag, false, matchTimeout, createRegion(point, size, true))
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
  Eyes.prototype.checkRegionBy = function(by, tag, matchTimeout) {
    var that = this;
    var element;
    var size;
    if (this._isDisabled) {
      return that._flow.execute(function() {
      });
    }
    return that._flow.execute(function() {
      return that._driver.findElement(by)
        .then(function(elem) {
          element = elem;
          return element.getSize();
        })
        .then(function(elementSize) {
          size = elementSize;
          return element.getLocation();
        })
        .then(function(point) {
          return callCheckWindowBase(that, tag, false, matchTimeout, createRegion(point, size, true))
        });
    });
  };

  //noinspection JSUnusedGlobalSymbols
  Eyes.prototype._waitTimeout = function(ms) {
    return this._flow.timeout(ms);
  };

  //noinspection JSUnusedGlobalSymbols
  Eyes.prototype.getScreenShot = function() {
    return BrowserUtils.getScreenshot(this._driver, this._promiseFactory, this._viewportSize, this._forceFullPage,
      this._hideScrollbars, this._stitchMode === Eyes.StitchMode.CSS, this._imageRotationDegrees,
      this._automaticRotation, this._os === 'Android' ? 90 : 270, this._isLandscape);
  };

  //noinspection JSUnusedGlobalSymbols
  Eyes.prototype.getTitle = function() {
    return this._driver.getTitle();
  };

  //noinspection JSUnusedGlobalSymbols
  Eyes.prototype.getInferredEnvironment = function() {
    var res = 'useragent:';
    return this._driver.executeScript('return navigator.userAgent')
      .then(function(userAgent) {
        return res + userAgent;
      }, function() {
        return res;
      });
  };

  //noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param mode Use one of the values in EyesBase.FailureReport.
   */
  Eyes.prototype.setFailureReport = function(mode) {
    if (mode === EyesBase.FailureReport.Immediate) {
      this._failureReportOverridden = true;
      mode = EyesBase.FailureReport.OnClose;
    }

    EyesBase.prototype.setFailureReport.call(this, mode);
  };

  //noinspection JSUnusedGlobalSymbols
  Eyes.prototype.getViewportSize = function() {
    return ViewportSize.getViewportSize(this._driver, this._promiseFactory);
  };

  //noinspection JSUnusedGlobalSymbols
  Eyes.prototype.setViewportSize = function(size) {
    return ViewportSize.setViewportSize(this._driver, size, this._promiseFactory);
  };

  //noinspection JSUnusedGlobalSymbols
  Eyes.prototype.setForceFullPageScreenshot = function(force) {
    this._forceFullPage = force;
  };

  //noinspection JSUnusedGlobalSymbols
  Eyes.prototype.getForceFullPageScreenshot = function() {
    return this._forceFullPage;
  };

  //noinspection JSUnusedGlobalSymbols
  Eyes.prototype.setForcedImageRotation = function(degrees) {
    if (typeof degrees != 'number') {
      throw new TypeError('degrees must be a number! set to 0 to clear');
    }
    this._imageRotationDegrees = degrees;
    this._automaticRotation = false;
  };

  //noinspection JSUnusedGlobalSymbols
  Eyes.prototype.getForcedImageRotation = function() {
    return this._imageRotationDegrees || 0;
  };

  //noinspection JSUnusedGlobalSymbols
  Eyes.prototype.setHideScrollbars = function(hide) {
    this._hideScrollbars = hide;
  };

  //noinspection JSUnusedGlobalSymbols
  Eyes.prototype.getHideScrollbars = function() {
    return this._hideScrollbars;
  };

  //noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param mode Use one of the values in Eyes.StitchMode.
   */
  Eyes.prototype.setStitchMode = function(mode) {
    switch (mode) {
      case Eyes.StitchMode.Scroll:
        this._stitchMode = Eyes.StitchMode.Scroll;
        break;
      case Eyes.StitchMode.CSS:
        this._stitchMode = Eyes.StitchMode.CSS;
        break;
      default:
        this._stitchMode = Eyes.StitchMode.Scroll;
        break;
    }
  };

  //noinspection JSUnusedGlobalSymbols
  /**
   *
   * @return {Eyes.StitchMode} The currently set StitchMode.
   */
  Eyes.prototype.getStitchMode = function() {
    return this._stitchMode;
  };

  module.exports = Eyes;
}());
