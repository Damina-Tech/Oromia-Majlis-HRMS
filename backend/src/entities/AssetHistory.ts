import { Entity, PrimaryColumn, Column, ManyToOne, CreateDateColumn, Index } from "typeorm";
import { Asset } from "./Asset.js";
import { Employee } from "./Employee.js";
import { User } from "./User.js";
import { AssetStatus, AssetCondition } from "./Asset.js";

export enum AssetHistoryAction {
  CREATED = "CREATED",
  ASSIGNED = "ASSIGNED",
  REVOKED = "REVOKED",
  TRANSFERRED = "TRANSFERRED",
  MAINTENANCE_STARTED = "MAINTENANCE_STARTED",
  MAINTENANCE_COMPLETED = "MAINTENANCE_COMPLETED",
  STATUS_CHANGED = "STATUS_CHANGED",
  CONDITION_UPDATED = "CONDITION_UPDATED",
  RETIRED = "RETIRED",
  LOST = "LOST",
  FOUND = "FOUND",
}

@Entity({ name: "AssetHistory" })
@Index(["assetId"])
@Index(["action"])
@Index(["performedBy"])
@Index(["createdAt"])
export class AssetHistory {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar" })
  assetId!: string;

  @ManyToOne(() => Asset, (a) => a.history, { onDelete: "CASCADE" })
  asset!: Asset;

  @Column({ type: "varchar" })
  action!: AssetHistoryAction;

  @Column({ type: "varchar", nullable: true })
  description?: string;

  @Column({ type: "varchar", nullable: true })
  fromEmployeeId?: string;

  @Column({ type: "varchar", nullable: true })
  toEmployeeId?: string;

  @ManyToOne(() => Employee, (e) => e.assetHistoryFrom)
  fromEmployee?: Employee;

  @ManyToOne(() => Employee, (e) => e.assetHistoryTo)
  toEmployee?: Employee;

  @Column({ type: "varchar", nullable: true })
  previousStatus?: AssetStatus;

  @Column({ type: "varchar", nullable: true })
  newStatus?: AssetStatus;

  @Column({ type: "varchar", nullable: true })
  previousCondition?: AssetCondition;

  @Column({ type: "varchar", nullable: true })
  newCondition?: AssetCondition;

  @Column({ type: "varchar" })
  performedBy!: string;

  @ManyToOne(() => User, (u) => u.assetHistoryPerformedBy)
  performedByUser!: User;

  @CreateDateColumn()
  createdAt!: Date;
}

