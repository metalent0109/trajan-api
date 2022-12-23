const { transaction, raw } = require("objection"),
  _ = require("lodash"),
  moment = require("moment");

exports.filterer = async function (query, Model, operations) {
  const order = await transaction(Model, async (Model) => {
    let filter = _.isPlainObject(query.filter) ? query.filter : {};
    query.filter = filter;

    let preparedFetch = Model.query().skipUndefined().alias("model");
    let comparison_keys = {
      eq: "=",
      like: "ILIKE",
      not: "<>",
      lt: "<",
      lte: "<=",
      gt: ">",
      gte: ">=",
      in: "in",
    };

    /* To get notification filtered by user_id */
    if (Model.name === "Notification" && query.filter.hasOwnProperty("user")) {
      preparedFetch.joinRelated("users").where("users.id", query.filter.user);
      delete query.filter.user;
    }
    // @deprecated with relationFilter to support multiple filters
    if (query.hasOwnProperty("filterRelated")) {
      let relateItem = Object.keys(query.filterRelated)[0];
      let relateItemArray = relateItem.split(".");
      let relations = relateItemArray[0].split(",");
      console.log(relations, "relations");
      if (relations[1]) {
        preparedFetch
          .joinRelated(`[${relations[0]}.[${relations[1]}]]`, {
            alias: "table1",
          })
          .where(
            `table1:${relations[1]}.${relateItemArray[1]}`,
            relateItemArray[2] || "=",
            query.filterRelated[relateItem]
          );
      } else {
        preparedFetch
          .joinRelated(relateItemArray[0], { alias: "table" })
          .where(
            `table.${relateItemArray[1]}`,
            relateItemArray[2] || "=",
            query.filterRelated[relateItem]
          );
      }
    }

    if (query.hasOwnProperty("relationFilter")) {
      let relateFilters = Object.keys(query.relationFilter);
      relateFilters.forEach((relateItem, index) => {
        console.log("check2: ", relateItem);
        let relateItemArray = relateItem.split(".");
        let relations = relateItemArray[0].split(",");
        if (relations[1]) {
          preparedFetch
            .joinRelated(`[${relations[0]}.[${relations[1]}]]`, {
              alias: "table1",
            })
            .where(
              `table1:${relations[1]}.${relateItemArray[1]}`,
              relateItemArray[2] || "=",
              query.relationFilter[relateItem]
            );
        } else {
          preparedFetch
            .joinRelated(relateItemArray[0], { alias: relateItemArray[0] })
            .where(
              relateItemArray[0] + `.${relateItemArray[1]}`,
              relateItemArray[2] || "=",
              query.relationFilter[relateItem]
            );
        }
      });
    }

    let filters = Object.entries(query.filter);
    if (filters[0]) {
      let [key, value] = filters[0];
      let comp = query.operand
        ? comparison_keys[JSON.parse(query.operand)[key]] || "="
        : "=";
      let values;
      if (value === true || value === false) {
        values = [value];
      } else {
        values = value.split(",");
      }
      if (values.length === 1) {
        preparedFetch.where(`model.${key}`, comp, value);
      } else {
        preparedFetch.andWhere((qb) => {
          values.forEach((value, index) => {
            if (index === 0) qb.where(`model.${key}`, comp, value);
            else {
              qb.orWhere(`model.${key}`, comp, value);
            }
          });
        });
      }
    }
    filters.shift();
    filters.forEach(([key, value]) => {
      let comp = query.operand
        ? comparison_keys[query.operand[key]] || "="
        : "=";
      let values;
      if (value === true || value === false) {
        values = [value];
      } else values = value.split(",");
      if (values.length === 1) preparedFetch.where(`model.${key}`, comp, value);
      else {
        preparedFetch.andWhere((qb) => {
          values.forEach((value, index) => {
            if (index === 0) qb.andWhere(`model.${key}`, comp, value);
            else {
              qb.orWhere(`model.${key}`, comp, value);
            }
          });
        });
      }
    });

    if (query.dateRange) {
      const dateRange = JSON.parse(query.dateRange);
      preparedFetch.where((builder) => {
        if (Array.isArray(dateRange.column)) {
          dateRange.column.map((col) => {
            if (col)
              builder.orWhereBetween(`model.${col}`, [
                dateRange.from,
                dateRange.to,
              ]);
          });
        } else
          builder.whereBetween(`model.${dateRange.column || "created_at"}`, [
            dateRange.from,
            dateRange.to,
          ]);
      });
    }

    if (operations.search && typeof Model.getSearchable === "function") {
      let fields = Model.getSearchable();
      preparedFetch.where((qb) => {
        for (let i = 0; i < fields.length; i++) {
          if (i === 0) {
            if (fields[i] === "id") {
              if (
                /^\d+$/.test(operations.search) &&
                Number(operations.search) < 999999999
              ) {
                qb.where(`model.${fields[i]}`, Number(operations.search));
              }
            } else {
              qb.where(`model.${fields[i]}`, "ILIKE", `%${operations.search}%`);
            }
          } else {
            qb.orWhere(`model.${fields[i]}`, "ILIKE", `%${operations.search}%`);
          }
        }

        if (
          query.searchRelated &&
          typeof Model.getRelatedSearchable === "function"
        ) {
          let fields = Model.getRelatedSearchable();
          let related = Object.keys(query.searchRelated)[0];
          let search = Object.values(query.searchRelated)[0];
          qb.leftJoinRelated(related, { alias: "searchTable" }).orWhere(
            (qb1) => {
              for (let i = 0; i < fields.length; i++) {
                if (i === 0) {
                  qb1.where(`searchTable.${fields[i]}`, "ILIKE", `%${search}%`);
                } else {
                  qb1.orWhere(
                    `searchTable.${fields[i]}`,
                    "ILIKE",
                    `%${search}%`
                  );
                }
              }
              if (
                fields.includes("first_name") &&
                fields.includes("last_name")
              ) {
                qb1.orWhere(
                  raw(
                    `?? || ' ' || ??`,
                    "searchTable.first_name",
                    "searchTable.last_name"
                  ),
                  "ILIKE",
                  `%${search}%`
                );
              }
            }
          );
        }

        if (
          query.searchRelatedInvoice &&
          typeof Model.getRelatedSearchableInvoice === "function"
        ) {
          let fields = Model.getRelatedSearchableInvoice();
          let related = Object.keys(query.searchRelatedInvoice)[0];
          let search = Object.values(query.searchRelatedInvoice)[0];
          let numSearch = !isNaN(search);
          qb.leftJoinRelated(related, { alias: "searchInvoiceTable" }).orWhere(
            (qb1) => {
              for (let i = 0; i < fields.length; i++) {
                if (i === 0) {
                  qb1.where(
                    `searchInvoiceTable.${fields[i]}`,
                    "ILIKE",
                    `%${search}%`
                  );
                } else {
                  qb1.orWhere(
                    `searchInvoiceTable.${fields[i]}`,
                    "ILIKE",
                    `%${search}%`
                  );
                }
              }
              if (numSearch && Number(search) < 999999999) {
                qb1.andWhere(`searchInvoiceTable.invoice`, `${Number(search)}`);
              }
            }
          );
        }

        if (
          query.searchRelatedCustomer &&
          typeof Model.getRelatedSearchableCustomer === "function"
        ) {
          let fields = Model.getRelatedSearchableCustomer();
          let related = Object.keys(query.searchRelatedCustomer)[0];
          let search = Object.values(query.searchRelatedCustomer)[0];
          qb.leftJoinRelated(related, { alias: "searchCustomerTable" }).orWhere(
            (qb1) => {
              for (let i = 0; i < fields.length; i++) {
                if (i === 0) {
                  qb1.where(
                    `searchCustomerTable.${fields[i]}`,
                    "ILIKE",
                    `%${search}%`
                  );
                } else {
                  qb1.orWhere(
                    `searchCustomerTable.${fields[i]}`,
                    "ILIKE",
                    `%${search}%`
                  );
                }
              }
              if (
                fields.includes("first_name") &&
                fields.includes("last_name")
              ) {
                qb1.orWhere(
                  raw(
                    `?? || ' ' || ??`,
                    "searchCustomerTable.first_name",
                    "searchCustomerTable.last_name"
                  ),
                  "ILIKE",
                  `%${search}%`
                );
              }
            }
          );
        }

        if (
          query.searchRelatedStore &&
          typeof Model.getRelatedSearchableStore === "function"
        ) {
          const fields = Model.getRelatedSearchableStore();
          const related = Object.keys(query.searchRelatedStore)[0];
          const search = Object.values(query.searchRelatedStore)[0];
          qb.leftJoinRelated(related, { alias: "searchStoreTable" }).orWhere(
            (qb1) => {
              for (let i = 0; i < fields.length; i++) {
                if (i === 0) {
                  qb1.where(
                    `searchStoreTable.${fields[i]}`,
                    "ILIKE",
                    `%${search}%`
                  );
                } else {
                  qb1.orWhere(
                    `searchStoreTable.${fields[i]}`,
                    "ILIKE",
                    `%${search}%`
                  );
                }
              }
            }
          );
        }
      });
    }

    if (
      query.searchRelated &&
      typeof Model.getRelatedSearchable === "function"
    ) {
      let related = Object.keys(query.searchRelated)[0];
      preparedFetch.leftJoinRelated(related, { alias: "searchTable" });
    }

    if (
      query.searchRelatedInvoice &&
      typeof Model.getRelatedSearchableInvoice === "function"
    ) {
      let related = Object.keys(query.searchRelatedInvoice)[0];
      preparedFetch.leftJoinRelated(related, { alias: "searchInvoiceTable" });
    }

    if (
      query.searchRelatedStore &&
      typeof Model.getRelatedSearchableStore === "function"
    ) {
      let related = Object.keys(query.searchRelatedStore)[0];
      preparedFetch.leftJoinRelated(related, { alias: "searchStoreTable" });
    }

    if (
      query.searchRelatedCustomer &&
      typeof Model.getRelatedSearchableCustomer === "function"
    ) {
      let related = Object.keys(query.searchRelatedCustomer)[0];
      preparedFetch.leftJoinRelated(related, { alias: "searchCustomerTable" });
    }

    if (operations.match && typeof Model.getSearchable === "function") {
      let fields = Model.getSearchable();
      preparedFetch.where((qb) => {
        for (let i = 0; i < fields.length; i++) {
          if (i === 0) {
            if (/^\d+$/.test(operations.search)) {
              qb.where(`model.${fields[i]}`, Number(operations.search));
            }
          } else {
            qb.orWhere(`model.${fields[i]}`, "ILIKE", `%${operations.match}%`);
          }
        }
      });
    }

    if (!query.hasOwnProperty("displayAll")) {
      if (
        query.hasOwnProperty("filter") &&
        query.filter.hasOwnProperty("is_deleted")
      ) {
        if (query.filter.is_deleted === "true") {
          preparedFetch.andWhere(`model.is_deleted`, "=", true);
        } else preparedFetch.andWhere(`model.is_deleted`, "=", false);
      } else {
        preparedFetch.where(`model.is_deleted`, "=", false);
      }
    }

    if (query.first_name) {
      preparedFetch.where((qb) => {
        qb.where("model.first_name", "ILIKE", `%${query.first_name}%`);
      });
    }

    if (query.last_name) {
      preparedFetch.where((qb) => {
        qb.where("model.last_name", "ILIKE", `%${query.last_name}%`);
      });
    }
    if (query.name) {
      let names = query.name.split(" ");
      preparedFetch.where((qb) => {
        for (let i = 0; i < names.length; i++) {
          if (i === 0) {
            qb.where("model.first_name", "ILIKE", `%${names[i]}%`);
            qb.orWhere("model.last_name", "ILIKE", `%${names[i]}%`);
          } else {
            qb.andWhere("model.last_name", "ILIKE", `%${names[i]}%`);
          }
        }
      });
    }

    if (query.last_four_of_social) {
      preparedFetch.where((qb) => {
        qb.where(
          "model.last_four_of_social",
          "ILIKE",
          `%${query.last_four_of_social}%`
        );
      });
    }

    if (query.related) {
      if (operations.orderBy && operations.orderBy.indexOf(".") > -1) {
        if (operations.orderBy.charAt(0) === "-") {
          preparedFetch.joinRelated(
            operations.orderBy.substring(1, operations.orderBy.indexOf("."))
          );
        } else {
          preparedFetch.joinRelated(
            operations.orderBy.substring(0, operations.orderBy.indexOf("."))
          );
        }
      }
      preparedFetch.withGraphFetched(query.related);
    }

    if (operations.orderBy) {
      let orderBy = operations.orderBy;
      if (orderBy.charAt(0) === "-") {
        orderBy = orderBy.substr(1);
        preparedFetch.orderBy(orderBy || "id", "desc");
      } else {
        preparedFetch.orderBy(orderBy || "id");
      }
    }

    if ((operations.pageNumber, operations.perPage)) {
      preparedFetch.page(operations.pageNumber, operations.perPage);
    }

    if (operations.count) {
      preparedFetch.count("*");
    }

    return await preparedFetch;
  });

  if (operations.search) {
    const uniqueData = _.uniqBy(order.results, "id");
    return {
      ...order,
      results: uniqueData,
      ...(uniqueData.length < order.results.length && {
        total: order.total - (order.results.length - uniqueData.length),
      }),
    };
  } else return order;
};
