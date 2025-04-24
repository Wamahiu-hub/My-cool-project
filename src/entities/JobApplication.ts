import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Job } from "./Job";
import { User } from "./User";
import { Interviews } from "./Interviews";

@Entity()
export class JobApplication extends BaseEntity {
    @PrimaryGeneratedColumn()
    application_id!: number;

    // Many JobApplications belong to one Job
    @ManyToOne(() => Job, job => job.applications)
    job!: Job;

    // Many JobApplications belong to one User (applicant)
    @ManyToOne(() => User, user => user.applications)
    applicant!: User;

    @Column("text", { nullable: true })
    cover_letter?: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    applied_at!: Date;

    @Column({ default: "pending" })
    status!: string;

    // One JobApplication can have many Interviews
    @OneToMany(() => Interviews, interview => interview.application)
    interviews!: Interviews[];
}
