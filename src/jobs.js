const _ = require('lodash');
const db = require('./db');
const hash = require('./hash');
const contract = require('./contract');
const instagram = require('./instagram');
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: 'https://13b6af852aa74adb953730f775edd27e@sentry.io/1537409'
});

const calculateHashAndRegister = async ({ imageUrl, postedAt }, copyrightAttribution) => {
  const { pHash, binaryHash } = await hash.calculateHash(imageUrl);
  const registeredSuccessfully = await contract.registerImage(
    pHash,
    imageUrl,
    postedAt,
    copyrightAttribution,
    binaryHash
  );

  return registeredSuccessfully;
};

const syncForwardJob = async () => {
  const users = await db.getRegisteredUsers();

  return Promise.all(
    _.map(users, (val, userId) =>
      syncUserForward(
        userId,
        val['accessToken'],
        val['lastSyncedMaxId'],
        val['copyrightAttribution']
      )
    )
  );
};

const syncUserForward = async (
  userId,
  accessToken,
  lastSyncedMaxId,
  copyrightAttribution
) => {
  const newMedia = await instagram.getMediaStartingFrom(
    accessToken,
    lastSyncedMaxId
  );
  if (newMedia.length === 0) {
    return;
  }
  try {
    const results = Promise.all(newMedia.map(post => calculateHashAndRegister(post, copyrightAttribution)));
    const maxId = newMedia[0]['postId'];
    await db.setLastSyncMaxId(userId, maxId);
    await db.updateRegisteredImagesAmount(userId, results.filter(i => i).length);
  } catch (err) {
    console.log(err);
    if (err.data) {
      Sentry.captureMessage(JSON.stringify(err.data));
    } else {
      Sentry.captureException(err);
    }
  }
};

const syncBackJob = async () => {
  const users = await db.getNewUsers();

  return Promise.allSettled(
    _.map(users, (val, userId) =>
      syncBackUser(userId, val['accessToken'], val['copyrightAttribution'])
    )
  );
};

const syncBackUser = async (userId, accessToken, copyrightAttribution) => {
  try {
    const media = await instagram.getAllUserMedia(accessToken);
    const results = Promise.all(media.map(post => calculateHashAndRegister(post, copyrightAttribution)));
    await db.markUserAsSynced(userId);
    const maxId = media[0]['postId'];
    await db.setLastSyncMaxId(userId, maxId);
    await db.updateRegisteredImagesAmount(userId, results.filter(i => i).length);
  } catch (err) {
    console.log(err);
    if (err.data) {
      Sentry.captureMessage(JSON.stringify(err.data));
    } else {
      Sentry.captureException(err);
    }
  }
};

module.exports = {
  syncForwardJob,
  syncBackJob,
  syncBackUser,
  syncUserForward
};
