const nock = require('nock');

const FIREBASE_BASE_URL = 'https://open-rights.firebaseio.com';

class Users {
  constructor() {
    this.users = {};
  }
  givenNonSyncUser(userId, accessToken, copyrightAttribution) {
    this.users[userId] = {
      accessToken,
      copyrightAttribution
    };
    return this;
  }
  whenFetchingAllUsers() {
    return nock(FIREBASE_BASE_URL)
      .get('/users.json')
      .query(q => q['access_token'] !== undefined)
      .reply(200, this.users);
  }
  whenFetchingUser(userId) {
    return nock(FIREBASE_BASE_URL)
      .get(`/users/${userId}.json`)
      .query(q => q['access_token'] !== undefined)
      .reply(200, this.users);
  }
  markAsSynced(userId) {
    return nock(FIREBASE_BASE_URL)
      .patch(`/users/${userId}.json`, {
        isSyncedBack: true
      })
      .query(q => q['access_token'] !== undefined)
      .reply(200, 'OK');
  }
  setLastSyncedId(userId, lastSyncedMaxId) {
    return nock(FIREBASE_BASE_URL)
      .patch(`/users/${userId}.json`, {
        lastSyncedMaxId
      })
      .query(q => q['access_token'] !== undefined)
      .reply(200);
  }
  updateAmountOfSyncedImages(userId, amount) {
    this.whenFetchingUser(userId);
    return nock(FIREBASE_BASE_URL)
      .patch(`/users/${userId}.json`, {
        registeredImages: amount
      })
      .query(q => q['access_token'] !== undefined)
      .reply(200);
  }
}

module.exports = Users;
