'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const CargoApp = require('cargo-lib/CargoApp');
const cargo = require('cargo-lib');
const kcors = require('kcors');
const koa_io = require('koa.io');

class App extends CargoApp {

  constructor(opts) {
    super(opts);
    // @property {koa.app} - The socket server.
    this.socketServer = null;
    this.store = null;
    // @property {array} - The currently connected sockets.
    this.sockets = [];
    this.inChannels = [ this.config.get('channels.answers.outgoing') ];
    this._broadcast = null;
  }

  /** @inheritdoc */
  *onStart() {
    this.initService();

    //this.rewardsTable = this.config.get('store.rewards.rewards_table');
    const storeOpts = Object.assign({}, this.config.get('store.base'), this.config.get('store.logs'));
    this.store = yield cargo.storeManager.initStore(storeOpts.type, storeOpts);
    this.log.info(`store initialised on reward admin`);

   yield this.subscribe()
    yield this.broker.subscribe(this.inChannels, (channel, message) => {
      this.log.debug('received answer');
      try {
        for (var socket of this.sockets) {
          this.log.debug('emitted');
          socket.socket.emit('reward-event', JSON.stringify(message));
        }
      }
      catch (error) {
        this.log.error("Failed to broadcast the log event:", message);
        this.log.error(error.stack);
        throw error;
      }
    });;

  }

  /**
   * Initialize the HTTP API socketServer.
   */
  initService() {
    const _this = this;

    /** @const {String} The broker channels from which logs should be sourced. */
   // const logChannel = this.config.get('channels.rewards.incoming');

    /** @const {String} The log event stream socket port. */
    const port = this.config.get('wijzeStad.socketStreamPort');

    /**
     * This handler is called for each new socket connection.
     * @param {Socket} socket
     */
    const onConnect = function* (socket) {
      //socket.socket.emit('reward-event', JSON.stringify({ message: 'init'}));
      _this.sockets.push({
        id: null,
        socket: socket
      });
    };

    /**
     * This handler is called for each socket client that disconnects.
     * @param {Socket} socket
     */
    const onDisconnect = function* (socket) {
      try {
        if (_this.sockets.length == 0) { return; }

        _this.sockets.splice(_this.sockets.indexOf(socket), 1);
        _this.log.trace(`Disconnecting socket - ${_this.sockets.length} sockets still connected.`);
        /*
        if (_this.sockets.length == 0) {
          // The last person turns of the lights.
          _this.broker.reset();
        }*/
      }
      catch(error) {
        _this.log.error(`Unexpected error in admin.initService > onDisconnect. ${error}`);
      }
    };

    // Initialize the socket socketServer:
    this.socketServer = koa_io();
    this.socketServer.name = 'socket-server';

    this.socketServer.use(kcors());

    // Add error handler:
    this.socketServer.on('error', (err, ctx) => {
      _this.log.error('socketServer error', err, ctx);
    });

    // middleware for socket.io's connect and disconnect
    this.socketServer.io.use(function* (next) {
      yield* onConnect(this);
      yield* next;
      yield* onDisconnect(this);
    });


    this.socketServer.listen(port);
    this.log.info(`The socket server listens on port ${port}`);
  }
  subscribe() {
    const _this = this;
    _this.log.debug('subscribed');
    return this.broker.subscribe(this.inChannels, (channel, event) => {
      _this.log.debug(event);
      for(const socket in _this.sockets) {
        _this.sockets[socket].emit('init', 'welcome');
      }
    });
  }

}

module.exports = App;
