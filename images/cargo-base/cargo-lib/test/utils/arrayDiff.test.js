'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const arrayDiff = require('cargo-lib/utils/arrayDiff');
const chai = require('chai'); // chai-as-promised, chai-http & co-mocha are loaded by rootHooks.js
const log4js = require('log4js');

const assert = chai.assert;
const log = log4js.getLogger('test');

describe('utils/arrayDiff', function () {

  it('basics', function () {
    const [remove, keep, add] = arrayDiff([1, 2, 3, 4, 5], [4, 5, 1, 8, 9]);

    assert.isArray(remove);
    assert.lengthOf(remove, 2);
    assert.include(remove, 2);
    assert.include(remove, 3);

    assert.isArray(keep);
    assert.lengthOf(keep, 3);
    assert.include(keep, 1);
    assert.include(keep, 4);
    assert.include(keep, 5);

    assert.isArray(add);
    assert.lengthOf(add, 2);
    assert.include(add, 8);
    assert.include(add, 9);
  });

});
