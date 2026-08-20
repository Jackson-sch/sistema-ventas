"use server";

import { revalidatePath } from "next/cache";
import {
  MASTER_ROLES,
  MASTER_PERMISSIONS,
  DEFAULT_MATRIX,
  RolePermissionMatrix,
} from "@/lib/permissions-data";

let inMemoryMatrix: Record<string, Record<string, boolean>> = JSON.parse(JSON.stringify(DEFAULT_MATRIX));

export async function getRolePermissionsMatrixAction(): Promise<RolePermissionMatrix> {
  return {
    roles: MASTER_ROLES,
    categories: MASTER_PERMISSIONS,
    matrix: inMemoryMatrix,
  };
}

export async function updatePermissionAction(
  roleId: string,
  permissionId: string,
  enabled: boolean
): Promise<{ success: boolean }> {
  if (!inMemoryMatrix[roleId]) inMemoryMatrix[roleId] = {};
  inMemoryMatrix[roleId][permissionId] = enabled;
  revalidatePath("/usuarios/permisos");
  return { success: true };
}

export async function saveAllPermissionsMatrixAction(
  matrix: Record<string, Record<string, boolean>>
): Promise<{ success: boolean }> {
  inMemoryMatrix = JSON.parse(JSON.stringify(matrix));
  revalidatePath("/usuarios/permisos");
  return { success: true };
}

export async function resetPermissionsAction(roleId?: string): Promise<{ success: boolean; matrix: Record<string, Record<string, boolean>> }> {
  if (roleId) {
    inMemoryMatrix[roleId] = JSON.parse(JSON.stringify(DEFAULT_MATRIX[roleId] || {}));
  } else {
    inMemoryMatrix = JSON.parse(JSON.stringify(DEFAULT_MATRIX));
  }
  revalidatePath("/usuarios/permisos");
  return { success: true, matrix: inMemoryMatrix };
}
