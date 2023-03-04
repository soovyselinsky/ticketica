const theroles = {
  user: "user",
  admin: "admin"
};

const hasAccess = {
  admin(req, res, next) {
    console.log("Here");
    if (req.decoded.role == theroles.admin) {
      next();
    } else {
      res.status(401).json({
        success: false,
        message: "Not Authorized.",
      });
    }
  },
  user(req, res, next) {
    if (req.decoded.role == theroles.user) {
      next();
    } else {
      res.status(401).json({
        success: false,
        message: "Not Authorized.",
      });
    }
  }
};

module.exports = { hasAccess, theroles };
