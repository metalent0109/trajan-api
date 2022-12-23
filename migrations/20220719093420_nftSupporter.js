exports.up = async function (knex) {
  let exists = await knex.schema.hasTable("nft_supporters");
  if (exists) return;
  return knex.schema.createTable("nft_supporters", (t) => {
    t.increments().primary();
    t.integer("supported_by");
    t.foreign("supported_by").references("id").inTable("users");
    t.integer("support_id");
    t.foreign("support_id").references("id").inTable("users");
    t.boolean("is_deleted").default(false);
    t.timestamps();
  });
};

exports.down = async function (knex) {
  let exists = await knex.schema.hasTable("nft_supporters");
  if (!exists) return;
  await knex.schema.dropTable("nft_supporters");
};
