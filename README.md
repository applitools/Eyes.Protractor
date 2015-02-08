Eyes.Protractor
==========================

 Applitools Eyes SDK For Protactor

Example:
__________________________

Change this example:

```javascript
describe('angularjs homepage', function() {
    it('should add one and two', function() {
        browser.get('http://juliemr.github.io/protractor-demo/');
        element(by.model('first')).sendKeys(1);
        element(by.model('second')).sendKeys(2);
        element(by.id('gobutton')).click();
        expect(element(by.binding('latest')).getText()).
            toEqual('3');
    });
});
```

To this:

```javascript
var Eyes = require('eyes.protractor').Eyes;
var eyes = new Eyes();
eyes.setApiKey("<YOUR_API_KEY>");

describe('angularjs homepage', function() {
    it('should add one and two', function() {
        eyes.open(browser, "JavaScript SDK", "Simple Protractor Test");
        browser.get('http://juliemr.github.io/protractor-demo/');
        eyes.checkWindow("Demo start");
        element(by.model('first')).sendKeys(1);
        element(by.model('second')).sendKeys(2);
        eyes.checkWindow("Input Ready");
        element(by.id('gobutton')).click();
        eyes.checkWindow("Result");

        expect(element(by.binding('latest')).getText()).
            toEqual('3');

        eyes.close();
    });
});

```

Note: older Protractor versions may require passing ```protractor.getInstance().driver``` instead of ```browser``` to ```eyes.open()```