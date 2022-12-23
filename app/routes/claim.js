let { claimMedal, getClaims, mergeMedals } = require("../controllers/Claim");

module.exports = (router) => {
  router.get("/", async (req, res) => {
    try {
      var categories = await getClaims(
        req.query,
        req.query.page,
        req.query.perPage
      );
    } catch (error) {
      if (error.statusCode === 500) {
        console.error(error);
      }
      let errResponse = formatResponse({ error }, true);
      let status = errResponse.status || 500;
      delete errResponse.status;
      return res.status(status).json({
        ...errResponse,
      });
    }

    let response = formatResponse(categories);
    let status = response.status || 200;
    delete response.status;

    return res.status(status || 200).json({
      ...response,
    });
  });
  router.post("/", async (req, res) => {
    try {
      var medal = await claimMedal(req.body);
    } catch (error) {
      if (error.statusCode === 500) {
        console.error(error);
      }
      let errResponse = formatResponse({ error }, true);
      let status = errResponse.status || 500;
      delete errResponse.status;
      return res.status(status).json({
        ...errResponse,
      });
    }

    let response = formatResponse(medal);
    let status = response.status || 200;
    delete response.status;

    return res.status(status || 200).json({
      ...response,
    });
  });

  router.post("/merge", async (req, res) => {
    try {
      var medal = await mergeMedals(req.body);
    } catch (error) {
      if (error.statusCode === 500) {
        console.error(error);
      }
      let errResponse = formatResponse({ error }, true);
      let status = errResponse.status || 500;
      delete errResponse.status;
      return res.status(status).json({
        ...errResponse,
      });
    }

    let response = formatResponse(medal);
    let status = response.status || 200;
    delete response.status;

    return res.status(status || 200).json({
      ...response,
    });
  });
  return router;
};

function formatResponse(result, isError = false) {
  if (isError === true) {
    return {
      message: result.error.message.message || result.error.message,
      success: false,
      status: result.error.statusCode,
    };
  }
  return {
    ...result,
    success: true,
    status: 200,
  };
}
