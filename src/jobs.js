const _ = require('lodash');
const db = require('./db');
const contract = require('./contract');
const instagram = require('./instagram');

const syncForwardJob = async () => {
  const users = await db.getUsers();
  const usersToSync = _.pickBy(users, user => user.isSyncedBack);
  _.forOwn(usersToSync, (val, userId) => syncUserForward(
    userId,
    val['accessToken'],
    val['lastSyncedMaxId']
  ));
};

const syncUserForward = async (userId, accessToken, lastSyncedMaxId) => {
  const newMedia = await instagram.getMediaStartingFrom(accessToken, lastSyncedMaxId);
  if (newMedia.length > 0) {
    await Promise.all(newMedia.map(post => contract.registerMedia(userId, post)));
    const maxId = newMedia[0]['instagramId'];
    await db.setLastSyncMaxId(userId, maxId);
    await db.updateRegisteredImagesAmount(userId, newMedia.length)
  }
};

const syncBackJob = async () => {
  const users = await db.getUsers();
  const usersToSync = _.pickBy(users, user => !user.isSyncedBack);
  _.forOwn(usersToSync, (val, userId) => syncBackUser(userId, val['accessToken']));
};

const syncBackUser = async (userId, accessToken) => {
  const media = await instagram.getAllUserMedia(accessToken);
  await Promise.all(media.map(post => contract.registerMedia(userId, post)));
  await db.markUserAsSynced(userId);
  const maxId = media[0]['instagramId'];
  await db.setLastSyncMaxId(userId, maxId);
  await db.updateRegisteredImagesAmount(userId, media.length)
}

module.exports = {
  syncForwardJob,
  syncBackJob
}