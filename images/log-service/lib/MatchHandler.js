'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const Promise = require('cargo-lib').Promise;

class MatchHandler {

  /**
   * @param {cargo-lib.App} this
   */
  constructor(app) {
    //this.config = app.config;
    this.log = app.log;
    this._broker = app.broker;

    this.asmResponsesChannel = app.config.get('channels.system.asmResponses');
    //this.sheetsHost = app.config.get('fogg.hosts.sheets');
  }

  /**
   * Returns a promise.
   * @param {Object} match - The rulesEngine.match object emitted by the rules engine.
   * @param {Object} response - The response object to be sent to the log reporter.
   */
  handle(match, response) {
    // Add ESM instruction in the log report response when a rule of type 'esm.*' matched for one
    // event in the original report request:
    if (match.rule.consequence.asm) {
      //this.log.trace('ASM match found - match:', match);

      // Add ESM instruction in the response to the log report:
      //const sheet = match.rule.consequence.sheetId;
      //const platform = match.fact.platform;
      //const sheetUrl = `${this.sheetsHost}/${sheet}/${platform}/index.html`;
      //response.es = { url: sheetUrl };

      // Publish logService.esmResponse event:
      const event = {
        type: 'logService.asmResponse',
        timestamp: new Date().toISOString(),
        matchId: match.matchId,
        reward: {
          badge: null,
          points: 10
        }
      };
      return this._broker.publish(this.asmResponsesChannel, event).then(() => response);
    }
    else {
      return Promise.resolve();
    }
  }

}

module.exports = MatchHandler;
