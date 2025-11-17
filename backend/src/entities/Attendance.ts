import { Entity, PrimaryColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";
import { Employee } from "./Employee.js";

export enum AttendanceStatus {
  PRESENT = "PRESENT",
  LATE = "LATE",
  ABSENT = "ABSENT",
  HALF_DAY = "HALF_DAY",
  ON_LEAVE = "ON_LEAVE",
}

@Entity({ name: "Attendance" })
@Unique(["employeeId", "date"])
@Index(["employeeId"])
@Index(["date"])
@Index(["status"])
export class Attendance {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar" })
  employeeId!: string;

  @ManyToOne(() => Employee, (e) => e.attendanceRecords)
  employee!: Employee;

  @Column({ type: "date" })
  date!: Date;

  @Column({ type: "timestamp", nullable: true })
  checkInTime?: Date;

  @Column({ type: "timestamp", nullable: true })
  checkOutTime?: Date;

  @Column({ type: "varchar", nullable: true })
  checkInLocation?: string;

  @Column({ type: "varchar", nullable: true })
  checkOutLocation?: string;

  @Column({ type: "varchar", default: AttendanceStatus.PRESENT })
  status!: AttendanceStatus;

  @Column({ type: "numeric", precision: 5, scale: 2, nullable: true })
  workHours?: string;

  @Column({ type: "int", default: 0 })
  breakMinutes!: number;

  @Column({ type: "varchar", nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

