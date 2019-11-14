const _ = require('lodash');
const db = require('./db');
const hash = require('./hash');
const Mixpanel = require('mixpanel');
const contract = require('./contract');
const instagram = require('./instagram');
const Sentry = require('@sentry/node');

const mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN);

Sentry.init({
  dsn: 'https://13b6af852aa74adb953730f775edd27e@sentry.io/1537409'
});


const calculateHashAndRegister = async (post, copyrightAttribution) => {
  const res = await hash.calculateHash(post.imageUrl);
  const updatedPost = {
    ...post,
    hash: res,
    copyrightAttribution
  };
  const registeredSuccessfully = await contract.registerMedia(updatedPost);
  if (registeredSuccessfully) {
    mixpanel.track('ImageRegistered');
  }
  return registeredSuccessfully;
};

const syncForwardJob = async () => {
  const users = await db.getRegisteredUsers();

  mixpanel.track('SyncForwardUsers', { amount: Object.keys(users).length });

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
  if (newMedia.length > 0) {
    try {
      mixpanel.track('SyncForwardImages', { amount: newMedia.length });

      for (let i = 0; i < newMedia.length; i++) {
        await calculateHashAndRegister(newMedia[i], copyrightAttribution);
      }
      const maxId = newMedia[0]['instagramId'];
      await db.setLastSyncMaxId(userId, maxId);
      await db.updateRegisteredImagesAmount(userId, newMedia.length);
    } catch (err) {
      console.log(err);
      Sentry.captureException(err);
    }
  }
  return;
};

const syncBackJob = async () => {
  const users = await db.getNewUsers();

  mixpanel.track('SyncBackUsers', { amount: Object.keys(users).length });

  return Promise.allSettled(
    _.map(users, (val, userId) =>
      syncBackUser(userId, val['accessToken'], val['copyrightAttribution'])
    )
  );
};

const syncBackUser = async (userId, accessToken, copyrightAttribution) => {
  try {
    const media = await instagram.getAllUserMedia(accessToken);
    const filteredMedia = await contract.filterAlreadyRegistered(media);

    mixpanel.track('SyncBackImages', { amount: filteredMedia.length });

    for (let i = 0; i < filteredMedia.length; i++) {
      await calculateHashAndRegister(filteredMedia[i], copyrightAttribution);
    }
    await db.markUserAsSynced(userId);
    const maxId = media[0]['instagramId'];
    await db.setLastSyncMaxId(userId, maxId);
    await db.updateRegisteredImagesAmount(userId, filteredMedia.length);
  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
};

module.exports = {
  syncForwardJob,
  syncBackJob,
  syncBackUser,
  syncUserForward
};
