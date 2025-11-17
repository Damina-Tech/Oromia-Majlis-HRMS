import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Employee } from "./Employee.js";

@Entity({ name: "LeaveBalance" })
export class LeaveBalance {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar", unique: true })
  employeeId!: string;

  @OneToOne(() => Employee, (e) => e.leaveBalance)
  @JoinColumn({ name: "employeeId" })
  employee!: Employee;

  @Column({ type: "int", default: 12 })
  casualLeave!: number;

  @Column({ type: "int", default: 10 })
  sickLeave!: number;

  @Column({ type: "int", default: 21 })
  vacationLeave!: number;

  @Column({ type: "int", default: 5 })
  personalLeave!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

