const { Users, Profiles } = require("../models"),
  { transaction } = require("objection"),
  { filterer } = require("../lib/filters");
module.exports = {
  async getUsers(query, pageNumber = 0, perPage = 20) {
    return {
      ...(await filterer(query, Users, {
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

  async getUsersWithFilter(
    query = {},
    pageNumber = 0,
    perPage = 20,
    filters
  ) {
    let filter
    if (filters) filter = JSON.parse(filters);
    delete query.filters;
    let results = await filterer(query, Users, {
      pageNumber: 0,
      perPage: 999999,
      ...(query.related && { related: query.related }),
      orderBy: query.orderBy || "-id",
      ...(query.search && { search: query.search }),
      ...(query.dateRange && { dateRange: query.dateRange }),
    });
    if (filter?.medalCount) {
      results.results = results.results.filter(
        (f) => f?.medalClaims?.length >= filter.medalCount.from && f?.medalClaims?.length <= filter.medalCount.to
      )
    }

    if (filter.category) {
      results.results = results.results.filter(
        (f) => f?.medalClaims[0]?.category?.title === filter.category
      )
    }

    if (filter.customOrderBy) {
      switch (filter.customOrderBy) {
        case "-medal":
          function compare(a, b) {
            if (a?.medalClaims?.length > b?.medalClaims?.length) {
              return -1;
            }
            if (a?.medalClaims?.length < b?.medalClaims?.length) {
              return 1;
            }
            return 0;
          }
          results.results = results.results.sort(compare)
      }
    }
    if (filter.medalLevel) {
      results.results = results.results.filter(
        (f) => filter.medalLevel === "Copper"
      )
    }
    let total = results?.results?.length;
    results.results = results.results.slice(Number(pageNumber) * (perPage || 20), (perPage || 20) * (Number(pageNumber) + 1));
    return {
      ...results,
      total: total,
      page: pageNumber,
      per_page: (perPage || 20),
    };
  },

  async getUser(address, query) {
    if (!address) {
      throw {
        message: "address Not Provided",
        statusCode: 400,
      };
    }
    let user = await Users.query()
      .findOne({ stx_address: address })
      .withGraphFetched(query.related);
    if (!user) {
      throw {
        message: "User Not Found",
        statusCode: 404,
      };
    }
    return user;
  },

  async createUser(userBody, userPermissions = {}) {
    const user = await transaction(Users, Profiles, async (Users, Profiles) => {
      let wasUserFound = await Users.query().findOne({
        stx_address: userBody.stx_address,
        is_deleted: false,
      });
      if (wasUserFound) {
        return wasUserFound;
      }
      var newUser = await Users.query().insert({
        ...userBody,
      });
      await Profiles.query().insert({ user_id: newUser.id });
      return newUser;
    });
    return user;
  },

  async editUser(id, newBody) {
    if (!id) {
      throw {
        message: "ID Not Provided",
        statusCode: 400,
      };
    }
    if (newBody.id) delete newBody.id;
    let editedUser = await Users.query().patchAndFetchById(id, { ...newBody });
    if (!editedUser) {
      throw {
        message: "User Not Found",
        statusCode: 404,
      };
    }
    return editedUser;
  },

  async deleteUser(id) {
    if (!id) {
      throw {
        message: "No ID Provided",
        statusCode: 400,
      };
    }
    let deletedCount = await Users.query().patchAndFetchById(parseInt(id), {
      is_deleted: true,
    });
    await Promise.all(
      Object.keys(Users.getRelations()).map((relation) => {
        return deletedCount.$relatedQuery(relation).unrelate();
      })
    );

    if (deletedCount < 1) {
      throw {
        message: "User Not Found",
        statusCode: 404,
      };
    }
    return deletedCount;
  },
};
