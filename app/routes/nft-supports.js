let {
  getNftSupports,
  getNftSupport,
  createNftSupport,
  deleteNftSupport,
  editNftSupport,
  endNftSupport,
} = require("../controllers/NftSupports");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

module.exports = (router) => {
  router.get("/", async (req, res) => {
    try {
      var nftsupports = await getNftSupports(
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

    let response = formatResponse(nftsupports);
    let status = response.status || 200;
    delete response.status;

    return res.status(status || 200).json({
      ...response,
    });
  });

  router.get("/:id", async (req, res) => {
    try {
      var nftsupport = await getNftSupport(req.params.id, req.query);
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

    let response = formatResponse(nftsupport);
    let status = response.status || 200;
    delete response.status;

    return res.status(status || 200).json({
      ...response,
    });
  });

  router.post("/", upload.single("nft_file"), async (req, res) => {
    try {
      var nftsupport = await createNftSupport(req.body, req.file, req.user);
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

    let response = formatResponse(nftsupport);
    let status = response.status || 200;
    delete response.status;

    return res.status(status || 200).json({
      ...response,
    });
  });

  router.post("/end-support", async (req, res) => {
    try {
      var nftsupport = await endNftSupport(req.user);
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

    let response = formatResponse(nftsupport);
    let status = response.status || 200;
    delete response.status;

    return res.status(status || 200).json({
      ...response,
    });
  });

  router.patch("/", upload.single("nft_file"), async (req, res) => {
    try {
      var nftsupport = await editNftSupport(
        req.body,
        req.file,
        req.user
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

    let response = formatResponse(nftsupport);
    let status = response.status || 200;
    delete response.status;

    return res.status(status || 200).json({
      ...response,
    });
  });

  router.delete("/:id", async (req, res) => {
    try {
      var nftsupport = await deleteNftSupport(req.params.id);
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

    return res.json(formatResponse(nftsupport));
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
