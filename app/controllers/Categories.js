const { Categories } = require("../models"),
  { transaction } = require("objection"),
  { filterer } = require("../lib/filters");
module.exports = {
  async getCategories(query, pageNumber = 0, perPage = 20) {
    query.filter = query.filter || {};
    query.filter.is_global = true;
    return {
      ...(await filterer(query, Categories, {
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

  async getCategory(id, query) {
    if (!id) {
      throw {
        message: "ID Not Provided",
        statusCode: 400,
      };
    }
    let category = await Categories.query()
      .findById(id)
      .withGraphFetched(query.related);
    if (!category) {
      throw {
        message: "Category Not Found",
        statusCode: 404,
      };
    }
    return category;
  },

  async createCategory(categoryBody, userPermissions = {}) {
    const category = await transaction(Categories, async (Categories) => {
      var newCategory = await Categories.query().insert({
        ...categoryBody,
      });
      return newCategory;
    });
    return category;
  },

  async editCategory(id, newBody) {
    if (!id) {
      throw {
        message: "ID Not Provided",
        statusCode: 400,
      };
    }
    if (newBody.id) delete newBody.id;
    let editCategory = await Categories.query().patchAndFetchById(id, {
      ...newBody,
    });
    if (!editCategory) {
      throw {
        message: "Category Not Found",
        statusCode: 404,
      };
    }
    return editCategory;
  },

  async deleteCategory(id) {
    if (!id) {
      throw {
        message: "No ID Provided",
        statusCode: 400,
      };
    }
    let deletedCount = await Categories.query().patchAndFetchById(
      parseInt(id),
      { is_deleted: true }
    );
    await Promise.all(
      Object.keys(Categories.getRelations()).map((relation) => {
        return deletedCount.$relatedQuery(relation).unrelate();
      })
    );

    if (deletedCount < 1) {
      throw {
        message: "Category Not Found",
        statusCode: 404,
      };
    }
    return deletedCount;
  },
};
