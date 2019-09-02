const axios = require('axios');
const { google } = require('googleapis');
const serviceAccount = require('../DO_NOT_COMMIT_IT_OR_BE_FIRED.json');

// Define the required scopes.
const scopes = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/firebase.database'
];

// Authenticate a JWT client with the service account.
const jwtClient = new google.auth.JWT(
  serviceAccount.client_email,
  null,
  serviceAccount.private_key,
  scopes
);

const auth = () => {
  return new Promise((resolve, reject) => {
    jwtClient.authorize(function(error, tokens) {
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
  getUsers,
  markUserAsSynced,
  setLastSyncMaxId,
  updateRegisteredImagesAmount
};
