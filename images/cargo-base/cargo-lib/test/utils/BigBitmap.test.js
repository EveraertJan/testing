'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const arrayDiff = require('cargo-lib/utils/arrayDiff');
const BigBitmap = require('cargo-lib/utils/BigBitmap');
const chai = require('chai'); // chai-as-promised, chai-http & co-mocha are loaded by rootHooks.js
const log4js = require('log4js');

const assert = chai.assert;
const log = log4js.getLogger('test');

describe('utils/BigBitmap', function () {

  let bmp, bmp_2, str;

  it('empty', function () {
    bmp = new BigBitmap();
    assert.isFalse(bmp.has(0));
    assert.isFalse(bmp.has(3));
    assert.isFalse(bmp.has(10));
    assert.isFalse(bmp.has(77));
    assert.isFalse(bmp.has(78));

    assert.isTrue(bmp.eq(new BigBitmap()));
    assert.isFalse(bmp.eq(new BigBitmap(3, 78)));

    assert.isFalse(bmp.intersects(new BigBitmap()));
    assert.isFalse(bmp.intersects(new BigBitmap(3, 78)));
  });

  //it('basics', function () {
  //  let indices = [3, 78];
  //  let bmp = indices.reduce((bmp, index) => bmp.or(bigInt[2].pow(index)), bigInt.zero);
  //  let result = bmp.and(bigInt.zero).isZero();
  //  assert.isTrue(result);
  //});

  it('indices', function () {
    bmp = new BigBitmap(3, 78);

    assert.isFalse(bmp.has(0));
    assert.isTrue(bmp.has(3));
    assert.isFalse(bmp.has(10));
    assert.isFalse(bmp.has(77));
    assert.isTrue(bmp.has(78));

    assert.isTrue(bmp.eq(new BigBitmap(3, 78)));
    assert.isFalse(bmp.eq(new BigBitmap(3, 78, 102)));
    assert.isFalse(bmp.eq(new BigBitmap()));

    assert.isFalse(bmp.intersects(new BigBitmap()));
    assert.isFalse(bmp.intersects(new BigBitmap(102)));
    assert.isTrue(bmp.intersects(new BigBitmap(3)));
    assert.isTrue(bmp.intersects(new BigBitmap(3, 78)));
    assert.isTrue(bmp.intersects(new BigBitmap(3, 78, 102)));
  });

  it('add indeces', function () {
    bmp = new BigBitmap();
    bmp.add(3);
    bmp.add(78);

    assert.isFalse(bmp.has(0));
    assert.isTrue(bmp.has(3));
    assert.isFalse(bmp.has(10));
    assert.isFalse(bmp.has(77));
    assert.isTrue(bmp.has(78));

    assert.isTrue(bmp.eq(new BigBitmap(3, 78)));
    assert.isFalse(bmp.eq(new BigBitmap(3, 78, 102)));
    assert.isFalse(bmp.eq(new BigBitmap()));

    assert.isFalse(bmp.intersects(new BigBitmap()));
    assert.isFalse(bmp.intersects(new BigBitmap(102)));
    assert.isTrue(bmp.intersects(new BigBitmap(3)));
    assert.isTrue(bmp.intersects(new BigBitmap(3, 78)));
    assert.isTrue(bmp.intersects(new BigBitmap(3, 78, 102)));
  });

  it('serialize', function () {
    bmp = new BigBitmap(3, 78);

    assert.isTrue(bmp.eq(new BigBitmap(bmp.toString())));
    assert.isTrue(bmp.eq(new BigBitmap(bmp.toString(10), 10)));
    assert.isTrue(bmp.eq(new BigBitmap(bmp.toString(16), 16)));
  });

});
