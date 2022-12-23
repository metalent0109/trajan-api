var Model = require('../lib/db')

class Followers extends Model {
  static get tableName() {
    return 'followers'
  }

  static get relationMappings() {
    return {
      follower: {
        relation: Model.HasOneRelation,
        modelClass: "Profiles",
        join: {
          from: "profiles.user_id",
          to: "followers.follower_id",
        },
      },
      user: {
        relation: Model.HasOneRelation,
        modelClass: "Profiles",
        join: {
          from: "profiles.user_id",
          to: "followers.user_id",
        },
      },
    }
  }

  $beforeUpdate(opt, quetyContext) {
    this.updated_at = new Date().toISOString()
  }

  $beforeInsert() {
    this.updated_at, this.created_at = new Date().toISOString()
  }

  static getRelatedSearchable() {
    return [
      'btc_name',
      'stx_address',
    ]
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: [],
      properties: {
        id: { type: 'integer' },
      }
    }
  }

  static get modelPaths() {
    return [__dirname]
  }
}

module.exports = Followers
