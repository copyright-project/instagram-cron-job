const nock = require('nock');

class Hash {
  whenFetchingHash(response) {
    return nock(`https://image-hash.herokuapp.com`)
      .post('/hash')
      .reply(200, response);
  }
  whenFetchingHashForImages(amount, responses) {
    if (!responses) {
      responses = Array.from(Array(amount), (_, i) => i);
    }
    responses.map(res => this.whenFetchingHash(res));
  }
}

module.exports = Hash;
