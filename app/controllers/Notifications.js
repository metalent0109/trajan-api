const { Notifications } = require('../models'),
  { transaction } = require('objection'),
  { filterer } = require('../lib/filters');
module.exports = {

  async getNotifications(
    query,
    pageNumber = 0,
    perPage = 20,
  ) {
    return {
      ...(await filterer(query, Notifications, {
        pageNumber,
        perPage,
        related: query.related,
        search: query.search,
        orderBy: query.orderBy || "id"
      })),
      page: pageNumber,
      per_page: perPage
    };
  },

  async getNotification(id, query) {
    if (!id) {
      throw {
        message: 'ID Not Provided',
        statusCode: 400
      }
    }
    let notification = await Notifications.query().findById(id).withGraphFetched(query.related)
    if (!notification) {
      throw {
        message: 'Notification Not Found',
        statusCode: 404
      }
    }
    return notification
  },

  async createNotification(notificationBody, userPermissions = {}) {
    const notification = await transaction(
      Notifications,
      async (Notifications) => {
        var newNotification = await Notifications.query().insert({
          ...notificationBody
        })
        return newNotification
      }
    )
    return notification
  },

  async editNotification(id, newBody) {
    if (!id) {
      throw {
        message: 'ID Not Provided',
        statusCode: 400
      }
    }
    if (newBody.id) delete newBody.id
    let editNotification = await Notifications.query().patchAndFetchById(id, { ...newBody }).withGraphFetched('[medal.category,senderDetail.profile,recipientDetail.profile]')
    if (!editNotification) {
      throw {
        message: 'Notification Not Found',
        statusCode: 404
      }
    }
    return editNotification
  },

  async deleteNotification(id) {
    if (!id) {
      throw {
        message: 'No ID Provided',
        statusCode: 400
      }
    }
    let deletedCount = await Notifications.query().patchAndFetchById(parseInt(id), { is_deleted: true })
    await Promise.all(
      Object.keys(Notifications.getRelations()).map((relation) => {
        return deletedCount.$relatedQuery(relation).unrelate()
      })
    )

    if (deletedCount < 1) {
      throw {
        message: 'Notification Not Found',
        statusCode: 404
      }
    }
    return deletedCount
  }
}
