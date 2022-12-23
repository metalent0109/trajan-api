const { Posts, Medal, Recommendation,  Followers, Profiles} = require('../models'),
  { transaction } = require('objection'),
  { filterer } = require('../lib/filters');

module.exports = {
  async getUsersFollowing(id, query)
  {
    if (!id) {
      throw {
        message: 'ID Not Provided',
        statusCode: 400
      }
    }
/*
    let usersFollowing = await Followers.query()
                    .select('follower_id')
                    .where('is_deleted', false)
                    .where('user_id', id)
                    .limit(20)
*/
    let usersFollowing = await Followers.query()
                              .select('follower_id')
                              .where('is_deleted', false)
                              .where('user_id', id)
                              .limit(20)

    if (!usersFollowing) {
      throw {
        message: 'Not Found Users whom selected user is following',
        statusCode: 404
      }
    }
    return usersFollowing
  },

  async getUsersName(ids, query)
  {
    if (!ids) {
      throw {
        message: 'ID Not Provided',
        statusCode: 400
      }
    }

    let usersName = await Profiles.query()
                    .select('user_id', 'display_name')
                    .where('is_deleted', false)
                    .whereIn('user_id', ids)
                    .limit(20)

    if (!usersName) {
      throw {
        message: 'Not Found Users whom selected user is following',
        statusCode: 404
      }
    }
    return usersName
  },

  async getPostsFromUserId(ids, query) {
    if (!ids) {
      throw {
        message: 'ID Not Provided',
        statusCode: 400
      }
    }

    let post = await Posts.query()
                          .select('id', 'content', 'owner','created_at')
                          .where('is_deleted', false)
                          .whereIn('owner', ids)
                          .orderBy('created_at', 'desc')
                          .limit(20)

    if (!post) {
      throw {
        message: 'Post Not Found',
        statusCode: 404
      }
    }
    return post
  },

  async getMedalFromUserId(ids, query) {
    if (!ids) {
      throw {
        message: 'ID Not Provided',
        statusCode: 400
      }
    }
//    let medal = await Medal.query().findById(id).withGraphFetched(query.related)

    let medals = await Medal.query()
                            .select('id', 'description', 'user_id', 'created_at')
                            .where('is_deleted', false)
                            .whereIn('user_id', ids)
                            .orderBy('created_at', 'desc')
                            .limit(20)

    if (!medals) {
      throw {
        message: 'Medal Not Found',
        statusCode: 404
      }
    }
    return medals
  },

  async getRecommendationFromUserId(ids, query) {
    if (!ids) {
      throw {
        message: 'ID Not Provided',
        statusCode: 400
      }
    }

    //let recommendation = await Recommendation.query().findById(id).withGraphFetched(query.related)

    let recommendation = await Recommendation.query()
                                            .select('id', 'recommendation', 'sender', 'created_at')
                                            .where('is_deleted', false)
                                            .whereIn('sender', ids)
                                            .orderBy('created_at', 'desc')
                                            .limit(20)

    if (!recommendation) {
      throw {
        message: 'Post Not Found',
        statusCode: 404
      }
    }
    return recommendation
  },


}
