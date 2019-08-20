const _ = require('lodash');
const db = require('./db');
const hash = require('./hash');
const contract = require('./contract');
const instagram = require('./instagram');

const calculateHashAndRegister = async (userId, post) => {
  const res = await hash.calculateHash(post.imageUrl);
  const updatedPost = {
    ...post,
    hash: res
  };
  return contract.registerMedia(userId, updatedPost);
};

const syncForwardJob = async () => {
  const users = await db.getUsers();
  const usersToSync = _.pickBy(users, user => user.isSyncedBack);
  return Promise.all(
    _.map(usersToSync, (val, userId) =>
      syncUserForward(userId, val['accessToken'], val['lastSyncedMaxId'])
    )
  );
};

const syncUserForward = async (userId, accessToken, lastSyncedMaxId) => {
  const newMedia = await instagram.getMediaStartingFrom(
    accessToken,
    lastSyncedMaxId
  );
  if (newMedia.length > 0) {
    await Promise.all(
      newMedia.map(post => calculateHashAndRegister(userId, post))
    );
    const maxId = newMedia[0]['instagramId'];
    await db.setLastSyncMaxId(userId, maxId);
    await db.updateRegisteredImagesAmount(userId, newMedia.length);
  }
  return;
};

const syncBackJob = async () => {
  const users = await db.getUsers();
  const usersToSync = _.pickBy(users, user => !user.isSyncedBack);
  return Promise.all(
    _.map(usersToSync, (val, userId) =>
      syncBackUser(userId, val['accessToken'])
    )
  );
};

const syncBackUser = async (userId, accessToken) => {
  const media = await instagram.getAllUserMedia(accessToken);
  await Promise.all(media.map(post => calculateHashAndRegister(userId, post)));
  await db.markUserAsSynced(userId);
  const maxId = media[0]['instagramId'];
  await db.setLastSyncMaxId(userId, maxId);
  await db.updateRegisteredImagesAmount(userId, media.length);
  return;
};

module.exports = {
  syncForwardJob,
  syncBackJob
};
