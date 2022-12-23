
exports.up = async function (knex) {
  let exists = await knex.schema.hasTable('blogs')
  if (exists) return
  return knex.schema.createTable('blogs', (t) => {
    t.increments().primary()
    t.string("title")
    t.text("content")
    t.integer('owner')
    t.foreign('owner').references('id').inTable('users')
    t.boolean('is_deleted').default(false)
    t.timestamps()
  })
};

exports.down = async function (knex) {
  let exists = await knex.schema.hasTable('blogs')
  if (!exists) return
  await knex.schema.dropTable('blogs');
};
