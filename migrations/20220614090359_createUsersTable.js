exports.up = async function (knex) {
  let exists = await knex.schema.hasTable('users')
  if (exists) return
  return knex.schema.createTable('users', (t) => {
    t.increments().primary()
    t.text('btc_name')
    t.text('stx_address')
    t.boolean('is_deleted').default(false)
    t.timestamps()
  })
};

exports.down = async function (knex) {
  let exists = await knex.schema.hasTable('users')
  if (!exists) return
  await knex.schema.dropTable('users');
};
