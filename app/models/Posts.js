var Model = require('../lib/db')

class Posts extends Model {
  static get tableName() {
    return 'posts'
  }

  static get relationMappings() {
    return {
      author: {
        relation: Model.HasOneRelation,
        modelClass: "Users",
        join: {
          from: "posts.owner",
          to: "users.id",
        },
      }
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
      'title',
    ];
  }

  // static getRelatedSearchable() {
  //   return [
  //     'btc_name',
  //     'stx_address',
  //   ]
  // }

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

module.exports = Posts
