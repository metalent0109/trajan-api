
exports.up = async function (knex) {
  await knex.schema.alterTable("users", (table) => {
    table.boolean("is_verified").default(false);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("is_verified");
  });
};
