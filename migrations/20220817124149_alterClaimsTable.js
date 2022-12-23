/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("claims", (t) => {
    t.integer('medal_level');
    t.foreign('medal_level').references('id').inTable('medal_levels');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("claims", (t) => {
    t.dropForeign("medal_level");
    t.dropColumn("medal_level");
  });
};
