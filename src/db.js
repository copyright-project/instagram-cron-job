const axios = require('axios');

/**
 * Users object
 * {
 *  [userId: string]: {
 *    accessToken: string,
 *    isSyncedBack: bool,
 *    lastSyncedMaxId: string
 *  }
 * }
 */

const getUsers = async () => {
  const { data } = await axios.get(
    `https://instagram-media-rights.firebaseio.com/users.json`
  );
  return data;
};

const markUserAsSynced = userId => {
  return axios.patch(
    `https://instagram-media-rights.firebaseio.com/users/${userId}.json`,
    {
      isSyncedBack: true
    }
  );
};

const setLastSyncMaxId = (userId, maxId) => {
  return axios.patch(
    `https://instagram-media-rights.firebaseio.com/users/${userId}.json`,
    {
      lastSyncedMaxId: maxId
    }
  );
};

const updateRegisteredImagesAmount = async (userId, increase) => {
  const { data } = await axios.get(
    `https://instagram-media-rights.firebaseio.com/users/${userId}.json`
  );
  const currentAmount = data.registeredImages
    ? parseInt(data.registeredImages, 10)
    : 0;
  await axios.patch(
    `https://instagram-media-rights.firebaseio.com/users/${userId}.json`,
    {
      registeredImages: currentAmount + increase
    }
  );
};

module.exports = {
  getUsers,
  markUserAsSynced,
  setLastSyncMaxId,
  updateRegisteredImagesAmount
};
