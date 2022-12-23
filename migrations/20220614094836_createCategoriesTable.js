exports.up = async function (knex) {
  let exists = await knex.schema.hasTable('categories')
  if (exists) return
  return knex.schema.createTable('categories', (t) => {
    t.increments().primary()
    t.string('title')
    t.boolean('is_deleted').default(false)
    t.timestamps()
  })
};

exports.down = async function (knex) {
  let exists = await knex.schema.hasTable('categories')
  if (!exists) return
  await knex.schema.dropTable('categories');
};
