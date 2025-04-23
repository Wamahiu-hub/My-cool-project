import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Job } from "./Job";
import { JobApplication } from "./JobApplication";

@Entity()
export class SkillAssessment extends BaseEntity {
    @PrimaryGeneratedColumn()
    assessment_id!: number;
    // Removed duplicate declaration of 'application'
    test_type: string = '';
    questions: any[] = [];
    time_limit_minutes: number = 0;
    passing_score!: number;
    instructions!: string;
    skills_tested!: string[];
    difficulty_level!: string;
    status!: string;
    created_by!: number;
    answers?: any[];
    score?: number;
    time_taken?: number;
    passed?: boolean;
    completed_at?: Date;

    @ManyToOne(() => User)
    candidate!: User;

    @ManyToOne(() => Job)
    job!: Job;

    @ManyToOne(() => JobApplication, { nullable: true })
    application?: JobApplication;

    @Column("simple-array")
    skills_assessed!: string[];

    @Column({ type: 'jsonb' })
    skill_scores!: Record<string, number>;

    @Column("decimal", { precision: 5, scale: 2 })
    match_percentage!: number;

    @Column({ type: 'jsonb', nullable: true })
    skill_categories?: {
        technical: Record<string, number>;
        soft_skills: Record<string, number>;
        domain_knowledge: Record<string, number>;
        certifications: Record<string, number>;
    };

    @Column({ type: 'jsonb' })
    ai_feedback!: {
        strengths: string[];
        gaps: string[];
        recommendations: string[];
        improvement_plan?: {
            short_term: string[];
            long_term: string[];
            resources: string[];
        };
        skill_alignment: {
            job_requirements: string[];
            matching_skills: string[];
            missing_skills: string[];
            transferable_skills: string[];
        };
    };

    @Column({ type: 'jsonb', nullable: true })
    experience_analysis?: {
        years_of_experience: number;
        relevance_score: number;
        key_achievements: string[];
        industry_alignment: number;
    };

    @Column({ type: 'jsonb', nullable: true })
    assessment_details!: {
        method: string;
        version: string;
        confidence_score: number;
        assessment_type: string;
        duration: number;
        completion_status: string;
    };

    @Column({ type: 'jsonb', nullable: true })
    competency_levels?: {
        beginner: string[];
        intermediate: string[];
        advanced: string[];
        expert: string[];
    };

    @Column({ type: 'jsonb', nullable: true })
    project_experience?: {
        project_name: string;
        skills_demonstrated: string[];
        complexity_level: string;
        impact_score: number;
    }[];

    @Column({ type: 'jsonb', nullable: true })
    learning_path?: {
        recommended_courses: string[];
        skill_priorities: string[];
        timeline: string;
        milestones: {
            description: string;
            target_date: Date;
            skills_involved: string[];
        }[];
    };

    @Column({ type: 'simple-array', nullable: true })
    potential_roles?: string[];

    @Column({ type: 'jsonb', nullable: true })
    comparative_analysis?: {
        industry_benchmark: number;
        peer_comparison: number;
        market_demand: {
            skill: string;
            demand_level: string;
            growth_trend: string;
        }[];
    };

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    assessed_at!: Date;

    @Column({ type: 'jsonb', nullable: true })
    validation_data?: {
        source_documents: string[];
        verification_method: string;
        validator_id?: string;
        verification_date?: Date;
    };

    @Column({ default: true })
    is_active!: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at!: Date;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: {
        assessment_platform: string;
        environment_details: Record<string, any>;
        custom_parameters: Record<string, any>;
    };
}