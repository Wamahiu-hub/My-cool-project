import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Job } from "./Job";

@Entity()
export class Analytics extends BaseEntity {
    @PrimaryGeneratedColumn()
    analytics_id!: number;
    user_id!: number;

    @ManyToOne(() => User)
    recruiter!: User;

    @ManyToOne(() => Job, { nullable: true })
    job?: Job;

    @Column()
    metric_type!: string; // 'job_views', 'applications', 'interviews', 'hires', etc.

    @Column("int")
    value!: number;

    @Column({ type: 'timestamp' })
    date!: Date;

    @Column({ type: 'jsonb', nullable: true })
    demographic_data?: {
        age_groups?: Record<string, number>;
        locations?: Record<string, number>;
        experience_levels?: Record<string, number>;
        education_levels?: Record<string, number>;
        skills_distribution?: Record<string, number>;
    };

    @Column({ type: 'jsonb', nullable: true })
    recruitment_funnel?: {
        total_views: number;
        applications_started: number;
        applications_completed: number;
        shortlisted: number;
        interviewed: number;
        offers_made: number;
        offers_accepted: number;
        conversion_rates: {
            view_to_apply: number;
            apply_to_interview: number;
            interview_to_offer: number;
            offer_to_accept: number;
        };
    };

    @Column({ type: 'jsonb', nullable: true })
    time_metrics?: {
        avg_time_to_hire: number;
        avg_time_in_stage: Record<string, number>;
        response_times: Record<string, number>;
    };

    @Column({ type: 'jsonb', nullable: true })
    source_metrics?: {
        source: string;
        applications: number;
        qualified_candidates: number;
        hires: number;
        cost_per_hire: number;
    }[];

    @Column({ type: 'jsonb', nullable: true })
    engagement_metrics?: {
        email_opens: number;
        email_clicks: number;
        job_shares: number;
        social_media_interactions: number;
    };

    @Column({ type: 'jsonb', nullable: true })
    skill_gap_analysis?: {
        required_skills: string[];
        available_skills: string[];
        gap_percentage: number;
        recommendations: string[];
    };

    @Column({ type: 'varchar', nullable: true })
    time_period?: string; // 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'

    @Column({ type: 'jsonb', nullable: true })
    comparative_metrics?: {
        industry_average?: number;
        company_average?: number;
        period_over_period_change?: number;
        benchmark_data?: Record<string, number>;
    };

    @Column({ type: 'jsonb', nullable: true })
    cost_metrics?: {
        advertising_cost: number;
        agency_fees: number;
        internal_resources_cost: number;
        total_cost: number;
        roi: number;
    };

    @Column({ type: 'jsonb', nullable: true })
    ai_insights?: {
        predicted_time_to_hire: number;
        success_probability: number;
        suggested_improvements: string[];
        trend_analysis: Record<string, any>;
    };

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at!: Date;

    @Column({ type: 'jsonb', nullable: true })
    filters?: {
        date_range?: { start: Date; end: Date };
        departments?: string[];
        locations?: string[];
        job_types?: string[];
    };

    @Column({ type: 'boolean', default: true })
    is_active!: boolean;
}