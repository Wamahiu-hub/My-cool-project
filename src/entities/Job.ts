import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { JobApplication } from "../entities/JobApplication";

@Entity()
export class Job extends BaseEntity {
    @PrimaryGeneratedColumn()
    job_id!: number;

    @Column()
    title!: string;

    @Column()
    company!: string;

    @Column()
    location!: string;

    @Column("text")
    description!: string;

    @Column("text")
    requirements!: string;

    @Column()
    industry!: string;

    @Column()
    employment_type!: string; // full-time, part-time, contract, etc.

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    salary_range_start?: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    salary_range_end?: number;

    @Column({ type: 'text', nullable: true })
    benefits?: string;

    @Column({ type: 'simple-array' })
    required_skills!: string[];

    @Column({ type: 'simple-array', nullable: true })
    preferred_skills?: string[];

    @Column({ nullable: true })
    experience_level?: string;

    @Column({ nullable: true })
    education_requirement?: string;

    @Column({ default: false })
    remote_work_allowed!: boolean;

    @Column({ type: 'jsonb', nullable: true })
    location_details?: {
        city: string;
        state: string;
        country: string;
        postal_code: string;
        is_hybrid: boolean;
    };

    @Column({ type: 'int', default: 0 })
    views_count!: number;

    @Column({ type: 'int', default: 0 })
    applications_count!: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    posted_date!: Date;

    @Column({ type: 'timestamp', nullable: true })
    closing_date?: Date;

    @Column({ type: 'timestamp', nullable: true })
    start_date?: Date;

    @ManyToOne(() => User, user => user.posted_jobs)
    recruiter!: User;

    @OneToMany(() => JobApplication, (application: JobApplication) => application.job)
    applications!: JobApplication[];

    @Column({ default: true })
    is_active!: boolean;

    @Column({ default: false })
    is_featured!: boolean;

    @Column({ type: 'text', nullable: true })
    department?: string;

    @Column({ type: 'text', nullable: true })
    responsibilities!: string;

    @Column({ type: 'jsonb', nullable: true })
    additional_info?: {
        interview_process?: string;
        travel_requirement?: string;
        work_schedule?: string;
        overtime_required?: boolean;
    };

    @Column({ type: 'jsonb', nullable: true })
    metadata?: {
        seo_keywords: string[];
        custom_fields: Record<string, any>;
    };

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at!: Date;

    @Column({ type: 'varchar', nullable: true })
    status!: string; // 'draft', 'published', 'closed', 'archived'
}