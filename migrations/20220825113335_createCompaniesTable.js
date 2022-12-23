/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  let exists = await knex.schema.hasTable('companies')
  if (exists) return
  return knex.schema.createTable('companies', (t) => {
    t.increments().primary()
    t.integer('profile_id')
    t.foreign('profile_id').references('id').inTable('profiles')
    t.string("title")
    t.boolean('is_deleted').default(false)
    t.timestamps()
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  let exists = await knex.schema.hasTable('companies')
  if (!exists) return
  await knex.schema.dropTable('companies');
};
