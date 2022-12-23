/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = function (knex) {
    return Promise.all([
      knex.schema.alterTable("medals", (t) => {
        t.string("claim_hash");
      }),
    ]);
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function (knex) {};
  