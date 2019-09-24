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
  const users = await db.getUsers();
  const usersToSync = _.pickBy(users, user => user.isSyncedBack);
  return Promise.all(
    _.map(usersToSync, (val, userId) =>
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
    await Promise.all(
      newMedia.map(post => calculateHashAndRegister(post, copyrightAttribution))
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
      syncBackUser(userId, val['accessToken'], val['copyrightAttribution'])
    )
  );
};

const syncBackUser = async (userId, accessToken, copyrightAttribution) => {
  try {
    const media = await instagram.getAllUserMedia(accessToken);
    const filteredMedia = await contract.filterAlreadyRegistered(media);
    await Promise.all(
      filteredMedia.map(post =>
        calculateHashAndRegister(post, copyrightAttribution)
      )
    );
    await db.markUserAsSynced(userId);
    const maxId = media[0]['instagramId'];
    await db.setLastSyncMaxId(userId, maxId);
    await db.updateRegisteredImagesAmount(userId, media.length);
    return;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  syncForwardJob,
  syncBackJob
};
