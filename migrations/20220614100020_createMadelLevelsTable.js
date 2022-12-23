exports.up = async function (knex) {
  let exists = await knex.schema.hasTable('medal_levels')
  if (exists) return
  return knex.schema.createTable('medal_levels', (t) => {
    t.increments().primary()
    t.string('title')
    t.string('slug')
    t.integer('order')
    t.boolean('is_deleted').default(false)
    t.timestamps()
  })
};

exports.down = async function (knex) {
  let exists = await knex.schema.hasTable('medal_levels')
  if (!exists) return
  await knex.schema.dropTable('medal_levels');
};
