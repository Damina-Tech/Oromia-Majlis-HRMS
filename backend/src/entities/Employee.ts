import { Entity, PrimaryColumn, Column, ManyToOne, OneToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { Department } from "./Department.js";
import { User } from "./User.js";
import { LeaveRequest } from "./LeaveRequest.js";
import { LeaveBalance } from "./LeaveBalance.js";
import { Attendance } from "./Attendance.js";
import { Payroll } from "./Payroll.js";
import { Timesheet } from "./Timesheet.js";
import { Asset } from "./Asset.js";
import { AssetHistory } from "./AssetHistory.js";

export enum EmpStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ON_LEAVE = "ON_LEAVE",
}

@Entity({ name: "Employee" })
@Index(["departmentId"]) 
@Index(["joiningDate"]) 
@Index(["lastName", "firstName"]) 
export class Employee {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar", unique: true })
  employeeCode!: string;

  @Column({ type: "varchar" })
  firstName!: string;

  @Column({ type: "varchar" })
  lastName!: string;

  @Column({ type: "varchar", unique: true })
  email!: string;

  @Column({ type: "varchar", nullable: true })
  phone?: string;

  @Column({ type: "varchar", nullable: true })
  address?: string;

  @Column({ type: "varchar", nullable: true })
  emergencyContact?: string;

  @Column({ type: "varchar", nullable: true })
  designation?: string;

  @Column({ type: "varchar", default: EmpStatus.ACTIVE })
  status!: EmpStatus;

  @Column({ type: "date", nullable: true })
  joiningDate?: Date;

  @Column({ type: "numeric", precision: 12, scale: 2, nullable: true })
  salary?: string;

  @Column({ type: "varchar", nullable: true })
  departmentId?: string;

  @ManyToOne(() => Department, (d) => d.employees)
  department?: Department;

  @Column({ type: "varchar", nullable: true })
  managerId?: string;

  @ManyToOne(() => Employee, (e) => e.reports)
  manager?: Employee;

  @OneToMany(() => Employee, (e) => e.manager)
  reports!: Employee[];

  @Column({ type: "varchar", nullable: true, unique: true })
  userId?: string;

  @OneToOne(() => User)
  @JoinColumn({ name: "userId" })
  user?: User;

  @OneToMany(() => LeaveRequest, (lr) => lr.employee)
  leaveRequests!: LeaveRequest[];

  @OneToMany(() => LeaveRequest, (lr) => lr.approver)
  approvedLeaves!: LeaveRequest[];

  @OneToOne(() => LeaveBalance, (lb) => lb.employee)
  leaveBalance?: LeaveBalance;

  @OneToMany(() => Attendance, (a) => a.employee)
  attendanceRecords!: Attendance[];

  @OneToMany(() => Payroll, (p) => p.employee)
  payrollRecords!: Payroll[];

  @OneToMany(() => Timesheet, (t) => t.employee)
  timesheets!: Timesheet[];

  @OneToMany(() => Asset, (a) => a.assignedEmployee)
  assignedAssets!: Asset[];

  @OneToMany(() => AssetHistory, (ah) => ah.fromEmployee)
  assetHistoryFrom!: AssetHistory[];

  @OneToMany(() => AssetHistory, (ah) => ah.toEmployee)
  assetHistoryTo!: AssetHistory[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}


