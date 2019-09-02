const nock = require('nock');

class Users {
  constructor() {
    this.users = {};
  }
  givenNonSyncUser(userId, accessToken) {
    this.users[userId] = {
      accessToken,
      username: 'snb'
    };
    return this;
  }
  whenFetchingAllUsers() {
    return nock(`https://instagram-media-rights.firebaseio.com`)
      .get('/users.json')
      .query(q => q['access_token'] !== undefined)
      .reply(200, this.users);
  }
  whenFetchingUser(userId) {
    return nock(`https://instagram-media-rights.firebaseio.com`)
      .get(`/users/${userId}.json`)
      .query(q => q['access_token'] !== undefined)
      .reply(200, this.users);
  }
  markAsSynced(userId) {
    return nock(`https://instagram-media-rights.firebaseio.com`)
      .patch(`/users/${userId}.json`, {
        isSyncedBack: true
      })
      .query(q => q['access_token'] !== undefined)
      .reply(200, 'OK');
  }
  setLastSyncedId(userId, lastSyncedMaxId) {
    return nock(`https://instagram-media-rights.firebaseio.com`)
      .patch(`/users/${userId}.json`, {
        lastSyncedMaxId
      })
      .query(q => q['access_token'] !== undefined)
      .reply(200);
  }
  updateAmountOfSyncedImages(userId, amount) {
    this.whenFetchingUser(userId);
    return nock(`https://instagram-media-rights.firebaseio.com`)
      .patch(`/users/${userId}.json`, {
        registeredImages: amount
      })
      .query(q => q['access_token'] !== undefined)
      .reply(200);
  }
}

module.exports = Users;
