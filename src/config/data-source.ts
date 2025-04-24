
import dotenv from 'dotenv'
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Role } from '../entities/Role';
import { Job } from '../entities/Job';
import { JobApplication } from '../entities/JobApplication';
import { Interviews } from '../entities/Interviews';

dotenv.config();
export const AppDataSource = new DataSource(
  {
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: false,
    ssl: {
      rejectUnauthorized: false
    },
    entities: [User, Role,Job,JobApplication,Interviews]
  }
);