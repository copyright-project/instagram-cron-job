require('dotenv').config();
const {
  Client,
  LocalSigner,
  decodeHex,
  argString
} = require('orbs-client-sdk');

const ORBS_NODE_URL = process.env.ORBS_NODE_URL;
const ORBS_VCHAIN_ID = process.env.ORBS_VCHAIN_ID;
const CONTRACT_NAME = process.env.REGISTRY_CONTRACT_NAME;

const client = new Client(
  ORBS_NODE_URL,
  ORBS_VCHAIN_ID,
  'MAIN_NET',
  new LocalSigner({
    publicKey: decodeHex(process.env.ORBS_PUBLIC_KEY),
    privateKey: decodeHex(process.env.ORBS_PRIVATE_KEY)
  })
);

const registerImage = async (pHash, imageURL, postedAt, copyrights, binaryHash) => {
  const [tx] = await client.createTransaction(
    CONTRACT_NAME,
    'registerMedia',
    [
      argString(pHash),
      argString(imageURL),
      argString(postedAt),
      argString(copyrights),
      argString(binaryHash),
    ]);
  const receipt = await client.sendTransaction(tx);
  return (
    receipt.executionResult === 'SUCCESS' &&
    receipt.requestStatus === 'COMPLETED' &&
    receipt.transactionStatus === 'COMMITTED'
  );
};

module.exports = {
  registerImage
};
