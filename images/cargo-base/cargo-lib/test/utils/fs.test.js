'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const resolve = require('path').resolve;

const _ = require('lodash');
const chai = require("chai"); // chai-as-promised, chai-http & co-mocha are loaded by rootHooks.js
const fs = require('cargo-lib/utils/fs');

const assert = chai.assert;

describe('utils/fs', function () {

  const voidPath = resolve(__dirname, 'fixtures/fs/void');
  const filePath = resolve(__dirname, 'fixtures/fs/some.file');
  const dirPath = resolve(__dirname, 'fixtures/fs');
  const sockPath = '/var/run/docker.sock';

  describe('isDirectoryAsync', function () {

    it('should fail on a void path', function () {
      return assert.becomes(fs.isDirectoryAsync(voidPath), false);
    });

    it('should fail on a file', function () {
      return assert.becomes(fs.isDirectoryAsync(filePath), false);
    });

    it('should fail on a socket', function () {
      return assert.becomes(fs.isDirectoryAsync(sockPath), false);
    });

    it('should succeed on a directory', function () {
      return assert.becomes(fs.isDirectoryAsync(dirPath), true);
    });

  });

  describe('assertDirectoryAsync', function () {

    it('should fail on a void path', function () {
      return assert.isRejected(fs.assertDirectoryAsync(voidPath));
    });

    it('should fail on a file', function () {
      return assert.isRejected(fs.assertDirectoryAsync(filePath));
    });

    it('should fail on a socket', function () {
      return assert.isRejected(fs.assertFileAsync(sockPath));
    });

    it('should succeed on a directory', function () {
      return assert.isFulfilled(fs.assertDirectoryAsync(dirPath));
    });

  });

  describe('isFileAsync', function () {

    it('should fail on a void path', function () {
      return assert.becomes(fs.isFileAsync(voidPath), false);
    });

    it('should fail on a directory', function () {
      return assert.becomes(fs.isFileAsync(dirPath), false);
    });

    it('should fail on a socket', function () {
      return assert.becomes(fs.isFileAsync(sockPath), false);
    });

    it('should succeed on a file', function () {
      return assert.becomes(fs.isFileAsync(filePath), true);
    });

  });

  describe('assertFileAsync', function () {

    it('should fail on a void path', function () {
      return assert.isRejected(fs.assertFileAsync(voidPath));
    });

    it('should fail on a directory', function () {
      return assert.isRejected(fs.assertFileAsync(dirPath));
    });

    it('should fail on a socket', function () {
      return assert.isRejected(fs.assertFileAsync(sockPath));
    });

    it('should succeed on a file', function () {
      return assert.isFulfilled(fs.assertFileAsync(filePath));
    });

  });

  describe('isSocketAsync', function () {

    it('should fail on a void path', function () {
      return assert.becomes(fs.isSocketAsync(voidPath), false);
    });

    it('should fail on a file', function () {
      return assert.becomes(fs.isSocketAsync(filePath), false);
    });

    it('should fail on a directory', function () {
      return assert.becomes(fs.isSocketAsync(dirPath), false);
    });

    it('should succeed on a socket', function () {
      return assert.becomes(fs.isSocketAsync(sockPath), true);
    });

  });

  describe('assertSocketSync', function () {

    it('should fail on a void path', function () {
      return assert.throws(() => fs.assertSocketSync(voidPath));
    });

    it('should fail on a file', function () {
      return assert.throws(() => fs.assertSocketSync(filePath));
    });

    it('should fail on a directory', function () {
      return assert.throws(() => fs.assertSocketSync(dirPath));
    });

    it('should succeed on a socket', function () {
      return assert.doesNotThrow(() => fs.assertSocketSync(sockPath));
    });

  });

  describe('assertSocketAsync', function () {

    it('should fail on a void path', function () {
      return assert.isRejected(fs.assertSocketAsync(voidPath));
    });

    it('should fail on a file', function () {
      return assert.isRejected(fs.assertSocketAsync(filePath));
    });

    it('should fail on a directory', function () {
      return assert.isRejected(fs.assertSocketAsync(dirPath));
    });

    it('should succeed on a socket', function () {
      return assert.isFulfilled(fs.assertSocketAsync(sockPath));
    });

  });

  describe('readYamlAsync', function () {

    it('reads yaml file', function () {
      return assert.becomes(fs.readYamlAsync(resolve(__dirname, 'fixtures/readYamlAsync/test.yml')),
        {
          number: 123,
          string: 'abc',
          bool_true: true,
          bool_false: false,
          object: {
            number: 123,
            string: 'abc',
            bool_true: true,
            bool_false: false
          },
          array: [1, 2, 'three']
        }
      );
    });

  }); // END: readYamlAsync

});
