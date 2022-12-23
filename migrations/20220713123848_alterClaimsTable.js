
exports.up = async function (knex) {
  await knex.schema.alterTable("claims", (table) => {
    table.integer("category_id");
    table.foreign('category_id').references('id').inTable('categories')
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("claims", (table) => {
    table.dropForeign('category_id');
    table.dropColumn("category_id");
  });
};
