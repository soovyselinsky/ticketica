var express = require('express');
var router = express.Router();

const {
    register,
    login,
    verifyEmail,
    changePassword,
    recoverPassword,
    checkIfLoggedIn,
    resendverificationemail
} = require("../../v1controllers/authController");

const { checkPassword } = require("../../v1controllers/confirmPasswordController");

router.post("/register", register);
router.post("/login", login);
router.post("/recover-password", recoverPassword);
router.post("/change-password", changePassword);
router.post("/verify-email", verifyEmail);
router.post("/checkifloggedin", checkIfLoggedIn);
router.post("/checkpassword", checkPassword);
router.post("/resendverificationemail", resendverificationemail);

module.exports = router;