const { usersDB } = require("../models/authModel");

const walletBalance = {
  mandatorySavingBalance: "mandatorySavingBalance",
  voluntarySavingBalance: "voluntarySavingBalance",
  targetSavingBalance: "targetSavingBalance",
  vaultSavingBalance: "vaultSavingBalance",
  billBalance: "billBalance"
};

async function fetchUser(req, res) {
  const u = await usersDB.findById(req.decoded.userid, "mandatorySavingBalance voluntarySavingBalance targetSavingBalance vaultSavingBalance billBalance");
  return u;
}

const canTransact = {

  async mandatorySavingBalance(req, res, next) {
    const user = await fetchUser(req, res);
    const diff = user.mandatorySavingBalance - req.body.amount;
    if (diff >= 0) {
      req.decoded.newBalance = diff;
      next();
    } else {
      res.status(401).send("Wallet is too low.");
    }
  },
  async billBalance(req, res, next) {
    const user = await fetchUser(req, res);
    const diff = user.billBalance - req.body.amount;
    if (diff >= 0) {
      req.decoded.newBalance = diff;
      next();
    } else {
      res.status(401).send("Wallet is too low.");
    }
  }
};

module.exports = { canTransact, walletBalance };
