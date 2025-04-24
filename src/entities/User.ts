import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./Role";
import { Job } from "./Job";
import { JobApplication } from "./JobApplication";

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    user_id!: number;

    @Column()
    name!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    @Column({ nullable: true })
    phone_number?: string;

    @Column({ nullable: true })
    cv?: string;  // URL or file path to the CV

    // skills
    @Column('simple-array', { nullable: true })
    skills?: string[];  // Array of skills (e.g., ["JavaScript", "React"])
    @Column({nullable:true})
    path?:string

    @ManyToOne(() => Role, role => role.users)
    role!: Role;  // A User has one Role

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at!: Date;

    @Column({ default: true })
    is_active!: boolean;

    // One User can post many Jobs
    @OneToMany(() => Job, job => job.recruiter)
    posted_jobs!: Job[];

    // One User can apply to many Jobs
    @OneToMany(() => JobApplication, application => application.applicant)
    applications!: JobApplication[];
}
