import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Job } from "./Job";
import { Interview } from "./Interview";

@Entity()
export class Notification extends BaseEntity {
    @PrimaryGeneratedColumn()
    notification_id!: number;

    @ManyToOne(() => User)
    recipient!: User;

    @Column()
    type!: string; // 'application_update', 'interview_scheduled', 'job_match', etc.

    @Column("text")
    message!: string;

    @Column({ default: false })
    is_read!: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @ManyToOne(() => Job, { nullable: true })
    related_job?: Job;

    @ManyToOne(() => Interview, { nullable: true })
    related_interview?: Interview;

    @Column({ type: 'jsonb', nullable: true })
    notification_data?: {
        title: string;
        summary: string;
        icon?: string;
        color?: string;
        buttons?: {
            text: string;
            action: string;
            style?: string;
        }[];
    };

    @Column({ type: 'jsonb', nullable: true })
    delivery_status?: {
        email_sent: boolean;
        email_delivered: boolean;
        push_sent: boolean;
        push_delivered: boolean;
        sms_sent: boolean;
        sms_delivered: boolean;
        delivery_attempts: number;
        last_attempt: Date;
    };

    @Column({ type: 'jsonb', nullable: true })
    interaction_data?: {
        viewed_at?: Date;
        clicked_at?: Date;
        action_taken?: string;
        device_info?: string;
        location?: string;
    };

    @Column({ default: true })
    is_active!: boolean;

    @Column({ nullable: true })
    action_url?: string;

    @Column({ nullable: true })
    priority?: string; // 'high', 'medium', 'low'

    @Column({ type: 'timestamp', nullable: true })
    schedule_for?: Date;

    @Column({ type: 'timestamp', nullable: true })
    expires_at?: Date;

    @Column({ type: 'simple-array', nullable: true })
    channels?: string[]; // ['email', 'push', 'sms', 'in_app']

    @Column({ type: 'jsonb', nullable: true })
    preferences?: {
        sound?: boolean;
        vibration?: boolean;
        badge?: boolean;
        email_format?: string;
    };

    @Column({ type: 'int', default: 0 })
    retry_count!: number;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: {
        campaign_id?: string;
        category?: string;
        tags?: string[];
        custom_data?: Record<string, any>;
    };

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at!: Date;

    @Column({ type: 'boolean', default: false })
    requires_action!: boolean;

    @Column({ type: 'text', nullable: true })
    error_message?: string;
    read_at: Date | undefined;
}