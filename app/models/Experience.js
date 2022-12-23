var Model = require("../lib/db");

class Experience extends Model {
  static get tableName() {
    return "experience";
  }

  static get relationMappings() {
    return {
      profile: {
        relation: Model.HasOneRelation,
        modelClass: "Profiles",
        join: {
          from: "experience.user_id",
          to: "profiles.user_id",
        },
      },
      companyDetails: {
        relation: Model.HasOneRelation,
        modelClass: "Companies",
        join: {
          from: "experience.company",
          to: "companies.id",
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
  }

  static getRelatedSearchable() {
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

module.exports = Experience;
