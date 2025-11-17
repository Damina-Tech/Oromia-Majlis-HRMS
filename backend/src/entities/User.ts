import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { UserRole } from "./UserRole.js";
import { Employee } from "./Employee.js";
import { Timesheet } from "./Timesheet.js";
import { Asset } from "./Asset.js";
import { AssetHistory } from "./AssetHistory.js";

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

@Entity({ name: "User" })
export class User {
  @PrimaryColumn({ type: "varchar" })
  id!: string; // cuid

  @Column({ type: "varchar", unique: true })
  email!: string;

  @Column({ type: "varchar" })
  passwordHash!: string;

  @Column({ type: "varchar" })
  firstName!: string;

  @Column({ type: "varchar" })
  lastName!: string;

  @Column({ type: "varchar", default: UserStatus.ACTIVE })
  status!: UserStatus;

  @OneToMany(() => UserRole, (ur) => ur.user)
  userRoles!: UserRole[];

  @OneToMany(() => Employee, (e) => e.user)
  employee?: Employee[];

  @OneToMany(() => Timesheet, (t) => t.approver)
  approvedTimesheets!: Timesheet[];

  @OneToMany(() => Asset, (a) => a.assignedByUser)
  assignedAssetsBy!: Asset[];

  @OneToMany(() => AssetHistory, (ah) => ah.performedByUser)
  assetHistoryPerformedBy!: AssetHistory[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}


