var Model = require("../lib/db");

class Companies extends Model {
  static get tableName() {
    return "companies";
  }

  static get relationMappings() {
    return {
      profile: {
        relation: Model.HasOneRelation,
        modelClass: "Profiles",
        join: {
          from: "companies.profile_id",
          to: "profiles.id",
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
    return ["title"];
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

module.exports = Companies;
