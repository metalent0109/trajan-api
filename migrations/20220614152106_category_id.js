/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = function (knex) {
    return Promise.all([
      knex.schema.alterTable("medals", (t) => {
        t.integer("category_id");
        t.foreign('category_id').references('id').inTable('categories')
      }),
    ]);
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function (knex) {};
  