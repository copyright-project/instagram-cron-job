const nock = require('nock');
const AllPosts = require('../fixtures/AllPosts.json');
const PaginatedPosts = require('../fixtures/PaginatedPosts.json');

class Posts {
  getAmountOfPosts() {
    return AllPosts.data.length;
  }
  getAllPosts() {
    return AllPosts.data;
  }
  whenFetchingMediaCount(accessToken) {
    return nock(`https://api.instagram.com`)
      .get(`/v1/users/self/`)
      .query({
        access_token: accessToken
      })
      .reply(200, {
        data: { counts: { media: AllPosts.data.length } }
      });
  }
  whenFetchingAllPosts(accessToken) {
    return nock(`https://api.instagram.com`)
      .get(`/v1/users/self/media/recent/`)
      .query({
        access_token: accessToken
      })
      .reply(200, AllPosts);
  }
  whenFetchingPostsStartingFromId(accessToken, lastMaxId) {
    return nock(`https://api.instagram.com`)
      .get(`/v1/users/self/media/recent/`)
      .query({
        access_token: accessToken,
        min_id: lastMaxId
      })
      .reply(200, AllPosts);
  }
  whenFetchingPage1(accessToken, cursorId) {
    return nock(`https://api.instagram.com`)
      .get(`/v1/users/self/media/recent/`)
      .query({
        access_token: accessToken,
        min_id: cursorId
      })
      .reply(200, PaginatedPosts.page1);
  }
  whenFetchingPage2(accessToken, cursorId) {
    return nock(`https://api.instagram.com`)
      .get(`/v1/users/self/media/recent/`)
      .query({
        access_token: accessToken,
        min_id: cursorId,
        max_id: cursorId
      })
      .reply(200, PaginatedPosts.page2);
  }
}
module.exports = Posts;
