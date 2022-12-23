
exports.up = async function (knex) {
  await knex.schema.renameTable('blogs', 'posts')
};

exports.down = async function (knex) {
  await knex.schema.renameTable('posts', 'blogs')
};
