const nock = require('nock');
const AllPosts = require('./fixtures/AllPosts.json');
const PaginatedPosts = require('./fixtures/PaginatedPosts.json');
const { getMediaStartingFrom } = require('../src/instagram');

describe('Instagram Service', () => {
  it('should extract new posts starting from last max id', async () => {
    const accessToken = 'some-access-token';
    const lastSyncedMaxId = '2086580960698049345_12345678';

    nock(`https://api.instagram.com`)
      .get(`/v1/users/self/media/recent/`)
      .query({
        access_token: accessToken,
        min_id: lastSyncedMaxId
      })
      .reply(200, AllPosts);

    const media = await getMediaStartingFrom(accessToken, lastSyncedMaxId);
    expect(media).toEqual([
      {
        instagramId: '2103913782500881485_12345678',
        imageUrl: 'https://some-image.com/vp/c763718f898c5f78979ef9f8ed19be9d/5DCD6B14/t51.2885-15/sh0.08/e35/s640x640/66615906_407924376495714_8082663129990530053_n.jpg?_nc_ht=scontent.cdninstagram.com',
        postUrl: 'https://www.instagram.com/p/B0ymnAsA3RNkE15Bi-Ox560WszBVL-vLCOTPZQ0/',
        postedAt: '1565026089'
      }
    ]);
  });

  it('should get fresh posts with pagination', async () => {
    const accessToken = 'some-access-token';
    const lastSyncedMaxId = '1866164733959413715_12345678';

    nock(`https://api.instagram.com`)
      .get(`/v1/users/self/media/recent/`)
      .query({
        access_token: accessToken,
        min_id: lastSyncedMaxId
      })
      .reply(200, PaginatedPosts.page1);

    nock(`https://api.instagram.com`)
      .get(`/v1/users/self/media/recent/`)
      .query({
        access_token: accessToken,
        min_id: '1935863706416162455_12345678',
        max_id: '1935863706416162455_12345678',
      })
      .reply(200, PaginatedPosts.page2);

    const media = await getMediaStartingFrom(accessToken, lastSyncedMaxId);
    expect(media.length).toEqual(8);
  });

  it('should return empty array if no fresh posts', async () => {
    const accessToken = 'some-access-token';
    const lastSyncedMaxId = '2103913782500881485_12345678';

    nock(`https://api.instagram.com`)
      .get(`/v1/users/self/media/recent/`)
      .query({
        access_token: accessToken,
        min_id: lastSyncedMaxId
      })
      .reply(200, AllPosts);

    const media = await getMediaStartingFrom(accessToken, lastSyncedMaxId);
    expect(media.length).toEqual(0);
  })
});