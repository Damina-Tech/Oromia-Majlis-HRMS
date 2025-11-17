import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { RolePermission } from "./RolePermission.js";

@Entity({ name: "Permission" })
export class Permission {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar", unique: true })
  name!: string;

  @Column({ type: "varchar", nullable: true })
  description?: string;

  @Column({ type: "varchar" })
  module!: string;

  @Column({ type: "varchar" })
  action!: string;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  roles!: RolePermission[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}


