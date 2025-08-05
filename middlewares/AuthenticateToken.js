const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
    if (!token) return res.status(401).json({ message: 'Access token missing' });
    console.log('token', token)
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        console.log('error', err)
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = user; // user object from token payload (e.g. id and role)
        next();
    });
};

module.exports = authenticateToken;
