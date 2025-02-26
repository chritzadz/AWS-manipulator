import jwt from 'jsonwebtoken';

const SECRET_JWT_KEY = process.env.JWT_SECRET;

export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return { valid: false, message: "Unauthorized access" };
    }
    try {
        jwt.verify(token, SECRET_JWT_KEY);
        next();
    } catch (err) {
        return { valid: false, message: "Invalid token" };
    }
};