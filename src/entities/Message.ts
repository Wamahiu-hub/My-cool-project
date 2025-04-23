import {
    BaseEntity,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn
} from "typeorm";
import { User } from "./User";

@Entity()
export class Message extends BaseEntity {
    @PrimaryGeneratedColumn()
    message_id!: number;
     // 'text', 'image', 'file', etc.

    @ManyToOne(() => User, { eager: true }) // add eager load to avoid missing sender in queries
    sender!: User;
    messages!: string[]; // array of messages in a single conversation

    @Column("text")
    content!: string;

    @Column()
    role!: string; // 'user' or 'ai'

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @Column({ nullable: true })
    conversation_id?: string;

    @Column({ type: 'jsonb', nullable: true })
    context?: Record<string, any>;
}
