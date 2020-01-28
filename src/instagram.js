const axios = require('axios');

function retrieveImagesFromPost(post) {
  if (post.type === 'image') {
    return [post];
  }
  if (post.type === 'carousel') {
    return post['carousel_media']
      .filter(isEligibleMedia)
      .map(media => ({
        ...media,
        id: post['id'],
        'created_time': post['created_time']
      }))
  }
}

function normalizeDTO(imagePayload) {
  return {
    postId: imagePayload.id,
    imageUrl: imagePayload.images['thumbnail'].url,
    postedAt: imagePayload['created_time']
  };
}

function isEligibleMedia(media) {
  return media.type === 'image' || media.type === 'carousel';
}

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

const getAllPosts = async (url, stopCondition) => {
  let media = [];
  for await (const posts of getMediaUntil(url, stopCondition)) {
    media.push(...posts);
  }
  return media.filter(isEligibleMedia);
};

const flatPostsToImages = (posts) => {
  return posts.reduce((acc, post) => {
    const images = retrieveImagesFromPost(post).map(normalizeDTO)
    acc.push(...images);
    return acc;
  }, []);
}

const getAllUserMedia = async accessToken => {
  const url = `https://api.instagram.com/v1/users/self/media/recent/?access_token=${accessToken}`;
  const stopCondition = ({ pagination }) => pagination.next_url === undefined;
  const posts = await getAllPosts(url, stopCondition);
  return flatPostsToImages(posts);

};

const getMediaStartingFrom = async (accessToken, lastMaxId) => {
  const url = `https://api.instagram.com/v1/users/self/media/recent/?access_token=${accessToken}&min_id=${lastMaxId}`;
  const stopCondition = ({ pagination }) => !pagination.next_max_id || pagination.next_max_id < lastMaxId;
  const posts = await getAllPosts(url, stopCondition);
  const freshPosts = posts.filter(post => post.id > lastMaxId);
  return flatPostsToImages(freshPosts)
};

module.exports = {
  getAllUserMedia,
  getMediaStartingFrom
};
