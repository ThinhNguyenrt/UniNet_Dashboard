import { createContext, useContext } from 'react';
import type { AdminCapabilities } from '../types/admin-management';

interface ManagementAccess { capabilities: AdminCapabilities | null; loading: boolean; error: string; has: (permission: string) => boolean; refresh: () => void }
export const AdminManagementContext = createContext<ManagementAccess | null>(null);
export function useAdminManagement() { const context = useContext(AdminManagementContext); if (!context) throw new Error('AdminManagementProvider is required'); return context; }
