let { Medal, Categories, Notifications, Users } = require("../models"),
  { transaction } = require("objection"),
  { filterer } = require("../lib/filters");
const pinataSDK = require("@pinata/sdk");
const md5 = require("md5");
const { insertClaim } = require("../lib/stacks");
const pinata = pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_API_SECRET
);
module.exports = {
  async getMedals(query = {}, pageNumber = 0, perPage = 20) {
    return {
      ...(await filterer(query, Medal, {
        pageNumber,
        perPage,
        related: query.related,
        orderBy: query.orderBy || "id",
      })),
      page: pageNumber,
      per_page: perPage,
    };
  },

  async getMedal(id, query) {
    if (!id) {
      throw {
        message: "ID Not Provided",
        statusCode: 400,
      };
    }
//origin code
//error message : "Medal.query(...).findById(...).eager is not a function"
//    let theMedal = await Medal.query().findById(id).eager(query.related)

    //new code    
    let theMedal = await Medal.query().findById(id).withGraphFetched(query.related)

    if (!theMedal) {
      throw {
        message: "Medal Not Found",
        statusCode: 404,
      };
    }

    return theMedal;
  },

  createMedal: async function (body, user) {
    if (!body.category_id) {
      throw {
        message: "Category should be provided",
      };
    }
    if (!body.recipient_wallet_id) {
      throw {
        message: "Recepient wallet id should be provided",
      };
    }
    let category;
    if (typeof body.category_id === "number") {
      category = await Categories.query().findById(parseInt(body.category_id));
      if (!category) {
        throw {
          message: "Category not found",
        };
      }
    } else {
      category = await Categories.query().findOne({
        title: body.category_id,
      });
      if (!category)
        category = await Categories.query().insert({
          title: body.category_id,
          is_global: false,
          user_created: true,
        });
      body.category_id = category.id;
    }
    let medalInfo = {
      title: "Trajan Medal",
      description: body.description,
      sender: user.account_id, // should be taken from token
      receiver: body.recipient_wallet_id,
      category: category.title,
      level: "copper", // should be dynamic
      is_verified: true, // update this logic as well
      image:
        "https://cdn.discordapp.com/attachments/955536179590213652/981197757371002920/coin.gif",
    };
    const options = {
      pinataMetadata: {
        name: "metaname",
        keyvalues: [],
      },
      pinataOptions: {
        cidVersion: 0,
      },
    };
    let pinataResponse = await pinata
      .pinJSONToIPFS(medalInfo, options)
      .catch((e) => {
        console.log(e, "ERROR");
      });
    console.log(pinataResponse);
    body.meta_hash = pinataResponse?.IpfsHash;
    // contract call

    let txn_id = await insertClaim({
      hash: pinataResponse?.IpfsHash,
      account_id: body.recipient_wallet_id,
    });
    body.txn_id = "0x" + txn_id;
    body.claim_hash = md5(new Date().getTime());
    body.user_id = user.id;
    let medal = await Medal.query().insert(body);
    let recipientDetail = await Users.query()
      .findOne({ stx_address: body.recipient_wallet_id })
      .withGraphFetched("profile");

    await Notifications.query().insert({
      title: "sent you a medal",
      type: "medal",
      reference_id: medal?.id,
      sender: user?.id,
      recipient: recipientDetail?.id,
    });
    return medal;
  },

  async editMedal(id, newBody) {
    if (!id) {
      throw {
        message: "ID Not Provided",
        statusCode: 400,
      };
    }
    if (newBody.id) {
      delete newBody.id;
    }
    let editedMedal = await Medal.query().patchAndFetchById(id, { ...newBody });

    if (!editedMedal) {
      throw {
        message: "Medal Not Found",
        statusCode: 404,
      };
    }

    return editedMedal;
  },

  async deleteMedal(id) {
    if (!id) {
      throw {
        message: "No ID Provided",
        statusCode: 400,
      };
    }

    let deletedCount = await Medal.query().patchAndFetchById(id, {
      is_deleted: true,
    });
    await Promise.all(
      Object.keys(Medal.getRelations()).map((relation) => {
        return deletedCount.$relatedQuery(relation).unrelate();
      })
    );

    if (deletedCount < 1) {
      throw {
        message: "Medal Not Found",
        statusCode: 404,
      };
    }

    return deletedCount;
  },
};
