const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { usersDB } = require("../models/authModel");
const secretKey = process.env.secretKey;

async function checkPassword (req, res) {

    const {accesstoken, cablePurchasePassword} = req.body;

  const token = accesstoken.split(" ")[1];
  const details = jwt.verify(token, secretKey);
  const user = await usersDB.findById(details.userid, "password");

    const storedPassword = user.password;

    const passwordsMatch = bcrypt.compareSync(cablePurchasePassword, storedPassword);

    if(passwordsMatch) {
        res.send("Passwords match!");
    } else {
        res.status(400).send("Incorrect password!");
    }
}

module.exports = {
    checkPassword
}