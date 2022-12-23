var Model = require("../lib/db");

class NftSupporter extends Model {
  static get tableName() {
    return "nft_supporters";
  }

  static get relationMappings() {
    return {
      supportedBy: {
        relation: Model.BelongsToOneRelation,
        modelClass: "Users",
        join: {
          from: "nft_supporters.supported_by",
          to: "users.id",
        },
      },
      support: {
        relation: Model.BelongsToOneRelation,
        modelClass: "NftSupport",
        join: {
          from: "nft_supporters.support_id",
          to: "nft_supports.id",
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

module.exports = NftSupporter;
