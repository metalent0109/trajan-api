var Model = require("../lib/db");

class Recommendation extends Model {
  static get tableName() {
    return "recommendations";
  }

  static get relationMappings() {
    return {
      senderProfile: {
        relation: Model.BelongsToOneRelation,
        modelClass: "Profiles",
        join: {
          from: "recommendations.sender",
          to: "profiles.user_id",
        },
      },
      recipientProfile: {
        relation: Model.BelongsToOneRelation,
        modelClass: "Profiles",
        join: {
          from: "recommendations.recipient",
          to: "profiles.user_id",
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
    return ["recommendation"];
  }

  static getRelatedSearchable() {
    return ["btc_name", "stx_address"];
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

module.exports = Recommendation;
