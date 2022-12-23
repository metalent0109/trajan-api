/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.all([
    knex.schema.alterTable("claims", (t) => {
      t.integer("user_id");
      t.foreign("user_id").references("id").inTable("users");
    }),
    knex.schema.alterTable("medals", (t) => {
      t.integer("user_id");
      t.foreign("user_id").references("id").inTable("users");
    }),
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
