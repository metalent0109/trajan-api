let { Claim } = require("../models"),
  { transaction } = require("objection"),
  { filterer } = require("../lib/filters");
module.exports = {
  async getClaims(query = {}, pageNumber = 0, perPage = 20) {
    return {
      ...(await filterer(query, Claim, {
        pageNumber,
        perPage,
        related: query.related,
        orderBy: query.orderBy || "id",
      })),
      page: pageNumber,
      per_page: perPage,
    };
  },

  async getClaim(id, query) {
    if (!id) {
      throw {
        message: "ID Not Provided",
        statusCode: 400,
      };
    }

    let theClaim = await Claim.query().findOne({ token_id: id });

    if (!theClaim) {
      throw {
        message: "Claim Not Found",
        statusCode: 404,
      };
    }

    return theClaim;
  },

  async createClaim(claimBody, userPermissions = {}) {
    const claim = await transaction(Claim, async (Claim) => {
      var newClaim = await Claim.query().insert({
        ...claimBody,
      });

      return newClaim;
    });

    return claim;
  },

  async editClaim(id, newBody) {
    if (!id) {
      throw {
        message: "ID Not Provided",
        statusCode: 400,
      };
    }
    if (newBody.id) {
      delete newBody.id;
    }
    let editedClaim = await Claim.query().patchAndFetchById(id, { ...newBody });

    if (!editedClaim) {
      throw {
        message: "Claim Not Found",
        statusCode: 404,
      };
    }

    return editedClaim;
  },

  async deleteClaim(id) {
    if (!id) {
      throw {
        message: "No ID Provided",
        statusCode: 400,
      };
    }

    let deletedCount = await Claim.query().patchAndFetchById(id, {
      is_deleted: true,
    });
    await Promise.all(
      Object.keys(Claim.getRelations()).map((relation) => {
        return deletedCount.$relatedQuery(relation).unrelate();
      })
    );

    if (deletedCount < 1) {
      throw {
        message: "Claim Not Found",
        statusCode: 404,
      };
    }

    return deletedCount;
  },
};
