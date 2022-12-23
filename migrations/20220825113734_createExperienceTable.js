/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  let exists = await knex.schema.hasTable('experience')
  if (exists) return
  return knex.schema.createTable('experience', (t) => {
    t.increments().primary()
    t.integer('user_id')
    t.foreign('user_id').references('id').inTable('users')
    t.string("position")
    t.text("responsibility")
    t.string("tagline")
    t.string("employment_type")
    t.integer('company')
    t.foreign('company').references('id').inTable('companies')
    t.date("job_start_date")
    t.date("job_end_date")
    t.boolean('is_present').default(false)
    t.boolean('is_deleted').default(false)
    t.timestamps()
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  let exists = await knex.schema.hasTable('experience')
  if (!exists) return
  await knex.schema.dropTable('experience');
};
