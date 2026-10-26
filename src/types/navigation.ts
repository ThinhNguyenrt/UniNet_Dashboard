import type { LucideIcon } from 'lucide-react';

export interface NavigationSubItem {
  id: string;
  label: string;
  path: string;
  icon?: LucideIcon;
  badge?: string;
}

export interface NavigationItem {
  section?: string;
  permission?: string;
  id: string;
  label: string;
  path?: string;
  icon: LucideIcon;
  badge?: string;
  children?: NavigationSubItem[];
}
