export type UserRole = 'admin' | 'verificator' | 'moderator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleName: string;
  avatar?: string;
  description?: string;
}

export interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  switchRoleForDev?: (role: UserRole) => void;
}
