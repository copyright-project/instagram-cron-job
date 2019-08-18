require('dotenv').config();
const { Client, argString, decodeHex } = require('orbs-client-sdk');

const ORBS_PUBLIC_KEY = process.env.ORBS_PUBLIC_KEY;
const ORBS_PRIVATE_KEY = process.env.ORBS_PRIVATE_KEY;
const ORBS_NODE_URL = process.env.ORBS_NODE_URL;
const ORBS_VCHAIN_ID = process.env.ORBS_VCHAIN_ID;
const CONTRACT_NAME = process.env.REGISTRY_CONTRACT_NAME;

const orbsClient = new Client(ORBS_NODE_URL, ORBS_VCHAIN_ID, 'TEST_NET');

const registerMedia = async (userId, { instagramId, imageUrl, postUrl, postedAt }) => {
  const [tx] = orbsClient.createTransaction(
    decodeHex(ORBS_PUBLIC_KEY),
    decodeHex(ORBS_PRIVATE_KEY),
    CONTRACT_NAME,
    'registerMedia',
    [argString(instagramId), argString(JSON.stringify({
      imageUrl,
      postUrl,
      postedAt,
      ownerId: userId
    }))]
  );
  const receipt = await orbsClient.sendTransaction(tx);
  return receipt.executionResult === 'SUCCESS' && receipt.requestStatus === 'COMPLETED';
};

module.exports = {
  registerMedia
}