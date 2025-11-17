import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { UserRole } from "./UserRole.js";
import { RolePermission } from "./RolePermission.js";

@Entity({ name: "Role" })
export class Role {
  @PrimaryColumn({ type: "varchar" })
  id!: string; // cuid

  @Column({ type: "varchar", unique: true })
  name!: string;

  @Column({ type: "varchar", nullable: true })
  description?: string;

  @OneToMany(() => UserRole, (ur) => ur.role)
  users!: UserRole[];

  @OneToMany(() => RolePermission, (rp) => rp.role)
  permissions!: RolePermission[];

  @CreateDateColumn({ nullable: true })
  createdAt?: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt?: Date;
}


