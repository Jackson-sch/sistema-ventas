/**
 * Barrel file that re-exports all fetcher functions from their modular locations.
 * Maintains backward compatibility with existing `import { ... } from "@/actions/data-fetchers"`.
 *
 * NOTE: This file intentionally does NOT have "use server".
 * The individual fetcher files each declare "use server" on their own.
 * We use import-then-export (not `export { x } from "y"`) because Turbopack
 * cannot resolve the latter pattern across "use server" boundaries.
 */

// Catalog
import { getProductsData } from "./catalog-fetchers";

// Clients
import { getClientsData } from "./client-fetchers";

// Branches
import { getBranchesAndRegistersData } from "./branch-fetchers";

// Users
import { getUsersAndRolesData } from "./user-fetchers";

// Suppliers & Purchases
import { getSuppliersData, getPurchasesData } from "./supplier-fetchers";

// Kardex
import { getKardexMovementsData } from "./kardex-fetchers";

// Audit
import { getAuditLogsData } from "./audit-fetchers";

// Sales
import { getSalesHistoryData } from "./sales-fetchers";

// Dashboard
import { getDashboardData } from "./dashboard-fetchers";
import type { DashboardData } from "./dashboard-fetchers";

export {
  getProductsData,
  getClientsData,
  getBranchesAndRegistersData,
  getUsersAndRolesData,
  getSuppliersData,
  getPurchasesData,
  getKardexMovementsData,
  getAuditLogsData,
  getSalesHistoryData,
  getDashboardData,
};

export type { DashboardData };
