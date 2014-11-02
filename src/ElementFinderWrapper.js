/*
 ---

 name: ElementFinderWrapper

 description: Wraps Protractor's ElementFinder to make sure we return our own Web Element.

 ---
 */

(function () {
    "use strict";

    var GeneralUtils = require('eyes.utils').GeneralUtils,
        EyesRemoteWebElement = require('./EyesRemoteWebElement');

    function _patchWebElement(finder, eyes, logger) {
        var originalGetWebElementFn = finder.getWebElement;
        finder.getWebElement = function () {
            logger.verbose("ElementFinderWrapper:getWebElement - called");
            return new EyesRemoteWebElement(originalGetWebElementFn.apply(finder), eyes, logger);
        };

        var originalClickFn = finder.click;
        finder.click = function () {
            logger.verbose("ElementFinderWrapper:click - called");
            return finder.getWebElement()
                .then(function (element) {
                    return EyesRemoteWebElement.registerClick(element, eyes, logger);
                })
                .then(function () {
                    return new EyesRemoteWebElement(originalClickFn.apply(finder), eyes, logger);
                });
        };

        var originalSendKeysFn = finder.sendKeys;
        finder.sendKeys = function () {
            var args = Array.prototype.slice.call(arguments, 0);
            logger.verbose("ElementFinderWrapper:sendKeys - called");
            return finder.getWebElement()
                .then(function (element) {
                    return EyesRemoteWebElement.registerSendKeys(element, eyes, logger, args);
                })
                .then(function () {
                    return new EyesRemoteWebElement(originalSendKeysFn.call(finder, args), eyes, logger);
                });
        };
    }

    /**
     *
     * C'tor = initializes the module settings
     *
     * @param {Object} finder
     * @param {Object} eyes
     * @param {Object} logger
     *
     **/
    function ElementFinderWrapper(finder, eyes, logger) {
        this._finder = finder;
        this._logger = logger;
        this._eyes = eyes;
        GeneralUtils.mixin(this, finder);
        _patchWebElement(finder, eyes, logger);
    }

    ElementFinderWrapper.prototype.element = function (locator) {
        this._logger.verbose("!! element !!");
        return new ElementFinderWrapper(this._finder.element(locator), this._eyes, this._logger);
    };

    ElementFinderWrapper.prototype.$ = function(selector) {
        return new ElementFinderWrapper(this._finder.$(selector), this._eyes, this._logger);
    };

    ElementFinderWrapper.prototype.isPresent = function() {
        return new ElementFinderWrapper(this._finder.isPresent(), this._eyes, this._logger);
    };

    ElementFinderWrapper.prototype.isElementPresent = function(subLocator) {
        return new ElementFinderWrapper(this._finder.isElementPresent(subLocator), this._eyes, this._logger);
    };

    module.exports = ElementFinderWrapper;
}());
