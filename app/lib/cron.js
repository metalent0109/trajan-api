const { Medal } = require("../models"),
  { getTxnStatus } = require("./stacks"),
  _ = require("lodash");
module.exports = {
  listenStactsTxns: async function () {
    // fetch medals txns which are available for claiming
    let medalsTobeClaimed = await Medal.query().where({ claimable: false });
    const txnIds = medalsTobeClaimed.map((txn) => txn.txn_id);
    let transactions = await getTxnStatus(txnIds);
    let successTxns = Object.values(
      _.filter(transactions, (obj) => {
        return obj.found && obj.result.tx_status === "success";
      })
    ).map((txn) => txn.result.tx_id);
    // once txns are completed, update db
    await Medal.query()
      .patch({ claimable: true })
      .whereIn("txn_id", successTxns);
  },
};
module.exports.listenStactsTxns();
