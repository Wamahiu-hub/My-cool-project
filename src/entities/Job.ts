import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { JobApplication } from "./JobApplication";

@Entity()
export class Job extends BaseEntity {
    @PrimaryGeneratedColumn()
    job_id!: number;

    @Column()
    title!: string;

    @Column()
    company!: string;

    @Column("text")
    description!: string;

    @Column({ type: 'simple-array', nullable:true})
    required_skills!: string[];

    // Many Jobs can be posted by one User
    @ManyToOne(() => User, user => user.posted_jobs)
    recruiter!: User;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    posted_date!: Date;

    @Column({ default: true })
    is_active!: boolean;

    // One Job can have many JobApplications
    @OneToMany(() => JobApplication, application => application.job)
    applications!: JobApplication[];
}
