const _ = require('lodash');
const db = require('./db');
const hash = require('./hash');
const Mixpanel = require('mixpanel');
const contract = require('./contract');
const instagram = require('./instagram');

const mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN);

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

    mixpanel.track('SyncForwardImages', newMedia.length);

    for (let i = 0; i < newMedia.length; i++) {
      await calculateHashAndRegister(newMedia[i], copyrightAttribution);
    }
    const maxId = newMedia[0]['instagramId'];
    await db.setLastSyncMaxId(userId, maxId);
    await db.updateRegisteredImagesAmount(userId, newMedia.length);
  }
  return;
};

const syncBackJob = async () => {
  const users = await db.getNewUsers();
  return Promise.all(
    _.map(users, (val, userId) =>
      syncBackUser(userId, val['accessToken'], val['copyrightAttribution'])
    )
  );
};

const syncBackUser = async (userId, accessToken, copyrightAttribution) => {
  try {
    const media = await instagram.getAllUserMedia(accessToken);
    const filteredMedia = await contract.filterAlreadyRegistered(media);

    mixpanel.track('SyncBackImages', filteredMedia.length);

    for (let i = 0; i < filteredMedia.length; i++) {
      await calculateHashAndRegister(filteredMedia[i], copyrightAttribution);
    }
    await db.markUserAsSynced(userId);
    const maxId = media[0]['instagramId'];
    await db.setLastSyncMaxId(userId, maxId);
    await db.updateRegisteredImagesAmount(userId, filteredMedia.length);
    return;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  syncForwardJob,
  syncBackJob,
  syncBackUser,
  syncUserForward
};
