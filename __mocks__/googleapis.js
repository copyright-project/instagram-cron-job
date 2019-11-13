module.exports = {
  google: {
    auth: {
      JWT: function () {
        // should be a constructor function
        this.authorize = cb => cb(null, { access_token: 'token' })
      }
    }
  }
};
