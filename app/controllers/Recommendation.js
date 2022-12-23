const { Recommendation, Users, Profiles, Notifications } = require("../models"),
  { transaction } = require("objection"),
  { filterer } = require("../lib/filters");
module.exports = {
  async getRecommendations(query, pageNumber = 0, perPage = 20) {
    return {
      ...(await filterer(query, Recommendation, {
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

  async getRecommendation(id, query) {
    if (!id) {
      throw {
        message: "ID Not Provided",
        statusCode: 400,
      };
    }
    let recommendation = await Recommendation.query()
      .findById(id)
      .withGraphFetched(query.related);
    if (!recommendation) {
      throw {
        message: "Recommendation Not Found",
        statusCode: 404,
      };
    }
    return recommendation;
  },

  async createRecommendation(recommendationBody, userPermissions = {}) {
    if (!recommendationBody.recipient_wallet_id) {
      throw {
        message: "Recepient should be provided",
      };
    }
    const recommendation = await transaction(
      Recommendation,
      Notifications,
      Users,
      async (Recommendation, Notifications, Users) => {
        let wasUserFound = await Users.query().findOne({
          stx_address: recommendationBody.recipient_wallet_id,
          is_deleted: false,
        });
        let recipient;
        if (wasUserFound) {
          recipient = wasUserFound.id;
        } else {
          var newUser = await Users.query().insert({
            stx_address: recommendationBody.recipient_wallet_id,
          });
          await Profiles.query().insert({ user_id: newUser.id });
          recipient = newUser.id;
        }
        delete recommendationBody.recipient_wallet_id;
        delete recommendationBody.message;

        var newRecommendation = await Recommendation.query().insert({
          ...recommendationBody,
          recipient,
        }).withGraphFetched("recipientProfile.user");
        await Notifications.query().insert({
          title: "sent you a recommendation",
          type: "recommendation",
          reference_id: newRecommendation?.id,
          sender: recommendationBody?.sender,
          recipient: recipient
        })
        return newRecommendation;
      }
    );
    return recommendation;
  },

  async editRecommendation(id, newBody) {
    if (!id) {
      throw {
        message: "ID Not Provided",
        statusCode: 400,
      };
    }
    if (newBody.id) delete newBody.id;
    delete newBody.message;
    let editedRecommendation = await Recommendation.query().patchAndFetchById(
      id,
      { ...newBody }
    );
    if (!editedRecommendation) {
      throw {
        message: "Recommendation Not Found",
        statusCode: 404,
      };
    }
    return editedRecommendation;
  },

  async deleteRecommendation(id) {
    if (!id) {
      throw {
        message: "No ID Provided",
        statusCode: 400,
      };
    }
    let deletedCount = await Recommendation.query().patchAndFetchById(
      parseInt(id),
      { is_deleted: true }
    );
    await Promise.all(
      Object.keys(Recommendation.getRelations()).map((relation) => {
        return deletedCount.$relatedQuery(relation).unrelate();
      })
    );

    if (deletedCount < 1) {
      throw {
        message: "Recommendation Not Found",
        statusCode: 404,
      };
    }
    return deletedCount;
  },
};
