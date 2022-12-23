var Model = require("../lib/db");

class Profiles extends Model {
  static get tableName() {
    return "profiles";
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: "Users",
        join: {
          from: "profiles.user_id",
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
    return [
      "github_url",
      "description",
      "discord_url",
      "facebook_link",
      "twitter_link",
      "tagline",
      "website_link",
    ];
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

module.exports = Profiles;
