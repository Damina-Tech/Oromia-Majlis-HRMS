import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";
import { Employee } from "./Employee.js";
import { User } from "./User.js";
import { TimesheetSession } from "./TimesheetSession.js";

export enum TimesheetStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

@Entity({ name: "Timesheet" })
@Unique(["employeeId", "date"])
@Index(["employeeId"])
@Index(["date"])
@Index(["status"])
@Index(["submittedAt"])
export class Timesheet {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar" })
  employeeId!: string;

  @ManyToOne(() => Employee, (e) => e.timesheets, { onDelete: "CASCADE" })
  employee!: Employee;

  @Column({ type: "date" })
  date!: Date;

  @Column({ type: "numeric", precision: 5, scale: 2 })
  totalHours!: string;

  @Column({ type: "varchar", default: TimesheetStatus.DRAFT })
  status!: TimesheetStatus;

  @Column({ type: "timestamp", nullable: true })
  submittedAt?: Date;

  @Column({ type: "timestamp", nullable: true })
  approvedAt?: Date;

  @Column({ type: "varchar", nullable: true })
  approvedBy?: string;

  @ManyToOne(() => User, (u) => u.approvedTimesheets)
  approver?: User;

  @Column({ type: "varchar", nullable: true })
  rejectionReason?: string;

  @Column({ type: "varchar", nullable: true })
  notes?: string;

  @OneToMany(() => TimesheetSession, (s) => s.timesheet, { cascade: true })
  sessions!: TimesheetSession[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

