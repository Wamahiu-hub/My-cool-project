import { Response } from "express";
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

dotenv.config()

//Debugging  - check if env var are loaded correctly  
console.log("JWT_SECRET: ", process.env.JWT_SECRET )
console.log("REFRESH_TOKEN_SECRET: ", process.env.REFRESH_TOKEN_SECRET )

export const generateToken = (userId: number, userEmail: string, userRole: string): string => {
    return jwt.sign(
        { id: userId, email: userEmail, role: userRole },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: process.env.JWT_EXPIRES_IN ? parseInt(process.env.JWT_EXPIRES_IN, 10) : '30d' }
    );
};