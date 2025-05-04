// const jwt = require("jsonwebtoken");

// // Middleware to verify JWT token
// const verifyToken = (req, res, next) => {
//     const token = req.headers['authorization'];
//     if (!token) return res.status(401).json({ message: 'No token provided' });

//     jwt.verify(token, 'secretkey', (err, decoded) => {
//         if (err) return res.status(500).json({ message: 'Failed to authenticate token' });
//         req.userId = decoded.id;
//         next();
//     });
// };

// module.exports = verifyToken;

const jwt = require("jsonwebtoken");
const { to } = require("../server");

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader)
      return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1]; // Extract the token part from the "Bearer <token>" format
    if (!token) return res.status(401).json({ message: "No token provided" });

    jwt.verify(token, "secretkey", (err, decoded) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Failed to authenticate token" });
      req.user = decoded;
      next();
    });
  } catch (error) {
    res.status(401).json({ msg: "invalid token" });
  }
};

module.exports = verifyToken;
