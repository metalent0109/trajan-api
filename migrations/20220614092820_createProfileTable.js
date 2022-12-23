exports.up = async function (knex) {
  let exists = await knex.schema.hasTable('profiles')
  if (exists) return
  return knex.schema.createTable('profiles', (t) => {
    t.increments().primary()
    t.text('description')
    t.text('twitter_link')
    t.text('facebook_link')
    t.text('website_link')
    t.text('tagline')
    t.text('image')
    t.text('github_url')
    t.text('discord_url')
    t.integer('user_id')
    t.foreign('user_id').references('id').inTable('users')
    t.boolean('is_deleted').default(false)
    t.timestamps()
  })
};

exports.down = async function (knex) {
  let exists = await knex.schema.hasTable('profiles')
  if (!exists) return
  await knex.schema.dropTable('profiles');
};
