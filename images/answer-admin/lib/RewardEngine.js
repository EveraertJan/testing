'use strict';

/**
 * @author Jan Everaert for iMinds.be [jan.everaert@imec.be]
 * @copyright 2016, imec v.z.w.
 */

const cargo = require('cargo-lib');
const prependError = cargo.utils.prependError;

const Reward = require('./Reward.js');

class RewardEngine {

  constructor(reward) {
    this.reward = reward;
    this._rewards = [];
    this._rewardsMap = new Map();
  }

  getReward(id) {
    return this._rewardsMap.get(id);
  }

  forEachReward(fn) {
    return this._rewards.forEach(fn);
  }

  mapRewards(fn) {
    return this._rewards.map(fn);
  }

  setRewards(rewards) {
    this._rewards = rewards;
  }

  addReward(id, payload) {
    if (this._rewardsMap.has(id)) {
      throw new Error(`id already exists`);
    }
    else {
      const reward = new Reward(id, payload);
      this._rewards.push(reward);
      this._rewardsMap.set(id, reward);
    }
  }

  deleteReward(id) {
    if (this._rewardsMap.has(id)) {
      this._rewardsMap.delete(id);
      this._rewards.splice(this._rewards.indexOf(this._rewardsMap.get(id)), 1);
    }
    else {
      throw new Error(`not found`);
    }
  }

  deleteRewards() {
    this._rewardsMap.clear();
    this._rewards = [];
  }

  reset() {
    this._rewards = [];
    this._rewardsMap = new Map();
  }
}

module.exports = RewardEngine;
