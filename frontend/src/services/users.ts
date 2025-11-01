import api from './api';

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: Permission[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
  action: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'ACTIVE' | 'INACTIVE';
  roles: Role[];
  permissions?: Permission[];
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    designation?: string;
    department?: {
      id: string;
      name: string;
    };
  } | null;
  createdAt?: string;
  updatedAt?: string;
  _isUserAccount?: boolean; // Flag to indicate if this is a real user account or just an employee
}

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds: string[];
  employeeId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateUserPayload {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  roleIds?: string[];
  employeeId?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface ListUsersResponse {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListUsersQuery {
  search?: string;
  roleId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  page?: number;
  pageSize?: number;
}

export async function listUsers(query?: ListUsersQuery): Promise<ListUsersResponse> {
  const { data } = await api.get('/users', { params: query });
  return data;
}

export async function getUser(id: string): Promise<User> {
  const { data } = await api.get(`/users/${id}`);
  return data;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await api.post('/users', payload);
  return data;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const { data } = await api.put(`/users/${id}`, payload);
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

export async function getRoles(): Promise<Role[]> {
  const { data } = await api.get('/users/roles');
  return data;
}

export async function getPermissions(): Promise<Permission[]> {
  const { data } = await api.get('/users/permissions');
  return data;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export async function getRole(id: string): Promise<Role> {
  const { data } = await api.get(`/users/roles/${id}`);
  return data;
}

export async function createRole(payload: CreateRolePayload): Promise<Role> {
  const { data } = await api.post('/users/roles', payload);
  return data;
}

export async function updateRole(id: string, payload: UpdateRolePayload): Promise<Role> {
  const { data } = await api.put(`/users/roles/${id}`, payload);
  return data;
}

export async function deleteRole(id: string): Promise<void> {
  await api.delete(`/users/roles/${id}`);
}
