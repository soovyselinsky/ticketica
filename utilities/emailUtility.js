var nodemailer = require('nodemailer');
require('dotenv').config();
const { emailService, emailUser, emailPassword } = process.env;
const { usersDB } = require("../models/authModel");

var transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    // service: emailService,
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPassword
    }
  });


const getUserEmail = async (req, res) => {
  const email = await usersDB.findById(req.decoded.userid, "email");
  return email.email;
}

module.exports = { transporter, getUserEmail };
