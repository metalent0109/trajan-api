var Model = require("../lib/db");

class Users extends Model {
  static get tableName() {
    return "users";
  }

  static get relationMappings() {
    return {
      profile: {
        relation: Model.HasOneRelation,
        modelClass: "Profiles",
        join: {
          from: "users.id",
          to: "profiles.user_id",
        },
      },
      support: {
        relation: Model.HasOneRelation,
        modelClass: "NftSupport",
        filter: (query) => query.where("is_deleted", false),
        join: {
          from: "users.id",
          to: "nft_supports.support_for",
        },
      },
      supporters: {
        relation: Model.HasManyRelation,
        modelClass: "NftSupporter",
        join: {
          from: "users.id",
          to: "nft_supporters.supported_by",
        },
      },
      medalClaims: {
        relation: Model.HasManyRelation,
        modelClass: "Claim",
        join: {
          from: "users.id",
          to: "claims.user_id",
        },
      },
      medalsGiven: {
        relation: Model.HasManyRelation,
        modelClass: "Medal",
        join: {
          from: "users.id",
          to: "medals.user_id",
        },
      },
      recommendationsGiven: {
        relation: Model.HasManyRelation,
        modelClass: "Recommendation",
        filter: (query) => query.orderBy("created_at", 'desc'),
        join: {
          from: "users.id",
          to: "recommendations.sender",
        },
      },
      recommendationsReceived: {
        relation: Model.HasManyRelation,
        modelClass: "Recommendation",
        filter: (query) => query.orderBy("created_at", 'desc'),
        join: {
          from: "users.id",
          to: "recommendations.recipient",
        },
      },
      followed: {
        relation: Model.HasManyRelation,
        modelClass: "Followers",
        filter: (query) => query.where("is_deleted", false),
        join: {
          from: "followers.user_id",
          to: "users.id",
        },
      },
      experience: {
        relation: Model.HasManyRelation,
        modelClass: "Experience",
        filter: (query) => query.where("is_deleted", false).orderBy("created_at", 'desc'),
        join: {
          from: "experience.user_id",
          to: "users.id",
        },
      }
    };
  }

  $beforeUpdate(opt, quetyContext) {
    this.updated_at = new Date().toISOString();
  }

  $beforeInsert() {
    this.updated_at, (this.created_at = new Date().toISOString());
  }

  static getSearchable() {
    return ["btc_name", "stx_address"];
  }

  static getRelatedSearchable() {
    return ["description", "tagline", "discord_username", "display_name"];
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

module.exports = Users;
