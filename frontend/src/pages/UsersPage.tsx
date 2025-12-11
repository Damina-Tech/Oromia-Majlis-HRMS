<<<<<<< HEAD
import React, { useState } from "react";
=======
import React, { useState, useEffect } from "react";
>>>>>>> dev
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
<<<<<<< HEAD
=======
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
>>>>>>> dev
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
<<<<<<< HEAD
  DialogTrigger,
=======
  DialogFooter,
>>>>>>> dev
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
<<<<<<< HEAD
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
=======
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
>>>>>>> dev
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserPlus,
  Shield,
<<<<<<< HEAD
  Settings,
=======
>>>>>>> dev
  Search,
  MoreHorizontal,
  Lock,
  Unlock,
  Trash2,
  Edit,
  Eye,
  Users as UsersIcon,
  Crown,
<<<<<<< HEAD
  User,
} from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from '@/components/ui/checkbox';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [notifications, setNotifications] = useState([]);
=======
  User as UserIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  getRole,
  getPermissions,
  createRole,
  updateRole,
  deleteRole,
  type User,
  type Role,
  type Permission,
  type CreateUserPayload,
  type UpdateUserPayload,
  type CreateRolePayload,
  type UpdateRolePayload,
} from "@/services/users";
import { listEmployees } from "@/services/employees";
import type { Employee } from "@/services/employees";
import { useAuth } from "@/contexts/AuthContext";

export default function UsersPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("users.write");
  const canDelete = hasPermission("users.delete");

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
>>>>>>> dev
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addUserDialog, setAddUserDialog] = useState(false);
<<<<<<< HEAD
  const [addRoleDialog, setAddRoleDialog] = useState(false);
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const [userForm, setUserForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    roleId: "",
    department: "",
    isActive: true,
  });

  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    permissions: [],
  });

  const addNotification = ({ title, message, type }) => {
    setNotifications([
      ...notifications,
      { title, message, type, id: Date.now() },
    ]);
  };

  const addUser = (user) => {
    const newUser = {
      id: Date.now().toString(),
      ...user,
    };
    setUsers([...users, newUser]);
  };

  const updateUserData = (userId, updates) => {
    setUsers(users.map((u) => (u.id === userId ? { ...u, ...updates } : u)));
  };

  const deleteUser = (userId) => {
    setUsers(users.filter((u) => u.id !== userId));
  };

  const addRole = (role) => {
    const newRole = {
      id: Date.now().toString(),
      ...role,
    };
    setRoles([...roles, newRole]);
  };

  const deleteRole = (roleId) => {
    setRoles(roles.filter((r) => r.id !== roleId));
  };

  const getUsersByRole = (roleId) => users.filter((u) => u.role.id === roleId);
  const getActiveUsers = () => users.filter((u) => u.isActive);

=======
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [viewUserDialog, setViewUserDialog] = useState(false);
  const [deleteUserDialog, setDeleteUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Role management state
  const [addRoleDialog, setAddRoleDialog] = useState(false);
  const [editRoleDialog, setEditRoleDialog] = useState(false);
  const [viewRoleDialog, setViewRoleDialog] = useState(false);
  const [deleteRoleDialog, setDeleteRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const [userForm, setUserForm] = useState<CreateUserPayload & { confirmPassword: string }>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    roleIds: [],
    employeeId: "",
    status: "ACTIVE",
  });

  const [error, setError] = useState("");
  const [roleError, setRoleError] = useState("");
  
  const [roleForm, setRoleForm] = useState<CreateRolePayload & { id?: string }>({
    name: "",
    description: "",
    permissionIds: [],
  });

  // Load data
  useEffect(() => {
    loadData();
  }, [searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    loadRoles();
    loadPermissions();
    if (canManage) {
      loadEmployees();
    }
  }, [canManage]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await listUsers({
        search: searchTerm || undefined,
        roleId: roleFilter !== "all" ? roleFilter : undefined,
        status: statusFilter !== "all" ? (statusFilter.toUpperCase() as "ACTIVE" | "INACTIVE") : undefined,
        page: 1,
        pageSize: 1000,
      });
      setUsers(response.items);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load roles");
    }
  };

  const loadPermissions = async () => {
    try {
      const data = await getPermissions();
      setPermissions(data);
    } catch (err: any) {
      console.error("Failed to load permissions:", err);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await listEmployees({ page: 1, pageSize: 1000, status: "ACTIVE" });
      setEmployees(response.items);
    } catch (err) {
      console.error("Failed to load employees:", err);
    }
  };

