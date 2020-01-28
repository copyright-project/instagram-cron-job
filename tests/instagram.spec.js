const PostsDriver = require('./drivers/posts');
const { getMediaStartingFrom } = require('../src/instagram');

describe('Instagram Service', () => {
  let posts;

  beforeEach(() => {
    posts = new PostsDriver();
  });

  it('should extract new posts starting from last max id', async () => {
    const accessToken = 'some-access-token';
    const lastSyncedMaxId = '2086580960698049345_12345678';

    posts.whenFetchingPostsStartingFromId(accessToken, lastSyncedMaxId);

    const media = await getMediaStartingFrom(accessToken, lastSyncedMaxId);
    expect(media).toEqual([
      {
        postId: '2103913782500881485_12345678',
        imageUrl:
          'https://some-image.com/vp/fa4ef0e5bf8a58968a7f265659ec0b9a/5E143FB3/t51.2885-15/e35/s150x150/66615906_407924376495714_8082663129990530053_n.jpg?_nc_ht=scontent.cdninstagram.com',
        postedAt: '1565026089'
      }
    ]);
  });

  it('should get fresh posts with pagination', async () => {
    const accessToken = 'some-access-token';
    const lastSyncedMaxId = '1866164733959413715_12345678';

    posts.whenFetchingPage1(accessToken, lastSyncedMaxId);
    posts.whenFetchingPage2(accessToken, '1935863706416162455_12345678');

    const media = await getMediaStartingFrom(accessToken, lastSyncedMaxId);
    expect(media.length).toEqual(10);
  });

  it('should return empty array if no fresh posts', async () => {
    const accessToken = 'some-access-token';
    const lastSyncedMaxId = '2103913782500881485_12345678';

    posts.whenFetchingPostsStartingFromId(accessToken, lastSyncedMaxId);

    const media = await getMediaStartingFrom(accessToken, lastSyncedMaxId);
    expect(media.length).toEqual(0);
  });
});
