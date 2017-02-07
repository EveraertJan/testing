'use strict';

/**
 * @author Jan Everaert for iMinds.be [jan.everaert@imec.be]
 * @copyright 2016, imec v.z.w.
 */

const cargo = require('cargo-lib');
//const prependError = cargo.utils.prependError;

class Reward {

  constructor(id, payload) {
    this._id = id;
    this._label = payload.label;
    this._excerpt = payload.excerpt;
    this._img = payload.img.url;
    this._enableReward = true;
    this._type = payload.type;
    this._value = payload.value;
  }

  get id() { return this._id; }
  get label() { return this._label; }
  get img() { return this._img; }
  get value() { return this._value; }
  get type() { return this._type; }
  get excerpt() { return this._excerpt; }
  get enableReward() { return this._enableReward; }
  set enableReward(v) { this._enableReward = v; }

}

module.exports = Reward;
