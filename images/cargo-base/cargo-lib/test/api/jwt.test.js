'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const bigInt = require("big-integer");
const jwt = require('cargo-lib/api/jwt');
const chai = require('chai'); // chai-as-promised, chai-http & co-mocha are loaded by rootHooks.js
const koa = require('koa');
const log4js = require('log4js');

const assert = chai.assert;
const request = chai.request;

const log = log4js.getLogger('api/jwt', log4js.levels.DEBUG);
//process.env.QUIET = 'false'; // show logs for this container

describe('api/jwt', function () {

  describe('basics', function () {

    it('sync', function* () {
      const payload = {
        user: 'test_user'
      };
      const jwtSecret = 'random_198264';
      const jwtOpts = { expiresIn: 60 };
      const token = jwt.sign(payload, jwtSecret, jwtOpts);
      //log.debug('token:', token);

      let decoded = jwt.verify(token, jwtSecret);
      //log.debug('decoded:', decoded);
      assert.equal(decoded.user, payload.user);

      decoded = jwt.decode(token);
      assert.equal(decoded.user, payload.user);
    });

    it('async', function* () {
      const payload = {
        user: 'test_user'
      };
      const jwtSecret = 'random_198264';
      const jwtOpts = { expiresIn: 60 };
      const token = yield jwt.signAsync(payload, jwtSecret, jwtOpts);
      //log.debug('token:', token);

      let decoded = yield jwt.verifyAsync(token, jwtSecret);
      //log.debug('decoded:', decoded);
      assert.equal(decoded.user, payload.user);

      decoded = yield jwt.decodeAsync(token, jwtSecret);
      assert.equal(decoded.user, payload.user);
    });

  });

  describe('usage', function () {

    it('jwt signing with roles array', function* () {
      const activities = [
        'test_act_1',
        'test_act_2',
        'test_act_3',
        'test_act_4',
        'test_act_5',
        'test_act_6'
      ];
      const role_a = [
        'test_act_1',
        'test_act_2'
      ];
      const role_b = [
        'test_act_2',
        'test_act_3'
      ];
      const payload = {
        user: 'test_user',
        isRoot: true,
        roles: ['role_a', 'role_b']
      };
      const jwtSecret = 'random_198264';
      const jwtOpts = { expiresIn: 60 };
      const token = yield jwt.signAsync(payload, jwtSecret, jwtOpts);
      //log.debug('token:', token);

      const decoded = yield jwt.verifyAsync(token, jwtSecret);
      //log.debug('decoded:', decoded);
      assert.equal(decoded.user, 'test_user');
      assert.lengthOf(decoded.roles, 2);
      assert.include(decoded.roles, 'role_a');
      assert.include(decoded.roles, 'role_b');
    });

    //let timerCnt = 100000;
    //let a1 = 102030405, b1 = 91008264;
    //let a2 = bigInt(12345), b2 = bigInt(90864);
    //
    //it('time binary and-operator over regular number', function* () {
    //  console.time('time');
    //  let c;
    //  for (let i = 0; i < timerCnt; i++) {
    //    c = a1 | b1;
    //  }
    //  console.timeEnd('time');
    //});
    //
    //it('time binary and-operator over big-integers', function* () {
    //  console.time('time');
    //  let c;
    //  for (let i = 0; i < timerCnt; i++) {
    //    c = a2 | b2;
    //  }
    //  console.timeEnd('time');
    //});

    it('big integer - binary ops', function* () {
      const actIdx1 = bigInt[2].pow(42);
      const actIdx2 = bigInt[2].pow(102);
      const actIdx3 = bigInt[2].pow(67);
      const actIdx4 = bigInt[2].pow(12);

      const actBmp1 = actIdx1.or(actIdx2);

      assert(actBmp1.and(bigInt[2].pow(0)).isZero());
      assert(!actBmp1.and(actIdx1).isZero());
      assert(!actBmp1.and(actIdx2).isZero());
      assert(!actBmp1.and(actIdx1.or(actIdx2)).isZero());
      assert(!actBmp1.and(actIdx1.or(actIdx2).or(actIdx3)).isZero());
      assert(actBmp1.and(actIdx3).isZero());
      assert(actBmp1.and(actIdx4).isZero());
      assert(actBmp1.and(actIdx3.or(actIdx4)).isZero());
    });

    it('big integer - serialize', function* () {
      const actIdx1 = bigInt[2].pow(42);
      const actIdx2 = bigInt[2].pow(78);
      const actBmp1 = actIdx1.or(actIdx2);
      let serialized = actBmp1.toString(16);
      //log.debug(serialized);
      assert.isString(serialized);
      assert(actBmp1.eq(bigInt(serialized, 16)));

      serialized = actBmp1.toString(32);
      //log.debug(serialized);
      assert.isString(serialized);
      assert(actBmp1.eq(bigInt(serialized, 32)));
    });

    it('jwt with big integer', function* () {
      const actIdx1 = bigInt[2].pow(42);
      const actIdx2 = bigInt[2].pow(101);
      const actIdx3 = bigInt[2].pow(67);
      const actIdx4 = bigInt[2].pow(12);

      const actBmp1 = actIdx1.or(actIdx2);

      const payload = {
        user: 'test_user',
        isRoot: true,
        abm: actBmp1.toString(32)
      };
      const jwtSecret = 'random_198264';
      const jwtOpts = { expiresIn: 60 };
      const token = yield jwt.signAsync(payload, jwtSecret, jwtOpts);
      //log.debug('token:', token);

      const decoded = yield jwt.verifyAsync(token, jwtSecret);
      //log.debug('decoded:', decoded);
      assert.equal(decoded.user, 'test_user');
      assert.isTrue(decoded.isRoot);

      decoded.abm = bigInt(decoded.abm, 32);
      assert(!decoded.abm.and(actIdx1).isZero());
      assert(!decoded.abm.and(actIdx2).isZero());
      assert(!decoded.abm.and(actIdx1.or(actIdx2)).isZero());
      assert(!decoded.abm.and(actIdx1.or(actIdx2).or(actIdx3)).isZero());
      assert(decoded.abm.and(actIdx3).isZero());
      assert(decoded.abm.and(actIdx4).isZero());
      assert(decoded.abm.and(actIdx3.or(actIdx4)).isZero());
    });

  });

  describe('middleware failure tests', function () {

    const TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE0MjY1NDY5MTl9.ETgkTn8BaxIX4YqvUWVFPmum3moNZ7oARZtSBXb_vP4';
    const secret = 'shhhhhh';

    it('should throw 401 if no authorization header or query param', function () {
      const app = koa();
      app.use(jwt.middleware({ secret }));
      request(app.listen())
        .get(`/`)
        .end((err, res) => {
          assert.equal(res.status, 401);
        });
    });

    it('should return 401 if authorization header is malformed', function () {
      var app = koa();
      app.use(jwt.middleware({ secret }));
      request(app.listen())
        .get('/')
        .set('Authorization', 'wrong')
        .end((err, res) => {
          assert.equal(res.status, 401);
        });
    });

    it('should throw if authorization header is not well-formatted jwt', function () {
      var app = koa();
      app.use(jwt.middleware({ secret }));
      request(app.listen())
        .get('/')
        .set('Authorization', 'Bearer wrongjwt')
        .end((err, res) => {
          assert.equal(res.status, 401);
        });
    });

    it('should throw if authorization header is not valid jwt', function () {
      var token = jwt.sign({ foo: 'bar' }, secret);
      var app = koa();
      app.use(jwt.middleware({ secret: 'different-shhhh', debug: true }));
      request(app.listen())
        .get('/')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          assert.equal(res.status, 401);
        });
    });

    it('should throw if authorization query param is not valid jwt', function () {
      var token = jwt.sign({ foo: 'bar' }, secret);
      var app = koa();
      app.use(jwt.middleware({ secret: 'different-shhhh', debug: true }));
      request(app.listen())
        .get('/')
        .field('jwt', token)
        .end((err, res) => {
          assert.equal(res.status, 401);
        });
    });

    it('should throw if audience is not expected', function () {
      var token = jwt.sign({ foo: 'bar', aud: 'expected-audience' }, secret);
      var app = koa();
      app.use(jwt.middleware({ secret, audience: 'not-expected-audience', debug: true }));
      request(app.listen())
        .get('/')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          assert.equal(res.status, 401);
        });
    });

    it('should throw if token is expired', function () {
      var token = jwt.sign({ foo: 'bar', exp: 1382412921 }, secret);
      var app = koa();
      app.use(jwt.middleware({ secret, debug: true }));
      request(app.listen())
        .get('/')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          assert.equal(res.status, 401);
        });
    });

    it('should throw if token issuer is wrong', function () {
      var token = jwt.sign({ foo: 'bar', iss: 'http://foo' }, secret);
      var app = koa();
      app.use(jwt.middleware({ secret, issuer: 'http://wrong', debug: true }));
      request(app.listen())
        .get('/')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          assert.equal(res.status, 401);
        });
    });

    it('should throw if secret is not provided', function () {
      var token = jwt.sign({ foo: 'bar', iss: 'http://foo' }, secret);
      var app = koa();
      app.use(jwt.middleware({debug: true}));
      request(app.listen())
        .get('/')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          assert.equal(res.status, 500);
        });
    });

    it('should use (wrong) middleware secret if provided in both middleware and options', function () {
      var token = jwt.sign({ foo: 'bar', iss: 'http://foo' }, secret);
      var app = koa();
      app.use(jwt.middleware({ secret: 'wrong secret', debug: true }));
      request(app.listen())
        .get('/')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          assert.equal(res.status, 401);
        });
    });

  });

  describe('middleware success tests', function () {
    const secret = 'shhhhhh';

    it('should work if authorization header is valid jwt', function () {
      var token = jwt.sign({ foo: 'bar' }, secret);

      var app = koa();
      app.use(jwt.middleware({ secret }));
      app.use(function* () {
        this.body = this.state.user;
      });

      request(app.listen())
        .get('/')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.foo, 'bar');
          assert.equal(res.body.token, token);
        });
    });

    it('should work if jwt query param is valid jwt', function () {
      var token = jwt.sign({ foo: 'bar' }, secret);

      var app = koa();
      app.use(jwt.middleware({ secret }));
      app.use(function* () {
        this.body = this.state.user;
      });

      request(app.listen())
        .get('/')
        .field('jwt', token)
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.foo, 'bar');
        });
    });

    it('should use provided key for decoded data', function () {
      var token = jwt.sign({ foo: 'bar' }, secret);

      var app = koa();
      app.use(jwt.middleware({ secret, key: 'customKey' }));
      app.use(function* () {
        this.body = this.state.customKey;
      });

      request(app.listen())
        .get('/')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.foo, 'bar');
        });
    });

    it('should work if secret is provided by middleware', function () {
      var token = jwt.sign({ foo: 'bar' }, secret);

      var app = koa();
      app.use(function *(next) {
        this.state.secret = secret;
        yield next;
      });
      app.use(jwt.middleware());
      app.use(function* () {
        this.body = this.state.user;
      });

      request(app.listen())
        .get('/')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.foo, 'bar');
        });
    });

    it('should use middleware secret if provided in both middleware and options', function () {
      var token = jwt.sign({ foo: 'bar' }, secret);

      var app = koa();
      app.use(function *(next) {
        this.state.secret = secret;
        yield next;
      });
      app.use(jwt.middleware({ secret: 'wrong secret' }));
      app.use(function* () {
        this.body = this.state.user;
      });

      request(app.listen())
        .get('/')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.foo, 'bar');
        });
    });

  });

});
