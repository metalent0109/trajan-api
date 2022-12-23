/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = function (knex) {
    return Promise.all([
      knex.schema.alterTable("claims", (t) => {
        t.string("txn_id");
      }),
    ]);
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function (knex) {};
  