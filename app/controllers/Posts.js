const { Posts } = require('../models'),
  { transaction } = require('objection'),
  { filterer } = require('../lib/filters');
module.exports = {

  async getPosts(
    query,
    pageNumber = 0,
    perPage = 20,
  ) {
    return {
      ...(await filterer(query, Posts, {
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

  async getPost(id, query) {
    if (!id) {
      throw {
        message: 'ID Not Provided',
        statusCode: 400
      }
    }
    let post = await Posts.query().findById(id).withGraphFetched(query.related)
    if (!post) {
      throw {
        message: 'Post Not Found',
        statusCode: 404
      }
    }
    return post
  },

  async createPost(postBody, userPermissions = {}) {
    delete postBody.message;
    const post = await transaction(
      Posts,
      async (Posts) => {
        var newPost = await Posts.query().insert({
          ...postBody
        })
        return newPost
      }
    )
    return post
  },

  async editPost(id, newBody) {
    if (!id) {
      throw {
        message: 'ID Not Provided',
        statusCode: 400
      }
    }
    if (newBody.id) delete newBody.id
    if (newBody.message) delete newBody.message
    let editedPost = await Posts.query().patchAndFetchById(id, { ...newBody })
    if (!editedPost) {
      throw {
        message: 'Post Not Found',
        statusCode: 404
      }
    }
    return editedPost
  },

  async deletePost(id) {
    if (!id) {
      throw {
        message: 'No ID Provided',
        statusCode: 400
      }
    }
    let deletedCount = await Posts.query().patchAndFetchById(parseInt(id), { is_deleted: true })
    // await Promise.all(
    //   Object.keys(Posts.getRelations()).map((relation) => {
    //     return deletedCount.$relatedQuery(relation).unrelate()
    //   })
    // )

    if (deletedCount < 1) {
      throw {
        message: 'Post Not Found',
        statusCode: 404
      }
    }
    return deletedCount
  }
}
