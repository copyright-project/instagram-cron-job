require('dotenv').config();
const { Client, argString, decodeHex } = require('orbs-client-sdk');

const ORBS_PUBLIC_KEY = decodeHex(process.env.ORBS_PUBLIC_KEY);
const ORBS_PRIVATE_KEY = decodeHex(process.env.ORBS_PRIVATE_KEY);
const ORBS_NODE_URL = process.env.ORBS_NODE_URL;
const ORBS_VCHAIN_ID = process.env.ORBS_VCHAIN_ID;
const CONTRACT_NAME = process.env.REGISTRY_CONTRACT_NAME;

const orbsClient = new Client(ORBS_NODE_URL, ORBS_VCHAIN_ID, 'TEST_NET');

const registerMedia = async ({
  instagramId,
  imageUrl,
  postedAt,
  hash,
  copyrightAttribution
}) => {
  const [tx] = orbsClient.createTransaction(
    ORBS_PUBLIC_KEY,
    ORBS_PRIVATE_KEY,
    CONTRACT_NAME,
    'registerMedia',
    [
      argString(instagramId),
      argString(
        JSON.stringify({
          imageUrl,
          postedAt,
          hash,
          copyrightAttribution
        })
      )
    ]
  );
  const receipt = await orbsClient.sendTransaction(tx);
  return (
    receipt.executionResult === 'SUCCESS' &&
    receipt.requestStatus === 'COMPLETED'
  );
};

const filterAlreadyRegistered = async media => {
  const ids = media.map(post => post.instagramId);
  const query = orbsClient.createQuery(
    ORBS_PUBLIC_KEY,
    CONTRACT_NAME,
    'areRegistered',
    [argString(ids.join(','))]
  );
  const { outputArguments } = await orbsClient.sendQuery(query);
  const res = outputArguments[0].value; // something like "000101010001000"
  const indicators = res.split('').map(flag => flag === '1');
  return media.filter((_, idx) => !indicators[idx]);
};

module.exports = {
  registerMedia,
  filterAlreadyRegistered
};
