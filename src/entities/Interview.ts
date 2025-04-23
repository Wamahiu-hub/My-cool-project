import { BaseEntity, Column, Entity, OneToOne, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from "typeorm";
import { JobApplication } from "./JobApplication";
import { User } from "./User";

@Entity()
export class Interview extends BaseEntity {
    [x: string]: any;
    @PrimaryGeneratedColumn()
    interview_id!: number;
    interview_round: number | undefined;
    // Removed duplicate declaration of interview_type
    

    @OneToOne(() => JobApplication, application => application.interview)
    @JoinColumn()
    application!: JobApplication;

    @ManyToOne(() => User)
    interviewer!: User;

    @Column({ type: 'timestamp' })
    interview_date: Date | undefined;

    @Column({ type: 'time' })
    scheduled_time!: string;

    @Column({ type: 'int', default: 60 })
    duration_minutes!: number;

    @Column({
        type: 'enum',
        enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'],
        default: 'scheduled'
    })
    status!: string;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'varchar', nullable: true })
    meeting_link?: string;

    @Column({ type: 'varchar', nullable: true })
    location?: string;

    @Column({
        type: 'enum',
        enum: ['online', 'in-person', 'phone'],
        default: 'online'
    })
    interview_type!: string;

    @Column({ type: 'timestamp', nullable: true })
    rescheduled_date?: Date;

    @Column({ type: 'text', nullable: true })
    cancellation_reason?: string;

    @Column({ type: 'jsonb', nullable: true })
    interview_feedback?: {
        technical_skills: number;
        communication: number;
        cultural_fit: number;
        overall_rating: number;
        strengths: string[];
        areas_for_improvement: string[];
        recommendation: string;
        comments: string;
    };

    @Column({ type: 'simple-array', nullable: true })
    required_documents?: string[];

    @Column({ type: 'jsonb', nullable: true })
    panel_members?: {
        user_id: number;
        name: string;
        role: string;
        status: string;
    }[];

    @Column({ type: 'jsonb', nullable: true })
    pre_interview_tasks?: {
        description: string;
        due_date: Date;
        status: string;
        submission_url?: string;
    }[];

    @Column({ type: 'simple-array', nullable: true })
    interview_questions?: string[];

    @Column({ type: 'boolean', default: false })
    reminder_sent!: boolean;

    @Column({ type: 'timestamp', nullable: true })
    next_followup_date?: Date;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: {
        round_number: number;
        custom_fields: Record<string, any>;
    };

    @Column({ type: 'int', default: 1 })
    iteration_number!: number;

    @Column({ type: 'boolean', default: false })
    requires_iteration!: boolean;

    @Column({ type: 'text', nullable: true })
    iteration_reason?: string;

    @Column({ type: 'jsonb', nullable: true })
    previous_iterations?: {
        iteration_number: number;
        date: Date;
        feedback: string;
        status: string;
        interviewer_id: number;
    }[];

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at!: Date;

    @Column({ type: 'boolean', default: true })
    is_active!: boolean;
}