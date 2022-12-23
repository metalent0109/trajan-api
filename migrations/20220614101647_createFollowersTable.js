exports.up = async function (knex) {
  let exists = await knex.schema.hasTable('followers')
  if (exists) return
  return knex.schema.createTable('followers', (t) => {
    t.increments().primary()
    t.integer('follower_id')
    t.foreign('follower_id').references('id').inTable('users')
    t.integer('user_id')
    t.foreign('user_id').references('id').inTable('users')
    t.boolean('is_deleted').default(false)
    t.timestamps()
  })
};

exports.down = async function (knex) {
  let exists = await knex.schema.hasTable('followers')
  if (!exists) return
  await knex.schema.dropTable('followers');
};
