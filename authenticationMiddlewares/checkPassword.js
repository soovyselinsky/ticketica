const bcrypt = require("bcryptjs");
var { usersDB } = require("../models/authModel");
require("dotenv").config();

async function checkPassword (req, res, next) {
    const { password } = req.body;

    const storedPassword = await usersDB.findById(req.decoded.userid, "password");

    const passwordsMatch = bcrypt.compareSync(password, storedPassword.password);

    if(passwordsMatch) {
        next();
    } else {
        res.status(400).send("Incorrect password!");
    }
}

module.exports = {
    checkPassword
};
