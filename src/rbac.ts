import { User } from './types';

export type SystemRole = 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER';

export interface RBACConfig {
  canSeeTestsAndDocs: boolean;
  canManageUsers: boolean;
  canCreateSuperAdmin: boolean;
  canCreateAdmin: boolean;
  canSeeFinance: boolean;
  canSeeCustomers: boolean;
  canSeeAudit: boolean;
  canSeeSettings: boolean;
  canCreateCategory: boolean;
  canCreateProduct: boolean;
  requiresApprovalForNewProduct: boolean;
  requiresApprovalForNewCustomer: boolean;
  canApproveRequests: boolean;
}

export const ROLE_CONFIGS: Record<SystemRole, RBACConfig> = {
  SUPER_ADMIN: {
    canSeeTestsAndDocs: true,
    canManageUsers: true,
    canCreateSuperAdmin: false,
    canCreateAdmin: true,
    canSeeFinance: true,
    canSeeCustomers: true,
    canSeeAudit: true,
    canSeeSettings: true,
    canCreateCategory: true,
    canCreateProduct: true,
    requiresApprovalForNewProduct: false,
    requiresApprovalForNewCustomer: false,
    canApproveRequests: true,
  },
  ADMIN: {
    canSeeTestsAndDocs: false,
    canManageUsers: true,
    canCreateSuperAdmin: false,
    canCreateAdmin: true,
    canSeeFinance: true,
    canSeeCustomers: true,
    canSeeAudit: true,
    canSeeSettings: true,
    canCreateCategory: true,
    canCreateProduct: true,
    requiresApprovalForNewProduct: false,
    requiresApprovalForNewCustomer: false,
    canApproveRequests: true,
  },
  CASHIER: {
    canSeeTestsAndDocs: false,
    canManageUsers: false,
    canCreateSuperAdmin: false,
    canCreateAdmin: false,
    canSeeFinance: false,
    canSeeCustomers: false,
    canSeeAudit: false,
    canSeeSettings: false,
    canCreateCategory: false,
    canCreateProduct: true,
    requiresApprovalForNewProduct: true,
    requiresApprovalForNewCustomer: true,
    canApproveRequests: false,
  }
};

export function getRoleConfig(roleId: string): RBACConfig {
  if (roleId === 'role-superadmin' || roleId === 'SUPER_ADMIN') return ROLE_CONFIGS.SUPER_ADMIN;
  if (roleId === 'role-admin' || roleId === 'ADMIN') return ROLE_CONFIGS.ADMIN;
  return ROLE_CONFIGS.CASHIER; // Default safe fallback
}

export function getUserRole(user: User): SystemRole {
  if (user.roleId === 'role-superadmin' || user.roleId === 'SUPER_ADMIN') return 'SUPER_ADMIN';
  if (user.roleId === 'role-admin' || user.roleId === 'ADMIN') return 'ADMIN';
  return 'CASHIER';
}
