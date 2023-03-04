function isRestricted(req, res, next) {

    if (req.decodedUserDetails.emailVerified == false) {
        res.json({
            success: false,
            message: "Restricted, confirm your email address."
        });
    }
    // else if (req.decodedUserDetails.suspended == true) {
    //     res.json({
    //         success: false,
    //         message: "You have been suspended."
    //     });
    // }
    else {
        next();
    }
   
    // register.findById(req.decoded.id, 'status', (err, user) => {
        
        
    // });
}

module.exports = { isRestricted };
