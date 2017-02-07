'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const EventEmitter = require('events');

const Promise = require('bluebird');
const config = require('config');
const _ = require('lodash');
const log4js = require('log4js');

const Publisher = require('./Publisher');
const Subscriber = require('./Subscriber');

// -------------------------------------------------------------------------------------------------

const log = log4js.getLogger('broker/redis/Broker');

/**
 * Represents the stream broker.
 *
 * This class emits the following events:
 * - message : Emitted when the default client received a message from the broker. Listeners
 *             receive two arguments, the name of the channel, and the message as a JSON object.
 * - error : Emitted when the default client erred. Listeners receive one argument, the error
 *           description.
 */
class Broker extends EventEmitter {

  constructor() {
    super();

    /**
     * The hostname of the Redis broker.
     * @property {String}
     * @private
     */
    this._host = config.get('soyl.redis.host');

    /**
     * The default subscriber.
     * @property {Subscriber}
     * @private
     */
    this._subscriber = null;

    /**
     * The custom subscribers created by calling {@link initSubscriber}.
     * @property {Array.<Subscriber>}
     * @private
     */
    this._subscribers = [];

    /**
     * The default publisher.
     * @property {Publisher}
     * @private
     */
    this._publisher = null;
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Public methods:

  /**
   * Subscribe the default subscriber to the given channel(s). Messages received on this channel are
   * emitted to the 'message' handlers registered on this broker.
   *
   * If you call this method multiple times with different handlers, then all handlers are called
   * for all messages from all the channels you subscribed to. You can use the channel argument
   * passed to the handler to differentiate the messages, or you can use the {@link initSubscriber}
   * method to create separate subscribers.
   *
   * @param {String|Array<String>} channels - One channel name or an array of channel names.
   * @param {Function} [handler] - When provided this function will be added as listener for
   *          'message' events on the subscriber object. The handler is called with two arguments:
   *          the channel (a string) and the message (a JSON object).
   * @returns {Promise} A promise that resolves when the default subscriber is properly subscribed.
   */
  subscribe(channels, handler) {
    if (_.isString(channels) || (_.isArray(channels) && channels.length > 0)) {
      if (this._subscriber) {
        return this._subscriber.subscribe(channels, handler)
      }
      else {
        return this._initDefaultSubscriber()
          .then(subscriber => subscriber.subscribe(channels, handler));
      }
    }
    else {
      return Promise.reject(new Error(`The given channels parameter should be a string or a non-empty array, instead got '${channels}' in Broker.subscribe().`));
    }
  }

  /**
   * Unsubscribe the default subscriber from the given channels.
   *
   * @param {String|Array<String>} channels - One channel name or an array of channel names.
   * @returns {Promise} A promise that resolves when the default subscriber is properly unsubscribed.
   */
  unsubscribe(channels) {
    if (_.isString(channels) || (_.isArray(channels) && channels.length > 0)) {
      if (this._subscriber) {
        return this._subscriber.unsubscribe(channels);
      }
      else {
        return Promise.resolve();
      }
    }
    else {
      return Promise.reject(new Error(`The given channels parameter should be a string or a non-empty array, instead got '${channels}' in Broker.unsubscribe().`));
    }
  }

  /**
   * In most cases the use of {@link subscribe} and {@link unsubscribe} should suffice.
   * However, if you need to be able to manage multiple subscriptions separately, you can use this
   * method to obtain separate {@link Subscriber} instances.
   *
   * @returns {Promise.<Subscriber>} A Promise that initialises and resolve to a new {@link
   *          Subscriber} instance.
   */
  initSubscriber() {
    const subscriber = new Subscriber();
    this._subscribers.push(subscriber);
    return subscriber.init();
  }

  /**
   * Publish the message(s) on the given channel on the broker.
   *
   * This method uses the default publisher publisher to interact with the broker.
   *
   * @param {String} channel - The name of the channel to publish on.
   * @param {JSON|Array} messages - A single or an array of JSON message objects.
   */
  publish(channel, messages) {
    if (_.isString(channel)) {
      if (this._publisher) {
        return this._publisher.publish(channel, messages);
      }
      else {
        return this._initDefaultPublisher()
          .then(publisher => publisher.publish(channel, messages));
      }
    }
    else {
      return Promise.reject(new Error(`The given channels parameter should be a string, instead got '${channel}' in Broker.publish().`));
    }
  }

  /**
   * @returns {Promise} A Promise that stops all subscribers and publishers and resets the broker
   *          to its initial state.
   */
  reset() {
    return this._endDefaultSubscriber()
      .then(() => Promise.all(this._subscribers.map(subscriber => subscriber.end())))
      .then(() => this._endDefaultPublisher());
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // System methods:

  /** @private */
  _initDefaultSubscriber() {
    if (this._subscriber) { return Promise.resolve(this._subscriber); }

    this._subscriber = new Subscriber();

    return this._subscriber.init()
      .then(subscriber => {
        subscriber.on('message', (channel, message) => this.emit('message', channel, message));
        subscriber.on('error', error => this.emit('error', error));
        return Promise.resolve(subscriber);
      });
  }

  /** @private */
  _endDefaultSubscriber() {
    if (!this._subscriber) { return Promise.resolve(); }
    const subscriber = this._subscriber;
    delete this._subscriber;
    return subscriber.end();
  }

  /** @private */
  _initDefaultPublisher() {
    if (this._publisher) { return Promise.resolve(this._publisher); }

    this._publisher = new Publisher();

    return this._publisher.init()
      .then(publisher => {
        publisher.on('error', error => this.emit('error', error));
        return Promise.resolve(publisher);
      });
  }

  /** @private */
  _endDefaultPublisher() {
    if (!this._publisher) { return Promise.resolve(); }
    const publisher = this._publisher;
    delete this._publisher;
    return publisher.end();
  }

}

// -------------------------------------------------------------------------------------------------

module.exports = Broker;
