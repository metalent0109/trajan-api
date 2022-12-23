const { Followers } = require('../models'),
  { transaction } = require('objection'),
  { filterer } = require('../lib/filters');
module.exports = {

  async getFollowers(
    query,
    pageNumber = 0,
    perPage = 20,
  ) {
    return {
      ...(await filterer(query, Followers, {
        pageNumber,
        perPage,
        related: query.related,
        search: query.search,
        orderBy: query.orderBy || "id"
      })),
      page: pageNumber,
      per_page: perPage
    };
  },

  async getFollower(id, query) {
    if (!id) {
      throw {
        message: 'ID Not Provided',
        statusCode: 400
      }
    }
    let follower = await Followers.query().findById(id).withGraphFetched(query.related)
    if (!follower) {
      throw {
        message: 'Follower Not Found',
        statusCode: 404
      }
    }
    return follower
  },

  async createFollower(followerBody, userPermissions = {}) {
    const follower = await transaction(
      Followers,
      async (Followers) => {
        let followerData = await Followers.query().findOne({ user_id: followerBody.user_id, follower_id: followerBody.follower_id })
        if (followerData) {
          return await Followers.query().patchAndFetchById(followerData.id, { is_deleted: false }).withGraphFetched("[follower,user]")
        }
        var newFollower = await Followers.query().insert({
          ...followerBody,
          is_deleted: false,
        }).withGraphFetched("[follower,user]")
        return newFollower
      }
    )
    return follower
  },

  async editFollower(id, newBody) {
    if (!id) {
      throw {
        message: 'ID Not Provided',
        statusCode: 400
      }
    }
    if (newBody.id) delete newBody.id
    let editedFollower = await Followers.query().patchAndFetchById(id, { ...newBody }).withGraphFetched("[follower,user]")
    if (!editedFollower) {
      throw {
        message: 'Follower Not Found',
        statusCode: 404
      }
    }
    return editedFollower
  },

  async deleteFollower(id) {
    if (!id) {
      throw {
        message: 'No ID Provided',
        statusCode: 400
      }
    }
    let deletedCount = await Followers.query().patchAndFetchById(parseInt(id), { is_deleted: true })
    await Promise.all(
      Object.keys(Followers.getRelations()).map((relation) => {
        return deletedCount.$relatedQuery(relation).unrelate()
      })
    )

    if (deletedCount < 1) {
      throw {
        message: 'Follower Not Found',
        statusCode: 404
      }
    }
    return deletedCount
  }
}
