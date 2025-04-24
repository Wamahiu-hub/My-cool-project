import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { JobApplication } from "./JobApplication";

@Entity()
export class Interviews extends BaseEntity {
  @PrimaryGeneratedColumn()
  interview_id!: number;

  // Many Interviews belong to one JobApplication
  @ManyToOne(() => JobApplication, application => application.interviews, { nullable: false })
  application!: JobApplication;

  @Column({ type: 'timestamp', nullable: false })
  scheduled_at!: Date;

  @Column({ nullable: true })
  location?: string;  // Optional field for interview location (could be virtual)

  @Column({ nullable: true })
  notes?: string;  // Optional notes or instructions for the interview

  @Column({ default: "scheduled" })
  status!: string;  // Interview status (e.g., scheduled, completed, canceled)
}
