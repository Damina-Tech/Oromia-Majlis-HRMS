import { Entity, PrimaryColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { Employee } from "./Employee.js";

export enum LeaveType {
  CASUAL = "CASUAL",
  SICK = "SICK",
  VACATION = "VACATION",
  MATERNITY = "MATERNITY",
  PERSONAL = "PERSONAL",
}

export enum LeaveStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

@Entity({ name: "LeaveRequest" })
@Index(["employeeId"])
@Index(["status"])
@Index(["startDate", "endDate"])
export class LeaveRequest {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar" })
  employeeId!: string;

  @ManyToOne(() => Employee, (e) => e.leaveRequests)
  employee!: Employee;

  @Column({ type: "varchar" })
  type!: LeaveType;

  @Column({ type: "timestamp" })
  startDate!: Date;

  @Column({ type: "timestamp" })
  endDate!: Date;

  @Column({ type: "int" })
  days!: number;

  @Column({ type: "varchar" })
  reason!: string;

  @Column({ type: "varchar", default: LeaveStatus.PENDING })
  status!: LeaveStatus;

  @Column({ type: "varchar", nullable: true })
  approverId?: string;

  @ManyToOne(() => Employee, (e) => e.approvedLeaves)
  approver?: Employee;

  @Column({ type: "timestamp", nullable: true })
  approvedAt?: Date;

  @Column({ type: "varchar", nullable: true })
  rejectionReason?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

