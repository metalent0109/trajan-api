var Model = require("../lib/db");

class Medal extends Model {
  static get tableName() {
    return "medals";
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: "Users",
        join: {
          from: "medals.user_id",
          to: "users.id",
        },
      },
      category: {
        relation: Model.BelongsToOneRelation,
        modelClass: "Categories",
        join: {
          from: "medals.category_id",
          to: "categories.id",
        },
      },
      recepient: {
        relation: Model.BelongsToOneRelation,
        modelClass: "Users",
        join: {
          from: "medals.recipient_wallet_id",
          to: "users.stx_address",
        },
      },
    };
  }

  $beforeUpdate(opt, quetyContext) {
    this.updated_at = new Date().toISOString();
  }

  $beforeInsert() {
    this.updated_at, (this.created_at = new Date().toISOString());
  }

  static getSearchable() {
    return [];
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: [],
      properties: {
        id: { type: "integer" },
      },
    };
  }

  static get modelPaths() {
    return [__dirname];
  }
}

module.exports = Medal;
