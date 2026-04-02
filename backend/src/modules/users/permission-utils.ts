type RolePermissionShape = {
  role: {
    permissions: Array<{
      permission: {
        id: string;
        name: string;
        description?: string | null;
        module: string;
        action: string;
      };
    }>;
  };
};

type UserPermissionShape = {
  allowed: boolean;
  permission: {
    id: string;
    name: string;
    description?: string | null;
    module: string;
    action: string;
  };
};

export function buildEffectivePermissionDetails(
  userRoles: RolePermissionShape[],
  userPermissions: UserPermissionShape[]
) {
  const map = new Map<
    string,
    { id: string; name: string; description?: string; module: string; action: string }
  >();

  for (const ur of userRoles) {
    for (const rp of ur.role.permissions) {
      map.set(rp.permission.id, {
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description ?? undefined,
        module: rp.permission.module,
        action: rp.permission.action,
      });
    }
  }

  for (const up of userPermissions) {
    if (up.allowed) {
      map.set(up.permission.id, {
        id: up.permission.id,
        name: up.permission.name,
        description: up.permission.description ?? undefined,
        module: up.permission.module,
        action: up.permission.action,
      });
    } else {
      map.delete(up.permission.id);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function buildEffectivePermissionNames(
  userRoles: RolePermissionShape[],
  userPermissions: UserPermissionShape[]
) {
  return buildEffectivePermissionDetails(userRoles, userPermissions).map((p) => p.name);
}

