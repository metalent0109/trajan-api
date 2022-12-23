let {
  getUsersName,
  getUsersFollowing,
  getPostsFromUserId,
  getMedalFromUserId,
  getRecommendationFromUserId,
} = require('../controllers/Feed')

module.exports = (router) => {
  router.get('/:id', async (req, res) => {
    try {
      var usersFollowing = await getUsersFollowing(req.params.id, req.query)
      var userIds = Object.keys(usersFollowing).map((key) => usersFollowing[key].follower_id)

      var userNames = await getUsersName(userIds, req.query)
      var posts = await getPostsFromUserId(userIds, req.query)
      var medals = await getMedalFromUserId(userIds, req.query)
      var recommends = await getRecommendationFromUserId(userIds, req.query)

      var userNamesObj = {} 
      for (key in userNames) {
        userNamesObj[userNames[key].user_id] = userNames[key].display_name
      }

      var result = []
      for (key in posts){
        var element = {}
        var post = posts[key]
        element.id = post.id
        element.type = "post"
        element.user = userNamesObj[post.owner]
        element.details = post.content
        element.date = post.created_at
        result[result.length] = element
      }

      for (key in medals){
        var element = {}
        var medal = medals[key]
        element.id = medal.id
        element.type = "medal_sent"
        element.user = userNamesObj[medal.user_id]
        element.details = medal.description
        element.date = post.created_at
        result[result.length] = element
      }

      for (key in recommends){
        var element = {}
        var recommend = recommends[key]
        element.id = recommend.id
        element.type = "recommendation_sent"
        element.user = userNamesObj[recommend.sender]
        element.details = recommend.recommendation
        element.date = recommend.created_at
        result[result.length] = element
      }
      result.sort((a, b) => b.date - a.date)
      var count = Math.min(result.length, 20)
      result = result.slice(0, count)

      var result_real = {}
      result_real["results"] = result
      
    } catch (error) {
      if (error.statusCode === 500) {
        console.error(error)
      }
      let errResponse = formatResponse({ error }, true)
      let status = errResponse.status || 500
      delete errResponse.status
      return res.status(status).json({
        ...errResponse
      })
    }

    let response = formatResponse(result)
    let status = response.status || 200
    delete response.status

    return res.status(status || 200).json({
      ...result_real
    })
  })
  return router
}

function formatResponse(result, isError = false) {
  if (isError === true) {
    return {
      message: result.error.message.message || result.error.message,
      success: false,
      status: result.error.statusCode
    }
  }
  return {
    ...result,
    success: true,
    status: 200
  }
}
