let {
  getPosts,
  getPost,
  createPost,
  editPost,
  deletePost,
} = require('../controllers/Posts')

module.exports = (router) => {

  router.get('/', async (req, res) => {
    try {
      var posts = await getPosts(
        req.query,
        req.query.page,
        req.query.perPage,
      )
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

    let response = formatResponse(posts)
    let status = response.status || 200
    delete response.status

    return res.status(status || 200).json({
      ...response
    })
  })

  router.get('/:id', async (req, res) => {
    try {
      var post = await getPost(req.params.id, req.query)
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

    let response = formatResponse(post)
    let status = response.status || 200
    delete response.status

    return res.status(status || 200).json({
      ...response
    })
  })

  router.post('/', async (req, res) => {
    req.body.user_id = req.post?.id
    try {
      var post = await createPost(req.body)
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

    let response = formatResponse(post)
    let status = response.status || 200
    delete response.status

    return res.status(status || 200).json({
      ...response
    })
  })

  router.patch('/:id', async (req, res) => {
    try {
      var post = await editPost(req.params.id, req.body)
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

    let response = formatResponse(post)
    let status = response.status || 200
    delete response.status

    return res.status(status || 200).json({
      ...response
    })
  })

  router.delete('/:id', async (req, res) => {
    try {
      var post = await deletePost(req.params.id)
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

    return res.json(formatResponse(post))
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
