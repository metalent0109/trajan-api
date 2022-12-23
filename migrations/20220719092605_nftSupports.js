exports.up = async function (knex) {
  let exists = await knex.schema.hasTable("nft_supports");
  if (exists) return;
  return knex.schema.createTable("nft_supports", (t) => {
    t.increments().primary();
    t.string("title");
    t.text("description");
    t.string("ipfs_hash");
    t.integer("price_in_stx").unsigned();
    t.integer("limit");
    t.integer("support_for")
    t.foreign("support_for").references("id").inTable("users");
    t.boolean("is_deleted").default(false);
    t.timestamps();
  });
};

exports.down = async function (knex) {
  let exists = await knex.schema.hasTable("nft_supports");
  if (!exists) return;
  await knex.schema.dropTable("nft_supports");
};
