import { Entity, PrimaryColumn, ManyToOne, Index } from "typeorm";
import { User } from "./User.js";
import { Role } from "./Role.js";

@Entity({ name: "UserRole" })
@Index(["userId"]) 
@Index(["roleId"]) 
export class UserRole {
  @PrimaryColumn({ type: "varchar" })
  userId!: string;

  @PrimaryColumn({ type: "varchar" })
  roleId!: string;

  @ManyToOne(() => User, (user) => user.userRoles, { onDelete: "CASCADE" })
  user!: User;

  @ManyToOne(() => Role, (role) => role.users, { onDelete: "CASCADE" })
  role!: Role;
}


