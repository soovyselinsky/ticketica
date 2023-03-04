const { genUID } = require("../utilities/generateUniqueIDentifier");
const { usersDB } = require("../models/authModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { encrypt, decrypt } = require("../utilities/cryptoUtility");
require("dotenv").config();
const { transporter } = require("../utilities/emailUtility");
const secretKey = process.env.secretKey;
const cryptoKey = process.env.cryptoKey;


async function sendTheMail(options) {
  try {
    await transporter.sendMail(options);
  } catch (error) {
    console.log("An error occoured while trying to send the mail.");
  }
}

async function register(req, res) {
  const { email, password, firstName, lastName, country, zipCode } =
    req.body;

  if (
    email &&
    password.length >= 6 &&
    firstName &&
    lastName &&
    country &&
    zipCode
  ) {
    // let randomid = Math.floor(Math.random() * 1000000);

    // req.body.role = "user";
    // req.body.emailVerified = false;
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);
    req.body.password = hashedPassword;
    try {
      await usersDB.create(req.body);
    } catch (error) {
      console.log(error);
      if (error.name == "MongoServerError") {
        res.status(400).json({ message: "Username or email already exists" });
      } else {
        res.status(400).json({ message: "An error occurred" });
      }
      return;
    }

    // let ciphertext = encrypt(req.body.uniqueid);

    // var mailOptions = {
    //   from: "Ubuntu Coperative",
    //   to: email,
    //   subject: `Ubuntu Coperative - Email Verification`,
    //   html: `
    //       <div style="padding: 20px">
    //           <h1 style="background-color: blue; white: color: white;">Click here to verify your email</h1>
    //           Link to verify: ${process.env.frontendUrl}/verify-email/${ciphertext.iv}.${ciphertext.content}

    //             <div>
    //             <a href="${process.env.frontendUrl}/verify-email/${ciphertext.iv}.${ciphertext.content}">Verify</a>
    //             </div>
    //           <style>
    //                 div, a {
    //                   padding: 20px 10px;
    //                 }
    //           </style>
    //       </div>
    //       `,
    // };

    // try {
    //   await transporter.sendMail(mailOptions);
    // } catch (error) {
    //   console.log(error);
    //   console.log("Can't send emails.");
    // }

    res.status(201).json({
      message: "New User Created",
    });
  } else {
    res.status(400).json({ message: "Incomplete details" });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await usersDB.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "No user found!" });
  } else {

    // if(user.emailVerified == false) {
    //   res.status(400).json({ message: "Kindly verify your email" });
    //   return;
    // }

    const passwordsMatch = bcrypt.compareSync(password, user.password);

    if (passwordsMatch) {
      const payload = {
        userid: user._id,
        email: user.email,
        role: user.role,
      };
      const token = jwt.sign(payload, secretKey);

      res.json({
        token,
        tokentype: "Bearer",
        role: user.role
      });
    } else {
      res.status(400).json({ message: "Invalid details." });
    }
  }
}

async function recoverPassword(req, res) {
  const { email } = req.body;
  
  const user = await usersDB.findOne({ email }, "uniqueid");

  if (!user) {
    res.status(404).send("No user associated with this email");
  } else {

    let ciphertext = encrypt(user.uniqueid);

    var mailOptions = {
      from: "Ubuntu Coperative",
      to: email,
      subject: `Ubuntu Coperative - Password Recovery`,
      html: `
           <div style="padding: 20px">
               <h1 style="background-color: blue; white: color: white;">Click here to verify your email</h1>
               Link to verify: ${process.env.frontendUrl}/resetpassword/${ciphertext.iv}.${ciphertext.content}

                 <div>
                 <a href="${process.env.frontendUrl}/resetpassword/${ciphertext.iv}.${ciphertext.content}">Verify</a>
                 </div>
               <style>
                     div, a {
                       padding: 20px 10px;
                     }
               </style>
           </div>
           `,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.send("Recovery email sent!");
    } catch (error) {
      res.status(400).send("Can't send emails.");
    }

  }
}

async function changePassword(req, res) {
  const { newPassword, cpToken } = req.body;

  console.log(req.body);

  try {

    const splittedToken = cpToken.split(".");

    let uniqueid = decrypt({iv: splittedToken[0], content: splittedToken[1]});

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    await usersDB.findOneAndUpdate(
      { uniqueid },
      {
        password: hashedPassword,
      }
    );

    res.send("Password changed successfully!");
  } catch (error) {
    res.status(400).send("Something went wrong.");
  }
}

async function verifyEmail(req, res) {
  const { veToken } = req.body;

  let spToken = veToken.split(".");

  let id = decrypt({iv: spToken[0], content: spToken[1]});

  try {
    await usersDB.findOneAndUpdate(
      { uniqueid: id },
      {
        emailVerified: true,
      }
    );

    res.json({ message: "Verification Successful" });
  } catch (error) {
    res.status(400).json({ message: "Coudn't verify email" });
    return;
  }
}

async function checkIfLoggedIn(req, res) {
  const {accesstoken} = req.body;
  const token = accesstoken.split(" ")[1];
  const details = jwt.verify(token, secretKey);
  const user = await usersDB.findById(details.userid, "emailVerified role");

  // console.log(user);

  if(user) {
    res.send(user);
  } else {
    res.status(404).send("User not found");
  }
}

async function resendverificationemail(req, res) {
  const { username } = req.body;

  try {

    const user = await usersDB.findOne({username}, "email uniqueid");

    let ciphertext = encrypt(user.uniqueid);

    var mailOptions = {
      from: "Ubuntu Coperative",
      to: user.email,
      subject: `Ubuntu Coperative - Email Verification`,
      html: `
          <div style="padding: 20px">
              <h1 style="background-color: blue; white: color: white;">Click here to verify your email</h1>
              Link to verify: ${process.env.frontendUrl}/verify-email/${ciphertext.iv}.${ciphertext.content}

                <div>
                <a href="${process.env.frontendUrl}/verify-email/${ciphertext.iv}.${ciphertext.content}">Verify</a>
                </div>
              <style>
                    div, a {
                      padding: 20px 10px;
                    }
              </style>
          </div>
          `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.log(error);
      console.log("Can't send emails.");
    }

    res.json({
      message: "Resend verification email sent!",
    });
    
  } catch (error) {
    
  }


}

module.exports = {
  register,
  login,
  recoverPassword,
  verifyEmail,
  changePassword,
  checkIfLoggedIn,
  resendverificationemail
};
