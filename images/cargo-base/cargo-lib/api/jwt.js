'use strict';

/**
 * Provides properly promisified version of the `sign`, `verify` and `decode` functions in the
 * 'jsonwebtoken' package.
 *
 * @see https://www.npmjs.com/package/jsonwebtoken
 * @see https://github.com/auth0/node-jsonwebtoken
 *
 * Note that bluebird.promisifyAll(require('jsonwebtoken') does not yield the desired results, i.e.
 * the resulting `signAsync` always rejects because the original implementation does not seem to
 * respect the standard Node.js callback conventions.
 *
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const Promise = require('bluebird');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const log4js = require('log4js');

const log = log4js.getLogger('authAPI.test');

/**
 * Returns a promise that signs the given payload using the given secret or private key.
 * @param {object|string|buffer} payload
 * @param {string|buffer} secretOrPrivateKey
 * @param {object} [options] @see https://www.npmjs.com/package/jsonwebtoken
 * @returns {Promise}
 */
function signAsync(payload, secretOrPrivateKey, options) {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, secretOrPrivateKey, options, (err, token) => {
      if (err) {
        log.error('>> signAsync > error: ', err);
        reject(new Error(`Unexpected result received from jwt.sign. ${err}`));
      }
      else {
        resolve(token);
      }
    });
  });
}

/**
 * Returns a promise that verifies the given jwt-token using the given secret or private key, and
 * resolves to the payload decoded if the signature (and optionally expiration, audience, issuer)
 * are valid. If not, the promise will reject.
 * @param {string} token
 * @param {string|buffer} secretOrPrivateKey
 * @param {object} [options] @see https://www.npmjs.com/package/jsonwebtoken
 * @returns {Promise}
 */
function verifyAsync(token, secretOrPublicKey, options) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secretOrPublicKey, options, (error, result) => {
      if (error) {
        reject(error);
      }
      else {
        resolve(result);
      }
    });
  });
}

/**
 * Returns a promise that decodes the payload without verifying if the signature is valid.
 * @param {string} token
 * @param {object} [options] @see https://www.npmjs.com/package/jsonwebtoken
 * @returns {Promise}
 */
function decodeAsync(token, options) {
  return Promise.resolve(jwt.decode(token, options));
}

/**
 * Returns a Koa middleware instance that verifies the jwt-token in the request.
 * Derived from https://www.npmjs.com/package/koa-jwt
 *
 * Modifications with respect to the original implementation:
 * - The `passthrough` and `getToken` options are not available.
 * - The token is resolved from the authorization header or the jwt query parameter.
 *
 * @param {Object} opts - See https://www.npmjs.com/package/koa-jwt
 */
function middleware(opts) {
  opts = _.defaults(opts, { key: 'user' });
  const tokenResolvers = [resolveAuthorizationHeader, resolveQueryToken];
  return function* (next) {
    let token;
    for (var i = 0; i < tokenResolvers.length; i++) {
      token = tokenResolvers[i](this, opts);
      if (token) { break; }
    }

    if (!token) {
      this.throw(401, 'No authentication token found');
    }

    const secret = (this.state && this.state.secret) ? this.state.secret : opts.secret;
    if (!secret) {
      this.throw(500, 'Invalid secret');
    }

    let user;
    try {
      user = yield verifyAsync(token, secret, opts);
    }
    catch (error) {
      this.throw(401, `Invalid token${opts.debug ? ` - ${error.message}` : null}`);
      return;
    }

    if (!_.isObject(this.state)) { this.state = {}; }
    this.state[opts.key] = user;
    this.state[opts.key].token = token;

    yield next;
  };
}

/**
 * Attempts to parse a jwt-token from the Authorization header.
 * Derived from https://www.npmjs.com/package/koa-jwt
 *
 * This function checks the Authorization header for a `Bearer <token>` pattern and returns the
 * token section if present.
 *
 * @param {Object} ctx - The Koa context object.
 * @return {String|null} The resolved token or null if not found
 * @private
 */
function resolveAuthorizationHeader(ctx) {
  if (ctx.header && ctx.header.authorization) {
    const parts = ctx.header.authorization.split(' ');
    if (parts.length === 2) {
      const scheme = parts[0];
      const token = parts[1];
      if (/^Bearer$/i.test(scheme)) {
        return token;
      }
    }
    else {
      ctx.throw(401, 'Bad Authorization header format. Format is "Authorization: Bearer <token>"\n');
    }
  }
}

/**
 * Attempts to parse a jwt-token token from the query part in urls to protected files.
 *
 * This function checks for a `jwt` query parameter and returns its value if present.
 *
 * @param {Object} ctx - The Koa context object.
 * @return {String|null} The resolved token or null if not found
 * @private
 */
function resolveQueryToken(ctx) {
  if (ctx.query) {
    return ctx.query.jwt;
  }
}

module.exports = {
  decode: jwt.decode,
  decodeAsync,
  middleware,
  sign: jwt.sign,
  signAsync,
  verify: jwt.verify,
  verifyAsync
};
