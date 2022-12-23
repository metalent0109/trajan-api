var Model = require("../lib/db");

class Claim extends Model {
  static get tableName() {
    return "claims";
  }

  static get relationMappings() {
    return {
      medal: {
        relation: Model.BelongsToOneRelation,
        modelClass: "Medal",
        join: {
          from: "claims.medal_id",
          to: "medals.id",
        },
      },
      category: {
        relation: Model.BelongsToOneRelation,
        modelClass: "Categories",
        join: {
          from: "claims.category_id",
          to: "categories.id",
        },
      },
      medalLevel: {
        relation: Model.BelongsToOneRelation,
        modelClass: "MedalLevels",
        join: {
          from: "claims.medal_level",
          to: "medal_levels.id",
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

module.exports = Claim;
