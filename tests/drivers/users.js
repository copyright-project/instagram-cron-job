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
      .reply(200, this.users);
  }
  whenFetchingUser(userId) {
    return nock(`https://instagram-media-rights.firebaseio.com`)
      .get(`/users/${userId}.json`)
      .reply(200, this.users);
  }
  markAsSynced(userId) {
    return nock(`https://instagram-media-rights.firebaseio.com`)
      .patch(`/users/${userId}.json`, {
        isSyncedBack: true
      })
      .reply(200, 'OK');
  }
  setLastSyncedId(userId, lastSyncedMaxId) {
    return nock(`https://instagram-media-rights.firebaseio.com`)
      .patch(`/users/${userId}.json`, {
        lastSyncedMaxId
      })
      .reply(200);
  }
  updateAmountOfSyncedImages(userId, amount) {
    this.whenFetchingUser(userId);
    return nock(`https://instagram-media-rights.firebaseio.com`)
      .patch(`/users/${userId}.json`, {
        registeredImages: amount
      })
      .reply(200);
  }
}

module.exports = Users;
