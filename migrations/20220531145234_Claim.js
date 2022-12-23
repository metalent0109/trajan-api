/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.all([
    knex.schema.createTableIfNotExists("claims", (t) => {
      t.increments().primary();
      t.timestamps();
      t.string("title");
      t.string("image");
      t.string("token_id");
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
