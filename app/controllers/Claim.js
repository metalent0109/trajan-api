let { Claim, Medal, Categories, MedalLevels } = require("../models"),
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
} = require("@stacks/transactions");
const axios = require("axios");
const network = new StacksTestnet();
const pinataSDK = require("@pinata/sdk");
const pinata = pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_API_SECRET
);

module.exports = {
  async getClaims(query, pageNumber = 0, perPage = 20) {
    return {
      ...(await filterer(query, Claim, {
        pageNumber,
        perPage,
        related: query.related,
        search: query.search,
        orderBy: query.orderBy || "id",
      })),
      page: pageNumber,
      per_page: perPage,
    };
  },
  claimMedal: async function (body, userNonce) {
    if (!body.hash) {
      throw {
        message: "Claim hash should be provided",
      };
    }
    let medal = await Medal.query()
      .findOne({
        claim_hash: body.hash,
        is_deleted: false,
        is_claimed: false,
        is_declined: false,
      })
      .withGraphFetched("[recepient]");
    if (!medal) {
      throw {
        message: "Medal not found",
      };
    }
    const txOptions = {
      contractAddress: process.env.MEDAL_CONTRACT_ADDRESS,
      contractName: process.env.MEDAL_CONTRACT_NAME,
      functionName: "get-last-token-id",
      functionArgs: [],
      network,
      senderAddress: medal.recipient_wallet_id,
    };

    const txn = await callReadOnlyFunction(txOptions);
    let metaId = Number(txn.value.value);
    console.log(metaId);
    const bufferReader = new BufferReader(Buffer.from(body.txn, "hex"));
    const deserializedTx = deserializeTransaction(bufferReader);
    console.log(deserializedTx.auth.spendingCondition.signature);
    console.log(deserializedTx.auth.sponsorSpendingCondition.signature);
    const fee = 100000n;
    let userNonceResponse = await axios.get(
      `https://stacks-node-api.testnet.stacks.co/extended/v1/address/${process.env.SPONSOR_STX_ADDRESS}/nonces`
    );

    if (!userNonce && userNonceResponse.data.detected_missing_nonces.length) {
      userNonce =
        userNonceResponse.data.detected_missing_nonces[
        userNonceResponse.data.detected_missing_nonces.length - 1
        ];
    } else if (!userNonce) {
      userNonce = userNonceResponse.data.possible_next_nonce;
    }
    const sponsorOptions = {
      transaction: deserializedTx,
      sponsorPrivateKey: process.env.OWNER_PRIVATE_KEY,
      fee,
      sponsorNonce: userNonce,
    };

    const sponsoredTx = await sponsorTransaction(sponsorOptions);

    const broadcastResponse = await broadcastTransaction(sponsoredTx, network);
    if (broadcastResponse.error && broadcastResponse.reason_data) {
      if (
        broadcastResponse.reason_data.principal !==
        process.env.SPONSOR_STX_ADDRESS
      ) {
        throw {
          message: `Bad Nonce. Expected Nonce : ${broadcastResponse.reason_data.expected}`,
        };
      }
      userNonce = broadcastResponse.reason_data.expected;
      return await module.exports.claimMedal(body, userNonce);
    } else if (broadcastResponse.error) {
      throw {
        message: broadcastResponse.error,
      };
    } else {
      const txId = broadcastResponse.txid;
      let metadata = {
        token_id: metaId,
        title: medal.title,
        image: `https://cdn.discordapp.com/attachments/955536179590213652/981197757371002920/coin.gif`,
        txn_id: txId,
        note: body.note,
        medal_id: medal.id,
        user_id: medal.recepient.id,
        category_id: medal.category_id,
      };
      let updates = await transaction(
        Medal,
        Claim,
        MedalLevels,
        async function (Medal, Claim, MedalLevels) {
          await Medal.query().patchAndFetchById(medal.id, {
            is_claimed: true,
          });
          let copperMedal = await MedalLevels.query().findOne({ slug: 'copper' })
          await Claim.query().insert({ ...metadata, medal_level: copperMedal?.id });
          console.log(broadcastResponse, "txnId");
          return { txn_id: broadcastResponse.txid };
        }
      );
      return updates;
    }
  },
  async mergeMedals(mergeBody, userPermissions = {}) {
    const mergeMedal = await transaction(
      Claim,
      Categories,
      MedalLevels,
      async (Claim, Categories, MedalLevels) => {
        let category = await Categories.query().findOne({ title: mergeBody.category })
        if (!category) {
          throw {
            message: "Category not found",
            statusCode: 400,
          }
        }

        let medalLevel = await MedalLevels.query().findOne({ slug: mergeBody.medal_level })
        if (!medalLevel) {
          throw {
            message: "Medal level not found",
            statusCode: 400,
          }
        }

        let silverMedal = await MedalLevels.query().findOne({ slug: "silver" })
        let goldMedal = await MedalLevels.query().findOne({ slug: "gold" })

        let deletedMedals
        let medals = await Claim.query()
          .where("category_id", category.id)
          .where("medal_level", medalLevel.id)
          .where("user_id", mergeBody.user_id)
          .where("is_deleted", false)
        let newMedal
        switch (mergeBody.medal_level) {
          case "copper":
            if (medals.length < 10) {
              throw {
                message: "10 Copper medals are needed to 1 silver",
                statusCode: 400,
              }
            }
            let tenCopperMedal = medals.slice(0, 10);
            deletedMedals = await Promise.all(
              tenCopperMedal.map(async (medal) => await Claim.query().patchAndFetchById(medal.id, { is_deleted: true }))
            )
            // newMedal = await Claim.query().insert({
            //   title: "silver medal",
            //   image: "",
            //   token_id: "",
            //   txn_id: "",
            //   medal_id: null,
            //   user_id: mergeBody.user_id,
            //   category_id: category.id,
            //   medal_level: silverMedal.id,
            // })
            // return newMedal;
            break;
          case "silver":
            if (medals.length < 5) {
              throw {
                message: "5 silver medals are needed to 1 gold",
                statusCode: 400,
              }
            }
            let fiveMedal = medals.slice(0, 5);
            deletedMedals = await Promise.all(
              fiveMedal.map(async (medal) => await Claim.query().patchAndFetchById(medal.id, { is_deleted: true }))
            )
            // newMedal = await Claim.query().insert({
            //   title: "gold medal",
            //   image: "",
            //   token_id: "",
            //   txn_id: "",
            //   medal_id: null,
            //   user_id: mergeBody.user_id,
            //   category_id: category.id,
            //   medal_level: goldMedal.id,
            // })
            // return newMedal;
            break;
          default: return;
        }
        return newMedal
      }
    )
    return mergeMedal
  },
};
