import React, { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserPlus,
  Shield,
  Settings,
  Search,
  MoreHorizontal,
  Lock,
  Unlock,
  Trash2,
  Edit,
  Eye,
  Users as UsersIcon,
  Crown,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from '@/components/ui/checkbox';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addUserDialog, setAddUserDialog] = useState(false);
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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
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
  };

  const stats = {
    total: users.length,
    active: getActiveUsers().length,
    inactive: users.filter((u) => !u.isActive).length,
    admins: users.filter((u) => u.role.name.toLowerCase().includes("admin"))
      .length,
    roles: roles.length,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions for the system
          </p>
        </div>
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
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <User className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.inactive}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.admins}
            </div>
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
                  <CardDescription>
                    Manage user accounts and access
                  </CardDescription>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                            />
                            <AvatarFallback>
                              {user.firstName.charAt(0)}
                              {user.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {user.isActive ? "Active" : "Inactive"}
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
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user.id);
                                setEditUserDialog(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleUserStatus(user.id)}
                            >
                              {user.isActive ? (
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
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>
                Define roles and assign permissions to control system access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>System Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
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
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={addUserDialog} onOpenChange={setAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with role and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first-name">First Name *</Label>
                <Input
                  id="first-name"
                  value={userForm.firstName}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="last-name">Last Name *</Label>
                <Input
                  id="last-name"
                  value={userForm.lastName}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
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
                onChange={(e) =>
                  setUserForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="john.doe@company.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
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
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  </SelectContent>
                </Select>
              </div>
            </div>
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
        </DialogContent>
      </Dialog>

      {/* Add Role Dialog */}
      <Dialog open={addRoleDialog} onOpenChange={setAddRoleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a new role with specific permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role-name">Role Name *</Label>
              <Input
                id="role-name"
                value={roleForm.name}
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
