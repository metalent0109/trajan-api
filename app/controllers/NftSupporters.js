let { NftSupporter, NftSupport } = require("../models"),
  { transaction } = require("objection"),
  { filterer } = require("../lib/filters"),
  { supportUser } = require("../lib/stacks");
module.exports = {
  async getNftSupporters(query = {}, pageNumber = 0, perPage = 20) {
    return {
      ...(await filterer(query, NftSupporter, {
        pageNumber,
        perPage,
        related: query.related,
        orderBy: query.orderBy || "id",
      })),
      page: pageNumber,
      per_page: perPage,
    };
  },

  async getNftSupporter(id, query) {
    if (!id) {
      throw {
        message: "ID Not Provided",
        statusCode: 400,
      };
    }

    let theNftSupporter = await NftSupporter.query()
      .findById(id)
      .eager(query.related);

    if (!theNftSupporter) {
      throw {
        message: "NftSupporter Not Found",
        statusCode: 404,
      };
    }

    return theNftSupporter;
  },

  async createNftSupporter(nftsupporterBody, user) {
    if (!nftsupporterBody.support_id) {
      throw {
        message: "Support id is not provided",
      };
    }
    let support = await NftSupport.query()
      .findById(nftsupporterBody.support_id)
      .withGraphFetched("supportFor");
    console.log(support);
    if (!support) {
      throw {
        message: "No support created for this account",
      };
    }

    let supportTxn = await supportUser({
      account_id: support.supportFor.stx_address,
      price_in_stx: support.price_in_stx,
    });

    const nftSupporter = await transaction(NftSupport, async (NftSupport) => {
      var newNftSupporter = await NftSupporter.query().insert({
        support_id: nftsupporterBody.support_id,
        supported_by: nftsupporterBody.supported_by,
        txn_id: supportTxn,
      });
      return newNftSupporter;
    });

    return nftSupporter;
  },

  async editNftSupporter(id, newBody) {
    if (!id) {
      throw {
        message: "ID Not Provided",
        statusCode: 400,
      };
    }

    if (newBody.id) delete newBody.id
    if (newBody.message) delete newBody.message
    let editedNftSupporter = await NftSupporter.query().patchAndFetchById(id, {
      ...newBody,
    });

    if (!editedNftSupporter) {
      throw {
        message: "NftSupporter Not Found",
        statusCode: 404,
      };
    }

    return editedNftSupporter;
  },

  async deleteNftSupporter(id) {
    if (!id) {
      throw {
        message: "No ID Provided",
        statusCode: 400,
      };
    }

    let deletedCount = await NftSupporter.query().patchAndFetchById(id, {
      is_deleted: true,
    });
    await Promise.all(
      Object.keys(NftSupporter.getRelations()).map((relation) => {
        return deletedCount.$relatedQuery(relation).unrelate();
      })
    );

    if (deletedCount < 1) {
      throw {
        message: "NftSupporter Not Found",
        statusCode: 404,
      };
    }

    return deletedCount;
  },
};
