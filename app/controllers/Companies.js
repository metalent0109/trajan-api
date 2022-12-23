const { Companies } = require('../models'),
  { transaction } = require('objection'),
  { filterer } = require('../lib/filters');
module.exports = {

  async getCompanies(
    query,
    pageNumber = 0,
    perPage = 20,
  ) {
    return {
      ...(await filterer(query, Companies, {
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

  async getCompany(id, query) {
    if (!id) {
      throw {
        message: 'ID Not Provided',
        statusCode: 400
      }
    }
    let company = await Companies.query().findById(id).withGraphFetched(query.related)
    if (!company) {
      throw {
        message: 'Company Not Found',
        statusCode: 404
      }
    }
    return company
  },

  async createCompany(companyBody, userPermissions = {}) {
    const company = await transaction(
      Companies,
      async (Companies) => {
        var newCompany = await Companies.query().insert({
          ...companyBody
        })
        return newCompany
      }
    )
    return company
  },

  async editCompany(id, newBody) {
    if (!id) {
      throw {
        message: 'ID Not Provided',
        statusCode: 400
      }
    }
    if (newBody.id) delete newBody.id
    let editCompany = await Companies.query().patchAndFetchById(id, { ...newBody })
    if (!editCompany) {
      throw {
        message: 'Company Not Found',
        statusCode: 404
      }
    }
    return editCompany
  },

  async deleteCompany(id) {
    if (!id) {
      throw {
        message: 'No ID Provided',
        statusCode: 400
      }
    }
    let deletedCount = await Companies.query().patchAndFetchById(parseInt(id), { is_deleted: true })
    await Promise.all(
      Object.keys(Companies.getRelations()).map((relation) => {
        return deletedCount.$relatedQuery(relation).unrelate()
      })
    )

    if (deletedCount < 1) {
      throw {
        message: 'Company Not Found',
        statusCode: 404
      }
    }
    return deletedCount
  }
}
