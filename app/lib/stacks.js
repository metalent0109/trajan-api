const {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  FungibleConditionCode,
  makeStandardSTXPostCondition,
  bufferCVFromString,
  stringAsciiCV,
  standardPrincipalCV,
  intCV,
  uintCV,
  makeStandardNonFungiblePostCondition,
  NonFungibleConditionCode,
  createAssetInfo,
  falseCV,
  getAddressFromPublicKey,
  TransactionVersion,
  deserializeTransaction,
} = require("@stacks/transactions");
const { verifyMessageSignatureRsv } = require("@stacks/encryption");
const { StacksTestnet, StacksMainnet } = require("@stacks/network");
const axios = require("axios");

let network;
if (process.env.STACKS_NETWORK === "mainnet") {
  network = new StacksMainnet();
} else {
  network = new StacksTestnet();
}

const getProperNonce = async function (nonce) {
  let nonceResponse = await axios.get(
    `https://stacks-node-api.${process.env.STACKS_NETWORK}.stacks.co/extended/v1/address/${process.env.SPONSOR_STX_ADDRESS}/nonces`
  );
  if (!nonce && nonceResponse.data.detected_missing_nonces.length) {
    return nonceResponse.data.detected_missing_nonces[
      nonceResponse.data.detected_missing_nonces.length - 1
    ];
  } else if (!nonce) {
    return nonceResponse.data.possible_next_nonce;
  }
};

const invokeContractCall = async function ({
  functionName,
  contractAddress,
  contractName,
  functionArgs,
  postConditions,
  controllerName,
  nonce,
  body,
}) {
  const txOptions = {
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    senderKey: process.env.OWNER_PRIVATE_KEY,
    network,
    postConditions,
    anchorMode: AnchorMode.Any,
    fee: 1000n,
    nonce,
  };

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction(transaction, network);
  console.log(broadcastResponse, "broadcastResponse");
  if (broadcastResponse.error && broadcastResponse.reason_data) {
    nonce = broadcastResponse.reason_data.expected;
    return await module.exports[controllerName](body, nonce);
  } else if (broadcastResponse.error) {
    throw {
      message: broadcastResponse.error,
    };
  } else {
    return broadcastResponse.txid;
  }
};
module.exports = {
  insertClaim: async function (body, nonce) {
    nonce = await getProperNonce(nonce);
    return invokeContractCall({
      functionName: "add-claim-hash",
      contractAddress: process.env.MEDAL_CONTRACT_ADDRESS,
      contractName: process.env.MEDAL_CONTRACT_NAME,
      functionArgs: [
        stringAsciiCV(body.hash),
        standardPrincipalCV(body.account_id),
      ],
      postConditions: [],
      controllerName: "insertClaim",
      nonce,
      body,
    });
  },
  setMintStatus: async function (body) {
    const postConditions = [];
    nonce = await getProperNonce(nonce);
    return invokeContractCall({
      functionName: "set-minting-state",
      contractAddress: process.env.MEDAL_CONTRACT_ADDRESS,
      contractName: process.env.MEDAL_CONTRACT_NAME,
      functionArgs: [stringAsciiCV(body.hash)],
      postConditions: [],
      controllerName: "setMintStatus",
      nonce,
      body,
    });
  },
  verifyToken: function (data, message) {
    console.log('DATA-message', message)
    try {
      let [account_id, publicKey, signature] = data.split(":");
      console.log('account_idaccount_id', data)
      // Message is valid (but could be faked to be any public key)
      const isMessageSignatureValid = verifyMessageSignatureRsv({
        message, // ! NEEDS TO BE THE SAME MESSAGE AS IN sign()
        publicKey,
        signature
      });

      // So we also verify that the public key is the owner of the address
      const isPublicKeyAddressOwner =
      account_id ===
        getAddressFromPublicKey(publicKey, TransactionVersion.Testnet);

      // Now we know if the owner (address) wants to perform the action (i.e. signed the message)
      // We can know e.g. update a database entry (of account `address`) for the owner
      return isMessageSignatureValid && isPublicKeyAddressOwner;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  getTxnStatus: async function (txnIds) {
    try {
      let query = `?tx_id=`;
      txnIds.forEach((each, i) => {
        if (i === 0) {
          query += `${each}`;
        } else {
          query += `&tx_id=${each}`;
        }
      });
      let txns = await axios.get(
        `https://stacks-node-api.testnet.stacks.co/extended/v1/tx/multiple${query}`
      );
      return txns.data;
    } catch (e) {
      console.log(e);
    }
  },
  createSupport: async function (body, nonce) {
    nonce = await getProperNonce(nonce);
    return invokeContractCall({
      functionName: "create-support",
      contractAddress: process.env.MEDAL_CONTRACT_ADDRESS,
      contractName: process.env.SUPPORT_CONTRACT_NAME,
      functionArgs: [
        standardPrincipalCV(body.account_id),
        stringAsciiCV(body.hash),
        intCV(body.limit),
        uintCV(body.price * 10000), // convert to microstacks
      ],
      postConditions: [],
      controllerName: "createSupport",
      nonce,
      body,
    });
  },
  editSupport: async function (body, nonce) {
    nonce = await getProperNonce(nonce);
    return invokeContractCall({
      functionName: "edit-support",
      contractAddress: process.env.MEDAL_CONTRACT_ADDRESS,
      contractName: process.env.SUPPORT_CONTRACT_NAME,
      functionArgs: [
        stringAsciiCV(body["old-hash"]),
        stringAsciiCV(body["new-hash"]),
      ],
      postConditions: [],
      controllerName: "editSupport",
      nonce,
      body,
    });
  },
  endSupport: async function (body, nonce) {
    nonce = await getProperNonce(nonce);
    return invokeContractCall({
      functionName: "set-minting-state-per-account",
      contractAddress: process.env.MEDAL_CONTRACT_ADDRESS,
      contractName: process.env.SUPPORT_CONTRACT_NAME,
      functionArgs: [standardPrincipalCV(body.account_id), falseCV()],
      postConditions: [],
      controllerName: "endSupport",
      nonce,
      body,
    });
  },
  supportUser: async function (body, nonce) {
    nonce = await getProperNonce(nonce);
    const nftPostConditionCode = NonFungibleConditionCode.Owns;
    const nonFungibleAssetInfo = createAssetInfo(
      process.env.SUPPORT_CONTRACT_ADDRESS,
      process.env.SUPPORT_CONTRACT_NAME,
      process.env.SUPPORT_ASSET_NAME
    );

    const stxConditionCode = FungibleConditionCode.LessEqual;
    const stxConditionAmount = parseInt(body.price_in_stx) * 10000; // we store price as unsigned (10 stx as 1000), then convert into micro stacks

    const postConditions = [
      makeStandardNonFungiblePostCondition(
        body.account_id,
        nftPostConditionCode,
        nonFungibleAssetInfo,
        bufferCVFromString(process.env.SUPPORT_ASSET_NAME)
      ),
      makeStandardSTXPostCondition(
        body.account_id,
        stxConditionCode,
        stxConditionAmount
      ),
    ];
    return invokeContractCall({
      functionName: "support",
      contractAddress: process.env.SUPPORT_CONTRACT_ADDRESS,
      contractName: process.env.SUPPORT_CONTRACT_NAME,
      functionArgs: [standardPrincipalCV(body.account_id)],
      postConditions,
      controllerName: "supportUser",
      nonce,
      body,
    });
  },
};