>>>>>>> dev
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
<<<<<<< HEAD
    const matchesRole = roleFilter === "all" || user.role.id === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddUser = () => {
    if (
      !userForm.email ||
      !userForm.firstName ||
      !userForm.lastName ||
      !userForm.roleId
    ) {
      return addNotification({
        title: "Missing Information",
        message: "Please fill in all required fields",
        type: "error",
      });
    }
    const selectedRole = roles.find((r) => r.id === userForm.roleId);
    if (!selectedRole) {
      return addNotification({
        title: "Invalid Role",
        message: "Please select a valid role",
        type: "error",
      });
    }
    addUser({
      ...userForm,
      role: selectedRole,
      permissions: selectedRole.permissions || [],
    });
    addNotification({
      title: "User Added",
      message: `${userForm.firstName} ${userForm.lastName} added.`,
      type: "success",
    });
    setUserForm({
      email: "",
      firstName: "",
      lastName: "",
      roleId: "",
      department: "",
      isActive: true,
    });
    setAddUserDialog(false);
  };

  const handleAddRole = () => {
    if (!roleForm.name || !roleForm.description) {
      return addNotification({
        title: "Missing Info",
        message: "Provide role name and description",
        type: "error",
      });
    }
    addRole({
      ...roleForm,
      permissions: permissions.filter((p) =>
        roleForm.permissions.includes(p.id)
      ),
    });
    addNotification({
      title: "Role Created",
      message: `Role '${roleForm.name}' created`,
      type: "success",
    });
    setRoleForm({ name: "", description: "", permissions: [] });
    setAddRoleDialog(false);
  };

  const handleToggleUserStatus = (userId) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      updateUserData(userId, { isActive: !user.isActive });
      addNotification({
        title: "User Updated",
        message: `User ${user.isActive ? "deactivated" : "activated"}`,
        type: "success",
      });
    }
  };

  const handleDeleteUser = (userId) => {
    const user = users.find((u) => u.id === userId);
    deleteUser(userId);
    addNotification({
      title: "User Deleted",
      message: `${user.firstName} ${user.lastName} deleted`,
      type: "success",
    });
  };

  const handleDeleteRole = (roleId) => {
    const usersWithRole = getUsersByRole(roleId);
    if (usersWithRole.length > 0) {
      return addNotification({
        title: "Cannot Delete",
        message: "Role assigned to users",
        type: "error",
      });
    }
    deleteRole(roleId);
    addNotification({
      title: "Role Deleted",
      message: `Role deleted`,
      type: "success",
    });
  };

  const getRoleIcon = (role) => {
    if (role.toLowerCase().includes("admin"))
      return <Crown className="h-4 w-4 text-yellow-500" />;
    if (role.toLowerCase().includes("manager"))
      return <Shield className="h-4 w-4 text-blue-500" />;
    return <User className="h-4 w-4 text-gray-500" />;
=======
    // Show all users when "all" is selected, or users with the selected role
    // Users without roles will show when roleFilter is "all"
    const matchesRole = roleFilter === "all" || (user.roles && user.roles.length > 0 && user.roles.some((r) => r.id === roleFilter));
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.status === "ACTIVE") ||
      (statusFilter === "inactive" && user.status === "INACTIVE");
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddUser = async () => {
    if (!userForm.email || !userForm.firstName || !userForm.lastName || !userForm.roleIds.length) {
      setError("Please fill in all required fields");
      return;
    }

    if (!userForm.password || userForm.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (userForm.password !== userForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const payload: CreateUserPayload = {
        email: userForm.email,
        password: userForm.password,
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        roleIds: userForm.roleIds,
        employeeId: userForm.employeeId || undefined,
        status: userForm.status,
      };
      await createUser(payload);
      toast.success("User created successfully!");
      setAddUserDialog(false);
    setUserForm({
      email: "",
        password: "",
        confirmPassword: "",
      firstName: "",
      lastName: "",
        roleIds: [],
        employeeId: "",
        status: "ACTIVE",
      });
      await loadData();
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to create user";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    if (!userForm.roleIds.length) {
      setError("Please select at least one role");
      return;
    }

    if (userForm.password && userForm.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (userForm.password && userForm.password !== userForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const payload: UpdateUserPayload = {
        // Only send editable fields: password and roleIds
        roleIds: userForm.roleIds,
      };
      if (userForm.password) {
        payload.password = userForm.password;
      }
      await updateUser(selectedUser.id, payload);
      toast.success("User updated successfully!");
      setEditUserDialog(false);
      setSelectedUser(null);
      await loadData();
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to update user";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      await updateUser(user.id, {
        status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      toast.success(`User ${user.status === "ACTIVE" ? "deactivated" : "activated"}`);
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update user status");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id);
      toast.success("User deleted successfully");
      setDeleteUserDialog(false);
      setUserToDelete(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete user");
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setUserForm({
      email: user.email,
      password: "",
      confirmPassword: "",
      firstName: user.firstName,
      lastName: user.lastName,
      roleIds: user.roles.map((r) => r.id),
      employeeId: user.employee?.id || "",
      status: user.status,
      });
    setError("");
    // Delay slightly to ensure dropdown closes before opening dialog
    requestAnimationFrame(() => {
      setEditUserDialog(true);
    });
  };

  const openViewDialog = async (user: User) => {
    try {
      const fullUser = await getUser(user.id);
      setSelectedUser(fullUser);
      setViewUserDialog(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load user details");
    }
  };

  const getRoleIcon = (roleName: string) => {
    if (roleName.toLowerCase().includes("admin"))
      return <Crown className="h-4 w-4 text-yellow-500" />;
    if (roleName.toLowerCase().includes("manager"))
      return <Shield className="h-4 w-4 text-blue-500" />;
    return <UserIcon className="h-4 w-4 text-gray-500" />;
>>>>>>> dev
  };

  const stats = {
    total: users.length,
<<<<<<< HEAD
    active: getActiveUsers().length,
    inactive: users.filter((u) => !u.isActive).length,
    admins: users.filter((u) => u.role.name.toLowerCase().includes("admin"))
      .length,
    roles: roles.length,
  };

=======
    active: users.filter((u) => u.status === "ACTIVE").length,
    inactive: users.filter((u) => u.status === "INACTIVE").length,
    admins: users.filter((u) => u.roles.some((r) => r.name.toLowerCase().includes("admin"))).length,
    roles: roles.length,
  };

  const getUsersByRole = (roleId: string) => users.filter((u) => u.roles.some((r) => r.id === roleId));

  // Role management handlers
  const handleAddRole = async () => {
    if (!roleForm.name || !roleForm.permissionIds.length) {
      setRoleError("Please fill in role name and select at least one permission");
      return;
    }

    try {
      setSubmitting(true);
      setRoleError("");
      const payload: CreateRolePayload = {
        name: roleForm.name,
        description: roleForm.description || undefined,
        permissionIds: roleForm.permissionIds,
      };
      await createRole(payload);
      toast.success("Role created successfully!");
      setAddRoleDialog(false);
      setRoleForm({ name: "", description: "", permissionIds: [] });
      await loadRoles();
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to create role";
      setRoleError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRole = async () => {
    if (!selectedRole) return;
    
    if (!roleForm.name || !roleForm.permissionIds.length) {
      setRoleError("Please fill in role name and select at least one permission");
      return;
    }

    try {
      setSubmitting(true);
      setRoleError("");
      const payload: UpdateRolePayload = {
        name: roleForm.name,
        description: roleForm.description || undefined,
        permissionIds: roleForm.permissionIds,
      };
      await updateRole(selectedRole.id, payload);
      toast.success("Role updated successfully!");
      setEditRoleDialog(false);
      setSelectedRole(null);
      setRoleForm({ name: "", description: "", permissionIds: [] });
      await loadRoles();
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to update role";
      setRoleError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      await deleteRole(roleToDelete.id);
      toast.success("Role deleted successfully");
      setDeleteRoleDialog(false);
      setRoleToDelete(null);
      await loadRoles();
      await loadData(); // Reload users to reflect role changes
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete role");
    }
  };

  const openViewRoleDialog = async (role: Role) => {
    try {
      const fullRole = await getRole(role.id);
      setSelectedRole(fullRole);
      setViewRoleDialog(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load role details");
    }
  };

  const openEditRoleDialog = (role: Role) => {
    setSelectedRole(role);
    setRoleForm({
      id: role.id,
      name: role.name,
      description: role.description || "",
      permissionIds: role.permissions ? role.permissions.map((p) => p.id) : [],
    });
    setRoleError("");
    setEditRoleDialog(true);
  };

  const openAddRoleDialog = () => {
    setRoleForm({ name: "", description: "", permissionIds: [] });
    setRoleError("");
    setAddRoleDialog(true);
  };

  const handleCreateAccountForEmployee = async (user: User) => {
    if (!user.employee) return;

    try {
      // Find EMPLOYEE role
      const employeeRole = roles.find((r) => r.name === "EMPLOYEE");
      if (!employeeRole) {
        toast.error("EMPLOYEE role not found");
        return;
      }

      // Generate default password
      const defaultPassword = `${user.email}${user.employee.employeeCode}`;

      const payload: CreateUserPayload = {
        email: user.email,
        password: defaultPassword,
        firstName: user.firstName,
        lastName: user.lastName,
        roleIds: [employeeRole.id],
        employeeId: user.employee.id,
        status: user.status,
      };

      await createUser(payload);
      toast.success("User account created successfully! Default password: " + defaultPassword);
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create user account");
    }
  };

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

>>>>>>> dev
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions for the system
          </p>
        </div>
<<<<<<< HEAD
        <div className="flex gap-2">
          <Dialog open={addRoleDialog} onOpenChange={setAddRoleDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Shield className="mr-2 h-4 w-4" />
                New Role
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={addUserDialog} onOpenChange={setAddUserDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
=======
        {canManage && (
        <div className="flex gap-2">
            <Button onClick={() => {
              setUserForm({
                email: "",
                password: "",
                confirmPassword: "",
                firstName: "",
                lastName: "",
                roleIds: [],
                employeeId: "",
                status: "ACTIVE",
              });
              setError("");
              setAddUserDialog(true);
            }}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
        </div>
        )}
>>>>>>> dev
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
<<<<<<< HEAD
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
=======
            <UserIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
>>>>>>> dev
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
<<<<<<< HEAD
            <User className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.inactive}
            </div>
=======
            <UserIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
>>>>>>> dev
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
<<<<<<< HEAD
            <div className="text-2xl font-bold text-yellow-600">
              {stats.admins}
            </div>
=======
            <div className="text-2xl font-bold text-yellow-600">{stats.admins}</div>
>>>>>>> dev
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.roles}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Users</CardTitle>
<<<<<<< HEAD
                  <CardDescription>
                    Manage user accounts and access
                  </CardDescription>
=======
                  <CardDescription>Manage user accounts and access</CardDescription>
>>>>>>> dev
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
<<<<<<< HEAD
=======
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
>>>>>>> dev
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
<<<<<<< HEAD
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Last Login</TableHead>
=======
                      <TableHead>Roles</TableHead>
                      <TableHead>Employee</TableHead>
>>>>>>> dev
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
<<<<<<< HEAD
                  {filteredUsers.map((user) => (
=======
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
>>>>>>> dev
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
<<<<<<< HEAD
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                            />
=======
>>>>>>> dev
                            <AvatarFallback>
                              {user.firstName.charAt(0)}
                              {user.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
<<<<<<< HEAD
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
=======
                                <div className="text-sm text-muted-foreground">{user.email}</div>
>>>>>>> dev
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
<<<<<<< HEAD
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role.name)}
                          <Badge variant="outline">{user.role.name}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>
                        {user.lastLogin
                          ? format(user.lastLogin, "MMM dd, HH:mm")
                          : "Never"}
=======
                            <div className="flex flex-wrap gap-1">
                              {user.roles && user.roles.length > 0 ? (
                                user.roles.map((role) => (
                                  <Badge key={role.id} variant="outline" className="flex items-center gap-1">
                                    {getRoleIcon(role.name)}
                                    {role.name}
                                  </Badge>
                                ))
                              ) : user._isUserAccount === false ? (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  No Account
                                </Badge>
                              ) : (
                                <span className="text-sm text-muted-foreground">No roles assigned</span>
                              )}
                        </div>
                      </TableCell>
                      <TableCell>
                            {user.employee ? (
                              <div>
                                <div className="font-medium">
                                  {user.employee.firstName} {user.employee.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {user.employee.employeeCode}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
>>>>>>> dev
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
<<<<<<< HEAD
                            user.isActive
=======
                                user.status === "ACTIVE"
>>>>>>> dev
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
<<<<<<< HEAD
                          {user.isActive ? "Active" : "Inactive"}
=======
                              {user.status === "ACTIVE" ? "Active" : "Inactive"}
>>>>>>> dev
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
<<<<<<< HEAD
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user.id);
                                setEditUserDialog(true);
=======
                                <DropdownMenuItem onClick={() => openViewDialog(user)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {canManage && user._isUserAccount !== false && (
                                  <>
                            <DropdownMenuItem
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        openEditDialog(user);
>>>>>>> dev
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
<<<<<<< HEAD
                            <DropdownMenuItem
                              onClick={() => handleToggleUserStatus(user.id)}
                            >
                              {user.isActive ? (
=======
                                    <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                                      {user.status === "ACTIVE" ? (
>>>>>>> dev
                                <>
                                  <Lock className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Unlock className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
<<<<<<< HEAD
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user.id)}
=======
                                  </>
                                )}
                                {canManage && user._isUserAccount === false && (
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      // Create user account for this employee
                                      handleCreateAccountForEmployee(user);
                                    }}
                                  >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Create Account
                                  </DropdownMenuItem>
                                )}
                                {canDelete && user._isUserAccount !== false && (
                            <DropdownMenuItem
                                    onClick={() => {
                                      setUserToDelete(user);
                                      setDeleteUserDialog(true);
                                    }}
>>>>>>> dev
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
<<<<<<< HEAD
=======
                                )}
>>>>>>> dev
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
<<<<<<< HEAD
                  ))}
                </TableBody>
              </Table>
=======
                      ))
                    )}
                </TableBody>
              </Table>
              )}
>>>>>>> dev
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
<<<<<<< HEAD
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>
                Define roles and assign permissions to control system access
              </CardDescription>
=======
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Roles & Permissions</CardTitle>
                  <CardDescription>
                    Define roles and assign permissions to control system access
                  </CardDescription>
                </div>
                {canManage && (
                  <Button onClick={openAddRoleDialog}>
                    <Shield className="mr-2 h-4 w-4" />
                    Create Role
                  </Button>
                )}
              </div>
>>>>>>> dev
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Permissions</TableHead>
<<<<<<< HEAD
                    <TableHead>System Role</TableHead>
=======
>>>>>>> dev
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
<<<<<<< HEAD
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(role.name)}
                            <span className="font-medium">{role.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {role.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getUsersByRole(role.id).length} users
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 2).map((permission) => (
                            <Badge
                              key={permission.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {permission.name}
                            </Badge>
                          ))}
                          {role.permissions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {role.isSystemRole ? (
                          <Badge className="bg-blue-100 text-blue-800">
                            System
                          </Badge>
                        ) : (
                          <Badge variant="outline">Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                          {!role.isSystemRole && (
                            <>
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteRole(role.id)}
                                disabled={getUsersByRole(role.id).length > 0}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
=======
                  {roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        No roles found
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2">
                              {getRoleIcon(role.name)}
                              <span className="font-medium">{role.name}</span>
                            </div>
                            {role.description && (
                              <div className="text-sm text-muted-foreground">{role.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getUsersByRole(role.id).length} users</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions && role.permissions.slice(0, 3).map((permission) => (
                              <Badge key={permission.id} variant="outline" className="text-xs">
                                {permission.name}
                              </Badge>
                            ))}
                            {role.permissions && role.permissions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openViewRoleDialog(role)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {canManage && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => openEditRoleDialog(role)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                {canDelete && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => {
                                      setRoleToDelete(role);
                                      setDeleteRoleDialog(true);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
>>>>>>> dev
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
<<<<<<< HEAD
      <Dialog open={addUserDialog} onOpenChange={setAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with role and permissions
            </DialogDescription>
          </DialogHeader>
=======
      <Dialog open={addUserDialog} onOpenChange={(open) => {
        setAddUserDialog(open);
        if (!open) setError("");
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account with role and permissions</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

>>>>>>> dev
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first-name">First Name *</Label>
                <Input
                  id="first-name"
                  value={userForm.firstName}
<<<<<<< HEAD
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
=======
                  onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
>>>>>>> dev
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="last-name">Last Name *</Label>
                <Input
                  id="last-name"
                  value={userForm.lastName}
<<<<<<< HEAD
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
=======
                  onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
>>>>>>> dev
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={userForm.email}
<<<<<<< HEAD
                onChange={(e) =>
                  setUserForm((prev) => ({ ...prev, email: e.target.value }))
                }
=======
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
>>>>>>> dev
                placeholder="john.doe@company.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
<<<<<<< HEAD
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={userForm.roleId}
                  onValueChange={(value) =>
                    setUserForm((prev) => ({ ...prev, roleId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
=======
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm Password *</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={userForm.confirmPassword}
                  onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="roles">Roles & Permissions *</Label>
                <Select
                value=""
                onValueChange={(value) => {
                  if (!userForm.roleIds.includes(value)) {
                    setUserForm({ ...userForm, roleIds: [...userForm.roleIds, value] });
                  }
                }}
                >
                <SelectTrigger id="roles">
                  <SelectValue placeholder="Select roles to add" />
                  </SelectTrigger>
                  <SelectContent>
                  {roles
                    .filter((role) => !userForm.roleIds.includes(role.id))
                    .map((role) => (
>>>>>>> dev
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
<<<<<<< HEAD
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  value={userForm.department}
                  onValueChange={(value) =>
                    setUserForm((prev) => ({ ...prev, department: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
=======
              {userForm.roleIds.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {userForm.roleIds.map((roleId) => {
                      const role = roles.find((r) => r.id === roleId);
                      return role ? (
                        <Badge key={roleId} variant="secondary" className="flex items-center gap-1">
                          {role.name}
                          <button
                            onClick={() => {
                              setUserForm({
                                ...userForm,
                                roleIds: userForm.roleIds.filter((id) => id !== roleId),
                              });
                            }}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Permissions are automatically assigned based on the selected roles
                  </p>
                </div>
              )}
              </div>
              <div>
              <Label htmlFor="employee">Employee (Optional)</Label>
                <Select
                value={userForm.employeeId || "__none__"}
                onValueChange={(value) => setUserForm({ ...userForm, employeeId: value === "__none__" ? "" : value })}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select employee to link" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {employees
                    .filter((emp) => !emp.userId) // Only show employees without user accounts
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode}) - {emp.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Link this user account to an existing employee record
              </p>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={userForm.status}
                  onValueChange={(value) =>
                  setUserForm({ ...userForm, status: value as "ACTIVE" | "INACTIVE" })
                  }
                >
                <SelectTrigger id="status">
                  <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
>>>>>>> dev
                  </SelectContent>
                </Select>
              </div>
            </div>
<<<<<<< HEAD
            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={userForm.isActive}
                onCheckedChange={(checked) =>
                  setUserForm((prev) => ({ ...prev, isActive: !!checked }))
                }
              />
              <Label htmlFor="active">Active user account</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddUserDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser}>Add User</Button>
            </div>
          </div>
=======

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserDialog(false)} disabled={submitting}>
                Cancel
              </Button>
            <Button onClick={handleAddUser} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialog} onOpenChange={(open) => {
        setEditUserDialog(open);
        if (!open) {
          setSelectedUser(null);
          setError("");
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user account information</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
            <div>
                <Label htmlFor="edit-first-name">First Name</Label>
              <Input
                  id="edit-first-name"
                  value={userForm.firstName}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
                <Label htmlFor="edit-last-name">Last Name</Label>
              <Input
                  id="edit-last-name"
                  value={userForm.lastName}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={userForm.email}
                readOnly
                className="bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-password">New Password (Leave blank to keep current)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Leave blank to keep current"
                />
              </div>
              <div>
                <Label htmlFor="edit-confirm-password">Confirm New Password</Label>
                <Input
                  id="edit-confirm-password"
                  type="password"
                  value={userForm.confirmPassword}
                  onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-roles">Roles & Permissions *</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (!userForm.roleIds.includes(value)) {
                    setUserForm({ ...userForm, roleIds: [...userForm.roleIds, value] });
                  }
                }}
              >
                <SelectTrigger id="edit-roles">
                  <SelectValue placeholder="Select roles to add" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((role) => !userForm.roleIds.includes(role.id))
                    .map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {userForm.roleIds.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {userForm.roleIds.map((roleId) => {
                      const role = roles.find((r) => r.id === roleId);
                      return role ? (
                        <Badge key={roleId} variant="secondary" className="flex items-center gap-1">
                          {role.name}
                          <button
                            onClick={() => {
                              setUserForm({
                                ...userForm,
                                roleIds: userForm.roleIds.filter((id) => id !== roleId),
                              });
                            }}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ) : null;
                    })}
                      </div>
                  <p className="text-xs text-muted-foreground">
                    Permissions are automatically assigned based on the selected roles
                  </p>
                  </div>
              )}
            </div>
            <div>
              <Label htmlFor="edit-employee">Employee</Label>
              <Input
                id="edit-employee"
                value={selectedUser?.employee 
                  ? `${selectedUser.employee.firstName} ${selectedUser.employee.lastName} (${selectedUser.employee.employeeCode})`
                  : "Not linked"}
                readOnly
                className="bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Input
                id="edit-status"
                value={userForm.status === "ACTIVE" ? "Active" : "Inactive"}
                readOnly
                className="bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Status is synchronized with employee record. Change employee status from Employee Management page.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserDialog(false)} disabled={submitting}>
                Cancel
              </Button>
            <Button onClick={handleEditUser} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={viewUserDialog} onOpenChange={setViewUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              {selectedUser._isUserAccount === false && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This employee does not have a user account yet. Click "Create Account" to enable login access.
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="font-medium">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
            </div>
                <div>
                  <Label>Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
          </div>
                <div>
                  <Label>Status</Label>
                  <Badge
                    className={
                      selectedUser.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {selectedUser.status}
                  </Badge>
                </div>
                <div>
                  <Label>Roles</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedUser.roles && selectedUser.roles.length > 0 ? (
                      selectedUser.roles.map((role) => (
                        <Badge key={role.id} variant="outline">
                          {role.name}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        No Account
                      </Badge>
                    )}
                  </div>
                </div>
                {selectedUser.employee && (
                  <>
                    <div>
                      <Label>Linked Employee</Label>
                      <p className="font-medium">
                        {selectedUser.employee.firstName} {selectedUser.employee.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedUser.employee.employeeCode}
                      </p>
                    </div>
                    <div>
                      <Label>Designation</Label>
                      <p className="font-medium">{selectedUser.employee.designation || "—"}</p>
                    </div>
                    {selectedUser.employee.department && (
                      <div>
                        <Label>Department</Label>
                        <p className="font-medium">{selectedUser.employee.department.name}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {selectedUser.permissions && selectedUser.permissions.length > 0 && (
                <div>
                  <Label>Permissions</Label>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    <div className="flex flex-wrap gap-1">
                      {selectedUser.permissions.map((permission) => (
                        <Badge key={permission.id} variant="outline" className="text-xs">
                          {permission.name}
                        </Badge>
                      ))}
                    </div>
                    {selectedUser.permissions.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {selectedUser.permissions.length} permission{selectedUser.permissions.length !== 1 ? 's' : ''} assigned via roles
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUserDialog(false)}>
              Close
            </Button>
            {canManage && selectedUser && selectedUser._isUserAccount === false && (
              <Button onClick={() => {
                setViewUserDialog(false);
                handleCreateAccountForEmployee(selectedUser);
              }}>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </Button>
            )}
            {canManage && selectedUser && selectedUser._isUserAccount !== false && (
              <Button onClick={() => {
                setViewUserDialog(false);
                openEditDialog(selectedUser);
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteUserDialog} onOpenChange={setDeleteUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {userToDelete && (
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Name:</strong> {userToDelete.firstName} {userToDelete.lastName}
              </p>
              <p className="text-sm">
                <strong>Email:</strong> {userToDelete.email}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteUserDialog(false);
              setUserToDelete(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
>>>>>>> dev
        </DialogContent>
      </Dialog>

      {/* Add Role Dialog */}
<<<<<<< HEAD
      <Dialog open={addRoleDialog} onOpenChange={setAddRoleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a new role with specific permissions
            </DialogDescription>
          </DialogHeader>
=======
      <Dialog open={addRoleDialog} onOpenChange={(open) => {
        setAddRoleDialog(open);
        if (!open) setRoleError("");
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>Create a new role and assign permissions</DialogDescription>
          </DialogHeader>

          {roleError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{roleError}</AlertDescription>
            </Alert>
          )}

>>>>>>> dev
          <div className="space-y-4">
            <div>
              <Label htmlFor="role-name">Role Name *</Label>
              <Input
                id="role-name"
                value={roleForm.name}
<<<<<<< HEAD
                onChange={(e) =>
                  setRoleForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Team Lead"
              />
            </div>
            <div>
              <Label htmlFor="role-description">Description *</Label>
              <Input
                id="role-description"
                value={roleForm.description}
                onChange={(e) =>
                  setRoleForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of the role"
              />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-4 mt-2 max-h-60 overflow-y-auto">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={permission.id}
                      checked={roleForm.permissions.includes(permission.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setRoleForm((prev) => ({
                            ...prev,
                            permissions: [...prev.permissions, permission.id],
                          }));
                        } else {
                          setRoleForm((prev) => ({
                            ...prev,
                            permissions: prev.permissions.filter(
                              (p) => p !== permission.id
                            ),
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={permission.id} className="text-sm">
                      <div className="font-medium">{permission.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {permission.description}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddRoleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRole}>Create Role</Button>
            </div>
          </div>
=======
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                placeholder="e.g., HR Manager"
              />
            </div>
            <div>
              <Label htmlFor="role-description">Description</Label>
              <Input
                id="role-description"
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="Optional description for this role"
              />
            </div>
            <div>
              <Label>Permissions *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select the permissions to assign to this role
              </p>
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-4">
                {Object.entries(permissionsByModule).map(([module, perms]) => (
                  <div key={module}>
                    <h4 className="font-medium mb-2 capitalize">{module.replace(/_/g, ' ')}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`perm-${permission.id}`}
                            checked={roleForm.permissionIds.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setRoleForm({
                                  ...roleForm,
                                  permissionIds: [...roleForm.permissionIds, permission.id],
                                });
                              } else {
                                setRoleForm({
                                  ...roleForm,
                                  permissionIds: roleForm.permissionIds.filter((id) => id !== permission.id),
                                });
                              }
                            }}
                          />
                          <Label
                            htmlFor={`perm-${permission.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {permission.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {roleForm.permissionIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {roleForm.permissionIds.length} permission(s) selected
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRoleDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAddRole} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleDialog} onOpenChange={(open) => {
        setEditRoleDialog(open);
        if (!open) {
          setSelectedRole(null);
          setRoleError("");
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role information and permissions</DialogDescription>
          </DialogHeader>

          {roleError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{roleError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-role-name">Role Name *</Label>
              <Input
                id="edit-role-name"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                placeholder="e.g., HR Manager"
              />
            </div>
            <div>
              <Label htmlFor="edit-role-description">Description</Label>
              <Input
                id="edit-role-description"
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="Optional description for this role"
              />
            </div>
            <div>
              <Label>Permissions *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select the permissions to assign to this role
              </p>
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-4">
                {Object.entries(permissionsByModule).map(([module, perms]) => (
                  <div key={module}>
                    <h4 className="font-medium mb-2 capitalize">{module.replace(/_/g, ' ')}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-perm-${permission.id}`}
                            checked={roleForm.permissionIds.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setRoleForm({
                                  ...roleForm,
                                  permissionIds: [...roleForm.permissionIds, permission.id],
                                });
                              } else {
                                setRoleForm({
                                  ...roleForm,
                                  permissionIds: roleForm.permissionIds.filter((id) => id !== permission.id),
                                });
                              }
                            }}
                          />
                          <Label
                            htmlFor={`edit-perm-${permission.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {permission.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {roleForm.permissionIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {roleForm.permissionIds.length} permission(s) selected
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleEditRole} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Role Dialog */}
      <Dialog open={viewRoleDialog} onOpenChange={setViewRoleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Role Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedRole?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Role Name</Label>
                  <p className="font-medium">{selectedRole.name}</p>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="font-medium">{selectedRole.description || "—"}</p>
                </div>
                <div>
                  <Label>Assigned Users</Label>
                  <Badge variant="secondary">{getUsersByRole(selectedRole.id).length} users</Badge>
                </div>
              </div>
              <div>
                <Label>Permissions ({selectedRole.permissions?.length || 0})</Label>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                  {selectedRole.permissions && selectedRole.permissions.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedRole.permissions.map((permission) => (
                        <Badge key={permission.id} variant="outline" className="text-xs">
                          {permission.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No permissions assigned</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRoleDialog(false)}>
              Close
            </Button>
            {canManage && selectedRole && (
              <Button onClick={() => {
                setViewRoleDialog(false);
                openEditRoleDialog(selectedRole);
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Role
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation Dialog */}
      <Dialog open={deleteRoleDialog} onOpenChange={setDeleteRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this role? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {roleToDelete && (
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Role:</strong> {roleToDelete.name}
              </p>
              <p className="text-sm">
                <strong>Assigned to:</strong> {getUsersByRole(roleToDelete.id).length} user(s)
              </p>
              {getUsersByRole(roleToDelete.id).length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This role is assigned to {getUsersByRole(roleToDelete.id).length} user(s). 
                    You cannot delete it until all users are removed from this role.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteRoleDialog(false);
              setRoleToDelete(null);
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteRole}
              disabled={roleToDelete && getUsersByRole(roleToDelete.id).length > 0}
            >
              Delete Role
            </Button>
          </DialogFooter>
>>>>>>> dev
        </DialogContent>
      </Dialog>
    </div>
  );
}
