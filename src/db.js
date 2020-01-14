const axios = require('axios');
const { google } = require('googleapis');

const scopes = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/firebase.database'
];

const DB_BASE_URL = 'https://open-rights.firebaseio.com';

let serviceAccount = {};

try {
  serviceAccount = require('../open-rights-firebase-adminsdk.json');
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

const getUser = async userId => {
  const accessToken = await auth();
  const { data } = await axios.get(
    `${DB_BASE_URL}/users/${userId}.json?access_token=${accessToken}`
  );
  return data;
};

const getNewUsers = async () => {
  const accessToken = await auth();
  const { data } = await axios.get(
    `${DB_BASE_URL}/users.json?access_token=${accessToken}&orderBy="isSyncedBack"&equalTo=null`
  );
  return data;
};

const getRegisteredUsers = async () => {
  const accessToken = await auth();
  const { data } = await axios.get(
    `${DB_BASE_URL}/users.json?access_token=${accessToken}&orderBy="isSyncedBack"&equalTo=true`
  );
  return data;
};

const markUserAsSynced = async userId => {
  const accessToken = await auth();
  return axios.patch(
    `${DB_BASE_URL}/users/${userId}.json?access_token=${accessToken}`,
    {
      isSyncedBack: true
    }
  );
};

const setLastSyncMaxId = async (userId, maxId) => {
  const accessToken = await auth();
  return axios.patch(
    `${DB_BASE_URL}/users/${userId}.json?access_token=${accessToken}`,
    {
      lastSyncedMaxId: maxId
    }
  );
};

const updateRegisteredImagesAmount = async (userId, increase) => {
  const accessToken = await auth();
  const key = 'registeredImagesCount';
  const { data } = await axios.get(
    `${DB_BASE_URL}/users/${userId}.json?access_token=${accessToken}`
  );
  const currentAmount = data[key]
    ? parseInt(data[key], 10)
    : 0;
  await axios.patch(
    `${DB_BASE_URL}/users/${userId}.json?access_token=${accessToken}`,
    {
      [key]: currentAmount + increase
    }
  );
};

module.exports = {
  getUser,
  getNewUsers,
  getRegisteredUsers,
  markUserAsSynced,
  setLastSyncMaxId,
  updateRegisteredImagesAmount
};
