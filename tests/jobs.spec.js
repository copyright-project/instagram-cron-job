const jobs = require('../src/jobs');
const Hash = require('./drivers/hash');
const Users = require('./drivers/users');
const Posts = require('./drivers/posts');

jest.mock('../src/contract', () => ({
  registerMedia: jest.fn()
}));

describe('Jobs', () => {
  describe('Sync backward', () => {
    const userId = '12345678';
    const accessToken = 'some-access-token';
    let usersDriver, postsDriver, hashDriver;
    let markAsSyncedCall, lastSyncedIdCall, updateSyncedImagesCall;

    beforeEach(() => {
      usersDriver = new Users();
      postsDriver = new Posts();
      hashDriver = new Hash();
    });

    beforeEach(() => {
      usersDriver.givenNonSyncUser(userId, accessToken).whenFetchingAllUsers();
      postsDriver.whenFetchingMediaCount(accessToken);
      postsDriver.whenFetchingAllPosts(accessToken);
      hashDriver.whenFetchingHashForImages(10);
    });

    beforeEach(() => {
      markAsSyncedCall = usersDriver.markAsSynced(userId);
      lastSyncedIdCall = usersDriver.setLastSyncedId(
        userId,
        '2103913782500881485_12345678'
      );
      updateSyncedImagesCall = usersDriver.updateAmountOfSyncedImages(
        userId,
        postsDriver.getAmountOfPosts()
      );
    });

    it('should store image in contract', async () => {
      await jobs.syncBackJob();

      const registerMediaMock = require('../src/contract').registerMedia;
      const allPosts = postsDriver.getAllPosts();
      const lastIndex = allPosts.length - 1;

      expect(registerMediaMock).toHaveBeenCalledTimes(allPosts.length);
      expect(registerMediaMock).lastCalledWith(userId, {
        hash: lastIndex,
        instagramId: allPosts[lastIndex].id,
        imageUrl: allPosts[lastIndex].images.standard_resolution.url,
        postUrl: allPosts[lastIndex].link,
        postedAt: allPosts[lastIndex].created_time
      });
    });

    it('should mark user in the DB as synced', async () => {
      await jobs.syncBackJob();
      expect(markAsSyncedCall.isDone()).toBe(true);
    });

    it('should set last synced image id', async () => {
      await jobs.syncBackJob();
      expect(lastSyncedIdCall.isDone()).toBe(true);
    });

    it('should update amount of synced images', async () => {
      await jobs.syncBackJob();
      expect(updateSyncedImagesCall.isDone()).toBe(true);
    });
  });
});
