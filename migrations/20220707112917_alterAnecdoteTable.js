
exports.up = async function (knex) {
  await knex.schema.renameTable('anecdote', 'recommendations')
  await knex.schema.alterTable('recommendations', table => {
    table.renameColumn('anecdote', 'recommendation');
  })
};

exports.down = async function (knex) {
  await knex.schema.renameTable('recommendations', 'anecdote')
  await knex.schema.alterTable('anecdote', table => {
    table.renameColumn('recommendation', 'anecdote');
  })
};
