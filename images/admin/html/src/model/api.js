'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

//import assert from 'assert'

import config from 'cargo-lib/html/system/config'
import request from 'cargo-lib/html/system/request'
//import { isDate } from 'lodash'

const API_HOST = config.wijzeStad.hosts.api;

// ---------------------------------- ---  --  -
// Rewards API:

function fetchRewards() {
  return request.get(`${API_HOST}/rewards/`, true)
    .then((response) => response.data.rewards);
}

function addReward(reward) {
  return request.post(`${API_HOST}/rewards/`, reward, true)
    .then((response) => response.data.reward);
}

function updateReward(id, data) {
  return request.patch(`${API_HOST}/rewards/${id}/`, data, true)
    .then((response) => response.data.reward);
}

function deleteReward(id) {
  return request.del(`${API_HOST}/rewards/${id}/`, true);
}

function testReward(reward) {
  console.log(reward);
  return request.post(`${API_HOST}/rewards/won/`, reward, true)
    .then((response) => response);
}

// ---------------------------------- ---  --  -
// rules API:

function fetchRules() {
  return request.get(`${API_HOST}/rules/`, true)
    .then((response) => response.data.rules);
}

function addRule(data, token) {
  return request.post(`${API_HOST}/rules/`, data, token)
    .then((response) => response.data.rule);
}

function updateRule(id, data) {
  return request.patch(`${API_HOST}/rules/${id}/`, data, true)
    .then((response) => response.data.rule);
}

// ---------------------------------- ---  --  -
// users API:

function fetchUsers() {
  return request.get(`${API_HOST}/auth/users/`, true)
    .then((response) => response.data.users);
}

function fetchUser(id) {
  if (!id) { throw new Error('The id parameter is missing'); }
  return request.get(`${API_HOST}/auth/users/${id}/`, true)
    .then((response) => response.data.user);
}

function deleteUser(id) {
  if (!id) { throw new Error('The id parameter is missing'); }
  return request.del(`${API_HOST}/auth/users/${id}/`, true);
}

function addUser(user) {
  const { username, password, roles, isRoot } = user;
  if (!username || !password) { throw new Error('Provide user and password'); }
  return request.post(`${API_HOST}/auth/users/${username}/`, { password, roles, isRoot }, true);
}

function updateUser(user) {
  const { username } = user;
  if (!username) { throw new Error('Provide user'); }
  return request.patch(`${API_HOST}/auth/users/${username}/`, user, true);
}
// ---------------------------------- ---  --  -
// logs API:

function fetchLogs(token) {
  return request.get(`${API_HOST}/logs/`, token)
    .then((response) => response.data);
}

function sendLog(log, token) {
  return request.post(`${API_HOST}/logs/`, log, token)
    .then((response) => response.data);
}

function testLog(token) {
  return request.get(`${API_HOST}/logs/test/`, token)
    .then((response) => {
      console.log(response);
      return response
    });
}


// ---------------------------------- ---  --  -
// roles API:

function fetchRoles() {
  return request.get(`${API_HOST}/auth/roles/`, true)
  .then((response) => response.data.roles);
}


// ---------------------------------- ---  --  -

export default {
  addReward,
  addRule,
  deleteReward,
  fetchRewards,
  fetchRules,
  testReward,
  updateReward,
  updateRule,
  fetchUsers,
  fetchUser,
  deleteUser,
  addUser,
  fetchRoles,
  updateUser,
  sendLog,
  fetchLogs,
  testLog
}
