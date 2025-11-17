import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Employee } from "./Employee.js";

@Entity({ name: "Department" })
export class Department {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar", unique: true })
  name!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Employee, (e) => e.department)
  employees!: Employee[];
}


