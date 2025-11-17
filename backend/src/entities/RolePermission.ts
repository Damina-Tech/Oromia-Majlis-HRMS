import { Entity, Column, ManyToOne, PrimaryColumn, CreateDateColumn, Index } from "typeorm";
import { Role } from "./Role.js";
import { Permission } from "./Permission.js";

@Entity({ name: "RolePermission" })
@Index(["roleId"]) 
@Index(["permissionId"]) 
export class RolePermission {
  @PrimaryColumn({ type: "varchar" })
  roleId!: string;

  @PrimaryColumn({ type: "varchar" })
  permissionId!: string;

  @ManyToOne(() => Role, (role) => role.permissions, { onDelete: "CASCADE" })
  role!: Role;

  @ManyToOne(() => Permission, (permission) => permission.roles, { onDelete: "CASCADE" })
  permission!: Permission;

  @CreateDateColumn()
  createdAt!: Date;
}


