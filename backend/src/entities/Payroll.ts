import { Entity, PrimaryColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";
import { Employee } from "./Employee.js";

export enum PayrollStatus {
  DRAFT = "DRAFT",
  PROCESSED = "PROCESSED",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export enum PayrollPeriodType {
  MONTHLY = "MONTHLY",
  BIWEEKLY = "BIWEEKLY",
  WEEKLY = "WEEKLY",
}

@Entity({ name: "Payroll" })
@Unique(["employeeId", "periodStart", "periodEnd"])
@Index(["employeeId"])
@Index(["periodStart", "periodEnd"])
@Index(["status"])
@Index(["paymentDate"])
export class Payroll {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar" })
  employeeId!: string;

  @ManyToOne(() => Employee, (e) => e.payrollRecords)
  employee!: Employee;

  @Column({ type: "varchar", default: PayrollPeriodType.MONTHLY })
  periodType!: PayrollPeriodType;

  @Column({ type: "date" })
  periodStart!: Date;

  @Column({ type: "date" })
  periodEnd!: Date;

  @Column({ type: "date", nullable: true })
  paymentDate?: Date;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  basicSalary!: string;

  @Column({ type: "numeric", precision: 12, scale: 2, default: "0" })
  allowances!: string;

  @Column({ type: "numeric", precision: 12, scale: 2, default: "0" })
  overtime!: string;

  @Column({ type: "numeric", precision: 12, scale: 2, default: "0" })
  bonus!: string;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  grossSalary!: string;

  @Column({ type: "numeric", precision: 12, scale: 2, default: "0" })
  incomeTax!: string;

  @Column({ type: "numeric", precision: 12, scale: 2, default: "0" })
  healthInsurance!: string;

  @Column({ type: "numeric", precision: 12, scale: 2, default: "0" })
  providentFund!: string;

  @Column({ type: "numeric", precision: 12, scale: 2, default: "0" })
  otherDeductions!: string;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  totalDeductions!: string;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  netSalary!: string;

  @Column({ type: "varchar", default: PayrollStatus.DRAFT })
  status!: PayrollStatus;

  @Column({ type: "varchar", nullable: true })
  processedBy?: string;

  @Column({ type: "timestamp", nullable: true })
  processedAt?: Date;

  @Column({ type: "int", default: 0 })
  workingDays!: number;

  @Column({ type: "int", default: 0 })
  presentDays!: number;

  @Column({ type: "int", default: 0 })
  absentDays!: number;

  @Column({ type: "int", default: 0 })
  leaveDays!: number;

  @Column({ type: "varchar", nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

