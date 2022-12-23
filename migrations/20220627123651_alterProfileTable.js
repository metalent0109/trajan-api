
exports.up = async function (knex) {
  await knex.schema.alterTable("profiles", (table) => {
    table.string("display_name");
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("profiles", (table) => {
    table.dropColumn("display_name");
  });
};
