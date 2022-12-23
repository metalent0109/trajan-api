var Model = require("../lib/db");

class NftSupport extends Model {
  static get tableName() {
    return "nft_supports";
  }

  static get relationMappings() {
    return {
      supportFor: {
        relation: Model.BelongsToOneRelation,
        modelClass: "Users",
        join: {
          from: "nft_supports.support_for",
          to: "users.id",
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

module.exports = NftSupport;
