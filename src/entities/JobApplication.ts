import { BaseEntity, Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Job } from "./Job";
import { Interview } from "../entities/Interview";

@Entity()
export class JobApplication extends BaseEntity {
    @PrimaryGeneratedColumn()
    application_id!: number;
    @ManyToOne(() => User, user => user.applications)
    applicant!: User;
    additional_comments?: string;
    answers_to_questions: Record<string, any> = {};

    @ManyToOne(() => User, user => user.applications)

    @ManyToOne(() => Job, job => job.applications)
    job!: Job;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    application_date!: Date;

    @Column("text")
    cover_letter!: string;

    @Column()
    cv_url!: string;

    @Column({ type: 'simple-array', nullable: true })
    additional_documents?: string[];

    @Column()
    experience!: string;

    @Column("simple-array", { nullable: true })
    skills!: string[];

    @Column({
        type: 'enum',
        enum: ['pending', 'shortlisted', 'rejected', 'interviewed', 'hired', 'withdrawn', 'pending_iteration', 'iteration_requested', 'iteration_submitted'],
        default: 'pending'
    })
    status!: string;

    @Column({ type: 'int', default: 0 })
    iteration_count!: number;

    @Column({ type: 'jsonb', nullable: true })
    iterations?: {
        version: number;
        feedback: string;
        submitted_at: Date;
        reviewed_at?: Date;
        status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
        reviewer_notes?: string;
    }[];

    @Column({ type: 'text', nullable: true })
    current_position?: string;

    @Column({ type: 'text', nullable: true })
    current_company?: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    expected_salary?: number;

    @Column({ type: 'text', nullable: true })
    notice_period?: string;

    @Column({ type: 'boolean', default: false })
    willing_to_relocate?: boolean;

    @Column({ type: 'jsonb', nullable: true })
    screening_answers?: {
        questions: string[];
        answers: string[];
    };

    @Column({ type: 'jsonb', nullable: true })
    assessment_results?: {
        score?: number;
        feedback?: string;
        completed_at?: Date;
        reviewer?: string;
    };

    @Column({ type: 'text', nullable: true })
    rejection_reason?: string;

    @Column({ type: 'simple-array', nullable: true })
    referral_sources?: string[];

    @Column({ type: 'jsonb', nullable: true })
    recruiter_notes?: {
        notes: string;
        added_by: string;
        added_at: Date;
    }[];

    @OneToOne(() => Interview, (interview: Interview) => interview.application)
    interview!: Interview;

    @Column({ type: 'timestamp', nullable: true })
    last_status_change?: Date;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: {
        source: string;
        custom_fields: Record<string, any>;
        tags: string[];
    };

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at!: Date;

    @Column({ type: 'boolean', default: true })
    is_active!: boolean;

    @Column({ type: 'text', nullable: true })
    withdrawal_reason?: string;

    @Column({ type: 'boolean', default: false })
    has_viewed_application?: boolean;
    feedback: any;
    status_updated_at: Date | undefined;
    status_updated_by: { user_id: string; name: string; } | undefined;
}