var Model = require('../lib/db')

class Notifications extends Model {
  static get tableName() {
    return 'notifications'
  }

  static get relationMappings() {
    return {
      medal: {
        relation: Model.HasOneRelation,
        modelClass: 'Medal',
        join: {
          from: 'notifications.reference_id',
          to: 'medals.id'
        }
      },
      recommendation: {
        relation: Model.HasOneRelation,
        modelClass: 'Recommendation',
        join: {
          from: 'notifications.reference_id',
          to: 'recommendations.id'
        }
      },
      senderDetail: {
        relation: Model.HasOneRelation,
        modelClass: "Users",
        join: {
          from: "notifications.sender",
          to: "users.id",
        },
      },
      recipientDetail: {
        relation: Model.HasOneRelation,
        modelClass: "Users",
        join: {
          from: "notifications.recipient",
          to: "users.id",
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

  static getSearchable() {
    return [
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

module.exports = Notifications
