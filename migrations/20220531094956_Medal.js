/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.all([
    knex.schema.createTableIfNotExists("medals", (t) => {
      t.increments().primary();
      t.timestamps();
      t.string("title");
      t.string("image");
      t.string("description");
      t.string("max_supply");
      t.string("disable_mint");
      t.boolean("is_deleted").default(false);
    }),
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.all([knex.schema.dropTableIfExists("grants")]);
};
