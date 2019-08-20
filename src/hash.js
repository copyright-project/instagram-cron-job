const axios = require('axios');

const calculateHash = async url => {
  const { data } = await axios.post('https://image-hash.herokuapp.com/hash', {
    url
  });
  return data;
};

module.exports = {
  calculateHash
};
