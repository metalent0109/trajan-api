exports.up = async function (knex) {
  let exists = await knex.schema.hasTable('anecdote')
  if (exists) return
  return knex.schema.createTable('anecdote', (t) => {
    t.increments().primary()
    t.integer('sender')
    t.foreign('sender').references('id').inTable('users')
    t.integer('recipient')
    t.foreign('recipient').references('id').inTable('users')
    t.text('anecdote')
    t.boolean('is_deleted').default(false)
    t.timestamps()
  })
};

exports.down = async function (knex) {
  let exists = await knex.schema.hasTable('anecdote')
  if (!exists) return
  await knex.schema.dropTable('anecdote');
};
