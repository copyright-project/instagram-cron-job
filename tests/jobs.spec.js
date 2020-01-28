const nock = require('nock');
const Hash = require('./drivers/hash');
const Users = require('./drivers/users');
const Posts = require('./drivers/posts');

const mockCreateTx = jest.fn();
const mockCreateQuery = jest.fn();
const mockSendTx = jest.fn();
const mockSendQuery = jest.fn();

jest.doMock('orbs-client-sdk', () => ({
  Client: jest.fn().mockImplementation(() => ({
    createTransaction: mockCreateTx,
    createQuery: mockCreateQuery,
    sendTransaction: mockSendTx,
    sendQuery: mockSendQuery
  })),
  LocalSigner: jest.fn(),
  decodeHex: jest.fn(str => str),
  argString: jest.fn(str => str)
}));

describe('Jobs', () => {
  describe('Sync backward', () => {
    const userId = '12345678';
    const accessToken = 'some-access-token';
    const copyrightAttribution = 'Sergey Bolshchikov';
    let usersDriver, postsDriver, hashDriver, jobs;
    let markAsSyncedCall, lastSyncedIdCall, updateSyncedImagesCall;

    beforeEach(() => {
      jobs = require('../src/jobs');
    });

    beforeEach(() => {
      usersDriver = new Users();
      postsDriver = new Posts();
      hashDriver = new Hash();
    });

    beforeEach(() => {
      usersDriver
        .givenNonSyncUser(userId, accessToken, copyrightAttribution)
        .whenFetchingAllUsers();
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

    afterEach(() => {
      jest.resetModules();
      mockCreateTx.mockReset();
      mockCreateQuery.mockReset();
      mockSendTx.mockReset();
      mockSendQuery.mockReset();
    });

    it.only('should store image in contract', async () => {
      mockCreateTx.mockReturnValue(['tx']);
      mockSendTx.mockReturnValue({
        executionResult: 'SUCCESS',
        requestStatus: 'COMPLETED',
        transactionStatus: 'COMMITTED'
      });
      console.log(nock.pendingMocks());
      await jobs.syncBackJob();

      const allPosts = postsDriver.getAllPosts();
      const lastIndex = allPosts.length - 1;

      expect(mockCreateTx).toHaveBeenCalledTimes(allPosts.length);
      expect(mockCreateTx).lastCalledWith(
        process.env.REGISTRY_CONTRACT_NAME,
        'registerMedia',
        [
          `pHash-${lastIndex}`, 
          allPosts[lastIndex].images.thumbnail.url, 
          allPosts[lastIndex].created_time, 
          copyrightAttribution, 
          // `binaryHash-${lastIndex}`, 
        ]
      );
    });

    it('should register only those that do not exist', async () => {
      mockCreateTx.mockReturnValue(['tx']);
      mockSendTx.mockReturnValue({
        executionResult: 'SUCCESS',
        requestStatus: 'COMPLETED'
      });
      mockSendQuery.mockReturnValue({
        outputArguments: [{ value: '0100000000' }]
      });

      await jobs.syncBackJob();

      const allPosts = postsDriver.getAllPosts();

      expect(mockCreateQuery).toHaveBeenCalledWith(
        process.env.ORBS_PUBLIC_KEY,
        process.env.REGISTRY_CONTRACT_NAME,
        'areRegistered',
        [allPosts.map(post => post.id).join(',')]
      );
      expect(mockCreateTx).toHaveBeenCalledTimes(allPosts.length - 1);
    });

    it('should mark user in the DB as synced', async () => {
      mockCreateTx.mockReturnValue(['tx']);
      mockSendTx.mockReturnValue({
        executionResult: 'SUCCESS',
        requestStatus: 'COMPLETED'
      });
      mockSendQuery.mockReturnValue({
        outputArguments: [{ value: '0000000000' }]
      });
      await jobs.syncBackJob();
      expect(markAsSyncedCall.isDone()).toBe(true);
    });

    it('should set last synced image id', async () => {
      mockCreateTx.mockReturnValue(['tx']);
      mockSendTx.mockReturnValue({
        executionResult: 'SUCCESS',
        requestStatus: 'COMPLETED'
      });
      mockSendQuery.mockReturnValue({
        outputArguments: [{ value: '0000000000' }]
      });
      await jobs.syncBackJob();
      expect(lastSyncedIdCall.isDone()).toBe(true);
    });

    it.skip('should update amount of synced images', async () => {
      mockCreateTx.mockReturnValue(['tx']);
      mockSendTx.mockReturnValue({
        executionResult: 'SUCCESS',
        requestStatus: 'COMPLETED'
      });
      mockSendQuery.mockReturnValue({
        outputArguments: [{ value: '000000000' }]
      });
      await jobs.syncBackJob();
      expect(updateSyncedImagesCall.isDone()).toBe(true);
    });
  });
});
