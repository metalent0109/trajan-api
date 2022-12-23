
exports.up = async function (knex) {
  let exists = await knex.schema.hasTable('notifications')
  if (exists) return
  return knex.schema.createTable('notifications', (t) => {
    t.increments().primary()
    t.string("title")
    t.text("description")
    t.boolean('read').default(false)
    t.string("type")
    t.integer('reference_id')
    t.integer('sender')
    t.foreign('sender').references('id').inTable('users')
    t.integer('recipient')
    t.foreign('recipient').references('id').inTable('users')
    t.boolean('is_deleted').default(false)
    t.timestamps()
  })
};

exports.down = async function (knex) {
  let exists = await knex.schema.hasTable('notifications')
  if (!exists) return
  await knex.schema.dropTable('notifications');
};
