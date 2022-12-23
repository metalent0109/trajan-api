/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.all([
    knex.schema.alterTable("nft_supporters", (t) => {
      t.dropColumn("support_id");
    }),
    knex.schema.alterTable("nft_supporters", (t) => {
      t.integer("support_id");
      t.foreign("support_id").references("id").inTable("nft_supports");
    }),
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
