let {
  getMedalLevels,
  getMedalLevel,
  createMedalLevel,
  editMedalLevel,
  deleteMedalLevel,
} = require('../controllers/MedalLevels')

module.exports = (router) => {

  router.get('/', async (req, res) => {
    try {
      var medalLevels = await getMedalLevels(
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

    let response = formatResponse(medalLevels)
    let status = response.status || 200
    delete response.status

    return res.status(status || 200).json({
      ...response
    })
  })

  router.get('/:id', async (req, res) => {
    try {
      var medalLevel = await getMedalLevel(req.params.id, req.query)
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

    let response = formatResponse(medalLevel)
    let status = response.status || 200
    delete response.status

    return res.status(status || 200).json({
      ...response
    })
  })

  router.post('/', async (req, res) => {
    req.body.user_id = req.medalLevel?.id
    try {
      var medalLevel = await createMedalLevel(req.body)
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

    let response = formatResponse(medalLevel)
    let status = response.status || 200
    delete response.status

    return res.status(status || 200).json({
      ...response
    })
  })

  router.patch('/:id', async (req, res) => {
    try {
      var medalLevel = await editMedalLevel(req.params.id, req.body)
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

    let response = formatResponse(medalLevel)
    let status = response.status || 200
    delete response.status

    return res.status(status || 200).json({
      ...response
    })
  })

  router.delete('/:id', async (req, res) => {
    try {
      var medalLevel = await deleteMedalLevel(req.params.id)
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

    return res.json(formatResponse(medalLevel))
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
