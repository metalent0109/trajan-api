/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("experience", (table) => {
    table.string("start_month");
    table.string("end_month");
    table.integer("start_year");
    table.integer("end_year");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("experience", (table) => {
    table.dropColumn("job_start_date");
    table.dropColumn("job_end_date");
  });
};
