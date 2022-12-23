let {
  getNftSupporters,
  getNftSupporter,
  createNftSupporter,
  deleteNftSupporter,
  editNftSupporter,
} = require("../controllers/NftSupporters");

module.exports = (router) => {
  router.get("/", async (req, res) => {
    try {
      var nftsupporters = await getNftSupporters(
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

    let response = formatResponse(nftsupporters);
    let status = response.status || 200;
    delete response.status;

    return res.status(status || 200).json({
      ...response,
    });
  });

  router.get("/:id", async (req, res) => {
    try {
      var nftsupporter = await getNftSupporter(req.params.id, req.query);
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

    let response = formatResponse(nftsupporter);
    let status = response.status || 200;
    delete response.status;

    return res.status(status || 200).json({
      ...response,
    });
  });

  router.post("/", async (req, res) => {
    console.log("HERE");
    try {
      var nftsupporter = await createNftSupporter(req.body, req.user);
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

    let response = formatResponse(nftsupporter);
    let status = response.status || 200;
    delete response.status;

    return res.status(status || 200).json({
      ...response,
    });
  });

  router.patch("/:id", async (req, res) => {
    try {
      var nftsupporter = await editNftSupporter(req.params.id, req.body);
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

    let response = formatResponse(nftsupporter);
    let status = response.status || 200;
    delete response.status;

    return res.status(status || 200).json({
      ...response,
    });
  });

  router.delete("/:id", async (req, res) => {
    try {
      var nftsupporter = await deleteNftSupporter(req.params.id);
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

    return res.json(formatResponse(nftsupporter));
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
