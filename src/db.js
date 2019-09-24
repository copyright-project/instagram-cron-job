const axios = require('axios');
const { google } = require('googleapis');

const scopes = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/firebase.database'
];

let serviceAccount = {};

try {
  serviceAccount = require('../DO_NOT_COMMIT_IT_OR_BE_FIRED.json');
  // eslint-disable-next-line no-empty
} catch (err) { }

const jwtClient = new google.auth.JWT(
  serviceAccount.client_email,
  null,
  serviceAccount.private_key,
  scopes
);

const auth = () => {
  return new Promise((resolve, reject) => {
    jwtClient.authorize((error, tokens) => {
      if (error) {
        console.log('Error making request to generate access token:', error);
        reject(error);
      } else if (tokens.access_token === null) {
        console.log(
          'Provided service account does not have permission to generate access tokens'
        );
        reject();
      } else {
        resolve(tokens.access_token);
      }
    });
  });
};

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
  const accessToken = await auth();
  const { data } = await axios.get(
    `https://instagram-media-rights.firebaseio.com/users.json?access_token=${accessToken}`
  );
  return data;
};

const getUser = async userId => {
  const accessToken = await auth();
  const { data } = await axios.get(
    `https://instagram-media-rights.firebaseio.com/users/${userId}.json?access_token=${accessToken}`
  );
  return data;
}

const markUserAsSynced = async userId => {
  const accessToken = await auth();
  return axios.patch(
    `https://instagram-media-rights.firebaseio.com/users/${userId}.json?access_token=${accessToken}`,
    {
      isSyncedBack: true
    }
  );
};

const setLastSyncMaxId = async (userId, maxId) => {
  const accessToken = await auth();
  return axios.patch(
    `https://instagram-media-rights.firebaseio.com/users/${userId}.json?access_token=${accessToken}`,
    {
      lastSyncedMaxId: maxId
    }
  );
};

const updateRegisteredImagesAmount = async (userId, increase) => {
  const accessToken = await auth();
  const { data } = await axios.get(
    `https://instagram-media-rights.firebaseio.com/users/${userId}.json?access_token=${accessToken}`
  );
  const currentAmount = data.registeredImages
    ? parseInt(data.registeredImages, 10)
    : 0;
  await axios.patch(
    `https://instagram-media-rights.firebaseio.com/users/${userId}.json?access_token=${accessToken}`,
    {
      registeredImages: currentAmount + increase
    }
  );
};

module.exports = {
  getUser,
  getUsers,
  markUserAsSynced,
  setLastSyncMaxId,
  updateRegisteredImagesAmount
};
