let { NftSupport, Users } = require("../models"),
  { transaction } = require("objection"),
  { filterer } = require("../lib/filters"),
  { createSupport, endSupport, editSupport } = require("../lib/stacks");
const pinataSDK = require("@pinata/sdk");
const pinata = pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_API_SECRET
);
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");

module.exports = {
  async getNftSupports(query = {}, pageNumber = 0, perPage = 20) {
    return {
      ...(await filterer(query, NftSupport, {
        pageNumber,
        perPage,
        related: query.related,
        orderBy: query.orderBy || "id",
      })),
      page: pageNumber,
      per_page: perPage,
    };
  },

  async getNftSupport(id, query) {
    if (!id) {
      throw {
        message: "ID Not Provided",
        statusCode: 400,
      };
    }

    let theNftSupport = await NftSupport.query()
      .findById(id)
      .withGraphFetched(query.related);

    if (!theNftSupport) {
      throw {
        message: "NftSupport Not Found",
        statusCode: 404,
      };
    }

    return theNftSupport;
  },

  async createNftSupport(nftsupportBody, file, user) {
    if (!nftsupportBody.price) {
      throw {
        message: "Price is not provided",
      };
    }
    if (!user.account_id) {
      throw {
        message: "Account is not provided",
      };
    }
    if (!nftsupportBody.title) {
      throw {
        message: "title is not provided",
      };
    }
    if (!nftsupportBody.description) {
      throw {
        message: "description is not provided",
      };
    }
    const options = {
      pinataMetadata: {
        name: "support_meta",
        keyvalues: [],
      },
      pinataOptions: {
        cidVersion: 0,
      },
    };
    let pinFileToIPFS = await pinata
      .pinFileToIPFS(
        fs.createReadStream(path.resolve() + "/uploads/" + file.filename),
        options
      )
      .catch((e) => {
        console.log(e, "ERROR");
        throw {
          message: "Error while creating support",
        };
      })
      .finally(() => {
        const unlinkAsync = promisify(fs.unlink);
        unlinkAsync(file.path);
      });

    let supportInfo = {
      title: nftsupportBody.title,
      description: nftsupportBody.description,
      price: nftsupportBody.price / 100,
      limit: nftsupportBody.limit,
      created_by: user.account_id,
      media: `https://trajanapp.mypinata.cloud/ipfs/${pinFileToIPFS.IpfsHash}`,
    };

    let pinataResponse = await pinata
      .pinJSONToIPFS(supportInfo, options)
      .catch((e) => {
        console.log(e, "ERROR");
        throw {
          message: "Error while creating support",
        };
      });
    let supportTxn = await createSupport({
      price: nftsupportBody.price,
      account_id: user.account_id,
      hash: pinataResponse.IpfsHash,
      limit: nftsupportBody.limit,
    });
    console.log(supportTxn, "supportTxn");
    const nftsupport = await transaction(NftSupport, async (NftSupport) => {
      var newNftSupport = await NftSupport.query().insert({
        title: nftsupportBody.title,
        description: nftsupportBody.description,
        price_in_stx: nftsupportBody.price,
        limit: nftsupportBody.limit,
        support_for: user.id,
        ipfs_hash: pinataResponse.IpfsHash,
        txn_id: supportTxn,
        media: `https://trajanapp.mypinata.cloud/ipfs/${pinFileToIPFS.IpfsHash}`,
      });

      return newNftSupport;
    });

    return nftsupport;
  },

  async endNftSupport(user) {
    if (!user.account_id) {
      throw {
        message: "Account is not provided",
      };
    }
    let supportTxn = await endSupport({
      account_id: user.account_id,
    });
    const nftsupport = await transaction(
      NftSupport,
      Users,
      async (NftSupport, Users) => {
        let userDetail = await Users.query()
          .findOne({ stx_address: user.account_id })
          .withGraphFetched("support");
        let result = await NftSupport.query()
          .patch({ is_deleted: true })
          .where("id", userDetail?.support?.id);
        return result;
      }
    );
    return nftsupport;
  },

  async editNftSupport(newBody, file, user) {
    if (!newBody.id) {
      throw {
        message: "ID Not Provided",
        statusCode: 400,
      };
    }
    let id = newBody.id
    if (newBody.id) {
      delete newBody.id;
      delete newBody.message;
    }
    const support = await NftSupport.query().findById(id);
    if (support.is_deleted) {
      throw {
        message: "Support has already been ended",
      };
    }
    if (!user.account_id) {
      throw {
        message: "Account is not provided",
      };
    }

    const options = {
      pinataMetadata: {
        name: "support_meta",
        keyvalues: [],
      },
      pinataOptions: {
        cidVersion: 0,
      },
    };
    let pinFileToIPFS;
    if (file) {
      pinFileToIPFS = await pinata
        .pinFileToIPFS(
          fs.createReadStream(path.resolve() + "/uploads/" + file.filename),
          options
        )
        .catch((e) => {
          console.log(e, "ERROR");
          throw {
            message: "Error while creating support",
          };
        })
        .finally(() => {
          const unlinkAsync = promisify(fs.unlink);
          unlinkAsync(file.path);
        });
    }
    let body = {
      price: newBody.price || support.body,
      title: newBody.title || support.title,
      description: newBody.description || support.description,
      price_in_stx: newBody.price || support.price_in_stx,
    };
    let supportInfo = {
      title: newBody.title || support.title,
      description: newBody.description || support.description,
      price: newBody.price / 100 || support.price_in_stx,
      limit: newBody.limit || support.limit,
      created_by: user.account_id,
      media: pinFileToIPFS
        ? `https://trajanapp.mypinata.cloud/ipfs/${pinFileToIPFS.IpfsHash}`
        : support.media,
    };

    let pinataResponse = await pinata
      .pinJSONToIPFS(supportInfo, options)
      .catch((e) => {
        console.log(e, "ERROR");
        throw {
          message: "Error while creating support",
        };
      });
    let supportTxn = await editSupport({
      "old-hash": support.ipfs_hash,
      "new-hash": pinataResponse.IpfsHash,
    });
    const nftsupport = await transaction(NftSupport, async (NftSupport) => {
      var newNftSupport = await NftSupport.query().patchAndFetchById(id, {
        title: newBody.title || support.title,
        description: newBody.description || support.description,
        price_in_stx: newBody.price || support.price_in_stx,
        limit: newBody.limit || support.limit,
        media: pinFileToIPFS
          ? `https://trajanapp.mypinata.cloud/ipfs/${pinFileToIPFS.IpfsHash}`
          : support.media,
        ipfs_hash: pinataResponse.IpfsHash,
        txn_id: supportTxn,
      });

      return newNftSupport;
    });

    return nftsupport;
  },

  async deleteNftSupport(id) {
    if (!id) {
      throw {
        message: "No ID Provided",
        statusCode: 400,
      };
    }

    let deletedCount = await NftSupport.query().patchAndFetchById(id, {
      is_deleted: true,
    });
    await Promise.all(
      Object.keys(NftSupport.getRelations()).map((relation) => {
        return deletedCount.$relatedQuery(relation).unrelate();
      })
    );

    if (deletedCount < 1) {
      throw {
        message: "NftSupport Not Found",
        statusCode: 404,
      };
    }

    return deletedCount;
  },
};
