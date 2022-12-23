const { MedalLevels } = require('../models'),
  { transaction } = require('objection'),
  { filterer } = require('../lib/filters');
module.exports = {

  async getMedalLevels(
    query,
    pageNumber = 0,
    perPage = 20,
  ) {
    return {
      ...(await filterer(query, MedalLevels, {
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

  async getMedalLevel(id, query) {
    if (!id) {
      throw {
        message: 'ID Not Provided',
        statusCode: 400
      }
    }
    let medalLevel = await MedalLevels.query().findById(id).withGraphFetched(query.related)
    if (!medalLevel) {
      throw {
        message: 'Medal Level Not Found',
        statusCode: 404
      }
    }
    return medalLevel
  },

  async createMedalLevel(medalLevelBody, userPermissions = {}) {
    const medalLevel = await transaction(
      MedalLevels,
      async (MedalLevels) => {
        var newMedalLevel = await MedalLevels.query().insert({
          ...medalLevelBody
        })
        return newMedalLevel
      }
    )
    return medalLevel
  },

  async editMedalLevel(id, newBody) {
    if (!id) {
      throw {
        message: 'ID Not Provided',
        statusCode: 400
      }
    }
    if (newBody.id) delete newBody.id
    let editedMedalLevel = await MedalLevels.query().patchAndFetchById(id, { ...newBody })
    if (!editedMedalLevel) {
      throw {
        message: 'Medal Level Not Found',
        statusCode: 404
      }
    }
    return editedMedalLevel
  },

  async deleteMedalLevel(id) {
    if (!id) {
      throw {
        message: 'No ID Provided',
        statusCode: 400
      }
    }
    let deletedCount = await MedalLevels.query().patchAndFetchById(parseInt(id), { is_deleted: true })
    await Promise.all(
      Object.keys(MedalLevels.getRelations()).map((relation) => {
        return deletedCount.$relatedQuery(relation).unrelate()
      })
    )

    if (deletedCount < 1) {
      throw {
        message: 'Medal Level Not Found',
        statusCode: 404
      }
    }
    return deletedCount
  }
}
