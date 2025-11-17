import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { Employee } from "./Employee.js";
import { User } from "./User.js";
import { AssetHistory } from "./AssetHistory.js";

export enum AssetStatus {
  AVAILABLE = "AVAILABLE",
  ASSIGNED = "ASSIGNED",
  MAINTENANCE = "MAINTENANCE",
  RETIRED = "RETIRED",
  LOST = "LOST",
  DAMAGED = "DAMAGED",
}

export enum AssetCondition {
  EXCELLENT = "EXCELLENT",
  GOOD = "GOOD",
  FAIR = "FAIR",
  POOR = "POOR",
  DAMAGED = "DAMAGED",
}

export enum AssetCategory {
  LAPTOP = "LAPTOP",
  DESKTOP = "DESKTOP",
  MONITOR = "MONITOR",
  KEYBOARD = "KEYBOARD",
  MOUSE = "MOUSE",
  PHONE = "PHONE",
  TABLET = "TABLET",
  HEADSET = "HEADSET",
  PRINTER = "PRINTER",
  NETWORK_EQUIPMENT = "NETWORK_EQUIPMENT",
  OTHER = "OTHER",
}

@Entity({ name: "Asset" })
@Index(["category"])
@Index(["status"])
@Index(["condition"])
@Index(["assignedTo"])
@Index(["serialNumber"])
@Index(["location"])
export class Asset {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar" })
  category!: AssetCategory;

  @Column({ type: "varchar", unique: true })
  serialNumber!: string;

  @Column({ type: "varchar", nullable: true })
  model?: string;

  @Column({ type: "varchar", nullable: true })
  brand?: string;

  @Column({ type: "date", nullable: true })
  purchaseDate?: Date;

  @Column({ type: "numeric", precision: 12, scale: 2, nullable: true })
  purchasePrice?: string;

  @Column({ type: "numeric", precision: 12, scale: 2, nullable: true })
  currentValue?: string;

  @Column({ type: "varchar", default: AssetCondition.EXCELLENT })
  condition!: AssetCondition;

  @Column({ type: "varchar", default: AssetStatus.AVAILABLE })
  status!: AssetStatus;

  @Column({ type: "varchar", nullable: true })
  location?: string;

  @Column({ type: "varchar", nullable: true })
  notes?: string;

  @Column({ type: "varchar", nullable: true })
  assignedTo?: string;

  @Column({ type: "date", nullable: true })
  assignedDate?: Date;

  @Column({ type: "varchar", nullable: true })
  assignedBy?: string;

  @ManyToOne(() => Employee, (e) => e.assignedAssets)
  assignedEmployee?: Employee;

  @ManyToOne(() => User, (u) => u.assignedAssetsBy)
  assignedByUser?: User;

  @OneToMany(() => AssetHistory, (h) => h.asset)
  history!: AssetHistory[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

