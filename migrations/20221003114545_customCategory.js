/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("categories", (table) => {
    table.boolean("is_global").default(true);
    table.boolean("user_created").default(false);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("categories", (table) => {
    table.dropColumn("is_global");
    table.dropColumn("user_created");
  });
};
