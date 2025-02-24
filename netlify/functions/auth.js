import jwt from 'jsonwebtoken';

const SECRET_JWT_KEY = process.env.JWT_SECRET;

export const verifyToken = (event) => {
    const token = event.headers.authorization;
    if (!token) {
        return { valid: false, message: "Unauthorized access" };
    }
    try {
        jwt.verify(token, SECRET_JWT_KEY);
        return { valid: true };
    } catch (err) {
        return { valid: false, message: "Invalid token" };
    }
};