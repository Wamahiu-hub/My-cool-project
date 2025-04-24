import { Request } from "express";

/**
 * User type defining structure of a user record in PostgreSQL
 * Since these timestamps are mostly used for database records but are not critical for authentication, we can make them optional in our User type.
 */
export interface User {
    user_id: string;
    name: string;
    email: string;
    password?: string; // Exclude password when returning user info
    role_id: number;
    role_name: string;
    created_at?: Date;
    updated_at?: Date;
    cv?: string; // URL or file path to the CV
    skills?: string[]; // Array of skills (e.g., ["JavaScript", "React"])
}

/**
 * Custom Express Request Type to include `user` object
 */

export interface Job {
    job_id: number;
    title: string;
    company: string;
    description: string;
    required_skills: string[];
    recruiter: {
        user_id: number;
        name?: string;
        email?: string;
    };
    posted_date: Date;
    is_active: boolean;
}



export interface UserRequest extends Request {
    user?: User;
    job?: Job;
}
