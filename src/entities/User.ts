import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./Role";
import { Job } from "./Job";
import { JobApplication } from "./JobApplication";

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    user_id!: number;

    @Column()
    full_name!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    @Column({ nullable: true })
    mobile_number?: string;

    @Column("simple-array", { nullable: true })
    skills?: string[];

    @Column({ nullable: true })
    experience_years?: number;

    @Column({ nullable: true })
    address?: string;

    @Column({ nullable: true })
    city?: string;

    @Column({ nullable: true })
    state?: string;

    @Column({ nullable: true })
    country?: string;

    @Column({ nullable: true })
    postal_code?: string;

    @Column({ nullable: true })
    preferred_language?: string;

    @Column({ nullable: true })
    cv_url?: string;

    @Column({ nullable: true })
    profile_image?: string;

    @Column({ type: 'date', nullable: true })
    date_of_birth?: Date;

    @Column({ nullable: true })
    current_position?: string;

    @Column({ nullable: true })
    current_company?: string;

    @Column({ nullable: true })
    linkedin_url?: string;

    @Column({ nullable: true })
    portfolio_url?: string;

    @Column("simple-array", { nullable: true })
    certifications?: string[];

    @Column("simple-array", { nullable: true })
    education?: string[];

    @Column({ type: 'text', nullable: true })
    bio?: string;

    @Column({ type: 'jsonb', nullable: true })
    preferences?: {
        job_types?: string[];
        desired_salary_range?: {
            min: number;
            max: number;
        };
        preferred_locations?: string[];
        remote_work?: boolean;
        notification_settings?: {
            email: boolean;
            sms: boolean;
            push: boolean;
        };
    };

    @Column({ nullable: true })
    last_login?: Date;

    @Column({ nullable: true })
    password_reset_token?: string;

    @Column({ nullable: true })
    password_reset_expires?: Date;

    @Column({ default: false })
    email_verified!: boolean;

    @Column({ nullable: true })
    email_verification_token?: string;

    @ManyToOne(() => Role, role => role.users)
    role!: Role;

    @OneToMany(() => Job, job => job.recruiter)
    posted_jobs!: Job[];

    @OneToMany(() => JobApplication, application => application.applicant)
    applications!: JobApplication[];

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at!: Date;

    @Column({ default: true })
    is_active!: boolean;

    @Column({ type: 'jsonb', nullable: true })
    social_profiles?: {
        github?: string;
        twitter?: string;
        facebook?: string;
        instagram?: string;
    };

    @Column({ default: false })
    is_featured!: boolean;

    @Column({ type: 'text', nullable: true })
    account_status?: string; // 'active', 'suspended', 'pending'
}