import { Entity, PrimaryColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { Timesheet } from "./Timesheet.js";

@Entity({ name: "TimesheetSession" })
@Index(["timesheetId"])
@Index(["startTime"])
@Index(["projectName"])
export class TimesheetSession {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar" })
  timesheetId!: string;

  @ManyToOne(() => Timesheet, (t) => t.sessions, { onDelete: "CASCADE" })
  timesheet!: Timesheet;

  @Column({ type: "varchar" })
  taskName!: string;

  @Column({ type: "varchar" })
  projectName!: string;

  @Column({ type: "varchar", nullable: true })
  description?: string;

  @Column({ type: "timestamp" })
  startTime!: Date;

  @Column({ type: "timestamp" })
  endTime!: Date;

  @Column({ type: "int" })
  duration!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

