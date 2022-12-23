let { Claim, Medal, Users } = require("../models"),
  { transaction } = require("objection"),
  { filterer } = require("../lib/filters");
const { StacksTestnet, StacksMainnet } = require("@stacks/network");
const {
  makeContractCall,
  AnchorMode,
  callReadOnlyFunction,
  sponsorTransaction,
  broadcastTransaction,
  deserializeTransaction,
  BufferReader,
  standardPrincipalCV,
  intCV,
  stringAsciiCV,
} = require("@stacks/transactions");
const axios = require("axios");
const network = new StacksTestnet();
const pinataSDK = require("@pinata/sdk");
const pinata = pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_API_SECRET
);

module.exports = {
  createSupport: async function (body, user, nonce) {
    if (!body.price) {
      throw {
        message: "Price not provided",
      };
    }
    let theUser = await Users.query().findOne({
      is_deleted: false,
      stx_address: user.account_id,
    });
    if (!theUser) {
      throw {
        message: "User not found",
      };
    }

    let supportInfo = {
      title: "Trajan Support",
      description: "This is to support trajan user",
      image:
        "https://www.ibm.com/support/pages/system/files/inline-images/Content-157859739.jpg",
      price: body.price,
    };
    const options = {
      pinataMetadata: {
        name: "Support info",
        keyvalues: [],
      },
      pinataOptions: {
        cidVersion: 0,
      },
    };
    let pinataResponse = await pinata
      .pinJSONToIPFS(supportInfo, options)
      .catch((e) => {
        console.log(e, "ERROR");
      });
    const postConditions = [];
    let nonceResponse = await axios.get(
      `https://stacks-node-api.testnet.stacks.co/extended/v1/address/${process.env.SPONSOR_STX_ADDRESS}/nonces`
    );
    if (!nonce && nonceResponse.data.detected_missing_nonces?.length) {
      console.log("HERE1");
      nonce =
        nonceResponse.data.detected_missing_nonces[
          nonceResponse.data.detected_missing_nonces.length - 1
        ];
    } else if (!nonce) {
      console.log("HERE2");
      nonce = nonceResponse.data.possible_next_nonce;
    }
    const txOptions = {
      contractAddress: process.env.SUPPORT_CONTRACT_ADDRESS,
      contractName: process.env.SUPPORT_CONTRACT_NAME,
      functionName: "create-support",
      functionArgs: [
        standardPrincipalCV(user.account_id),
        stringAsciiCV(pinataResponse.IpfsHash),
        intCV(body.limit),
      ],
      senderKey: process.env.OWNER_PRIVATE_KEY,
      network,
      postConditions,
      anchorMode: AnchorMode.Any,
      fee: 100000n,
      nonce,
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, network);
    console.log(broadcastResponse);
    if (broadcastResponse.error && broadcastResponse.reason_data) {
      nonce = broadcastResponse.reason_data.expected;
      return await module.exports.createSupport(body, user, nonce);
    } else if (broadcastResponse.error) {
      throw {
        message: broadcastResponse.error,
      };
    } else {
      return broadcastResponse.txid;
    }
  },
};
