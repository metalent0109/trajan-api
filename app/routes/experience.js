let {
  getExperiences,
  getExperience,
  createExperience,
  editExperience,
  deleteExperience,
} = require('../controllers/Experience')

module.exports = (router) => {

  router.get('/', async (req, res) => {
    try {
      var experiences = await getExperiences(
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

    let response = formatResponse(experiences)
    let status = response.status || 200
    delete response.status

    return res.status(status || 200).json({
      ...response
    })
  })

  router.get('/:id', async (req, res) => {
    try {
      var experience = await getExperience(req.params.id, req.query)
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

    let response = formatResponse(experience)
    let status = response.status || 200
    delete response.status

    return res.status(status || 200).json({
      ...response
    })
  })

  router.post('/', async (req, res) => {
    req.body.user_id = req.experience?.id
    try {
      var experience = await createExperience(req.body)
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

    let response = formatResponse(experience)
    let status = response.status || 200
    delete response.status

    return res.status(status || 200).json({
      ...response
    })
  })

  router.patch('/:id', async (req, res) => {
    try {
      var experience = await editExperience(req.params.id, req.body)
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

    let response = formatResponse(experience)
    let status = response.status || 200
    delete response.status

    return res.status(status || 200).json({
      ...response
    })
  })

  router.delete('/:id', async (req, res) => {
    try {
      var experience = await deleteExperience(req.params.id)
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

    return res.json(formatResponse(experience))
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
