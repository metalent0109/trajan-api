const { Experience } = require('../models'),
  { transaction } = require('objection'),
  { filterer } = require('../lib/filters');
module.exports = {

  async getExperiences(
    query,
    pageNumber = 0,
    perPage = 20,
  ) {
    return {
      ...(await filterer(query, Experience, {
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

  async getExperience(id, query) {
    if (!id) {
      throw {
        message: 'ID Not Provided',
        statusCode: 400
      }
    }
    let category = await Experience.query().findById(id).withGraphFetched(query.related)
    if (!category) {
      throw {
        message: 'Experience Not Found',
        statusCode: 404
      }
    }
    return category
  },

  async createExperience(categoryBody, userPermissions = {}) {
    const category = await transaction(
      Experience,
      async (Experience) => {
        var newExperience = await Experience.query().insert({
          ...categoryBody
        })
        return newExperience
      }
    )
    return category
  },

  async editExperience(id, newBody) {
    if (!id) {
      throw {
        message: 'ID Not Provided',
        statusCode: 400
      }
    }
    if (newBody.id) delete newBody.id
    if (newBody.message) delete newBody.message
    let editExperience = await Experience.query().patchAndFetchById(id, { ...newBody })
    if (!editExperience) {
      throw {
        message: 'Experience Not Found',
        statusCode: 404
      }
    }
    return editExperience
  },

  async deleteExperience(id) {
    if (!id) {
      throw {
        message: 'No ID Provided',
        statusCode: 400
      }
    }
    let deletedCount = await Experience.query().patchAndFetchById(parseInt(id), { is_deleted: true })

    if (deletedCount < 1) {
      throw {
        message: 'Experience Not Found',
        statusCode: 404
      }
    }
    return deletedCount
  }
}
