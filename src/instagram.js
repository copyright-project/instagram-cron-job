const axios = require('axios');
const Sentry = require('@sentry/node');

const postToDAO = post => {
  return {
    instagramId: post.id,
    imageUrl: post.images.standard_resolution.url,
    postedAt: post.created_time
  };
};

const getMediaCount = async accessToken => {
  const { data } = await axios.get(
    `https://api.instagram.com/v1/users/self/?access_token=${accessToken}`
  );
  return data.data.counts.media;
};

async function* getMediaUntil(initUrl, stopCondition) {
  let isDone = false;
  let url = initUrl;

  while (!isDone) {
    const { data } = await axios.get(url);
    yield data.data;
    if (stopCondition(data)) {
      isDone = true;
    } else {
      url = data.pagination.next_url;
    }
  }
}

const getAllUserMedia = async accessToken => {
  let media = [];
  const count = await getMediaCount(accessToken);
  const url = `https://api.instagram.com/v1/users/self/media/recent/?access_token=${accessToken}&count=${count}`;

  const stopCondition = ({ pagination }) => pagination.next_url === undefined;

  try {
    for await (const posts of getMediaUntil(url, stopCondition)) {
      media.push(...posts);
    }
  } catch ({ data }) {
    const { meta } = data;
    if (meta.error_message) {
      Sentry.captureMessage(meta.error_message);
    } else {
      Sentry.captureException(meta);
    }
  }

  return media.map(postToDAO);
};

const getMediaStartingFrom = async (accessToken, lastMaxId) => {
  let media = [];
  const url = `https://api.instagram.com/v1/users/self/media/recent/?access_token=${accessToken}&min_id=${lastMaxId}`;

  const stopCondition = ({ pagination }) => !pagination.next_max_id || pagination.next_max_id < lastMaxId;

  try {
    for await (const posts of getMediaUntil(url, stopCondition)) {
      media.push(...posts);
    }
  } catch ({ data }) {
    const { meta } = data;
    if (meta.error_message) {
      Sentry.captureMessage(meta.error_message);
    } else {
      Sentry.captureException(meta);
    }
  }

  const freshPosts = media.filter(post => post.id > lastMaxId);
  return freshPosts.map(postToDAO);
};

module.exports = {
  getAllUserMedia,
  getMediaStartingFrom
};
