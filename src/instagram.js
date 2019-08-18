const axios = require('axios');

const postToDAO = (post) => {
  return {
    instagramId: post.id,
    imageUrl: post.images.standard_resolution.url,
    postUrl: post.link,
    postedAt: post.created_time
  };
};

const getMediaCount = async (accessToken) => {
  const { data } = await axios.get(`https://api.instagram.com/v1/users/self/?access_token=${accessToken}`);
  return data.data.counts.media;
};

/**
 * Returns Media[]
 * Media: {
 *  instagramId: string
 *  imageUrl: string
 *  postUrl: string
 *  postedAt: string
 * }
 */
const getAllUserMedia = async (accessToken) => {
  const count = await getMediaCount(accessToken);
  const { data } = await axios.get(`https://api.instagram.com/v1/users/self/media/recent/`, {
    params: {
      access_token: accessToken,
      count
    }
  });
  return data.data.map(postToDAO);
};

async function* getMediaUntil(initUrl, stopCondition) {
  let isDone = false;
  let url = initUrl;

  while (!isDone) {
    const { data } = await axios.get(url)
    yield data.data;
    if (stopCondition(data)) {
      isDone = true;
    } else {
      url = data.pagination.next_url;
    }
  }
}

const getMediaStartingFrom = async (accessToken, lastMaxId) => {
  const initUrl = `https://api.instagram.com/v1/users/self/media/recent/?access_token=${accessToken}&min_id=${lastMaxId}`;
  const stopCondition = ({ pagination }) => {
    return !pagination.next_max_id || pagination.next_max_id < lastMaxId
  };
  let media = [];

  for await (const posts of getMediaUntil(initUrl, stopCondition)) {
    media.push(...posts);
  }

  const freshPosts = media.filter(post => post.id > lastMaxId);
  return freshPosts.map(postToDAO);
};

module.exports = {
  getAllUserMedia,
  getMediaStartingFrom
}