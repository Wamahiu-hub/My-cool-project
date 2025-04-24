import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

export const generateToken = (userId: number, role: string) => {
    const jwt_secret = process.env.JWT_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

    if (!jwt_secret || !refreshSecret) {
        throw new Error('JWT_SECRET or REFRESH_TOKEN_SECRET not found in environment variables');
    }

    try {
        // Generate access token
        const accessToken = jwt.sign({ userId, role }, jwt_secret, { expiresIn: '1d' });

        // Generate refresh token
        const refreshToken = jwt.sign({ userId, role }, refreshSecret, { expiresIn: '30d' });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error('Error generating JWT:', error);
        throw new Error('Error generating JWT');
    }
};