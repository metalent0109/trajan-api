/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = function (knex) {
    return Promise.all([
      knex.schema.alterTable("medals", (t) => {
        t.boolean("is_declined").default(false);
      }),
    ]);
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function (knex) {};
  