export interface NotificationItem {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  audience: string;
  requiredPermission?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  targetUrl?: string | null;
  readAt?: string | null;
  createdAt: string;
  expiresAt?: string | null;
  broadcastId?: string | null;
}

export interface NotificationPage {
  items: NotificationItem[];
  page: number;
  pageSize: number;
  total: number;
  unreadCount: number;
}

export interface BroadcastInput {
  title: string;
  message: string;
  audience: 'All' | 'Role' | 'Selected';
  role?: 'Student' | 'Partner' | 'Admin' | 'Moderator' | 'Verificator';
  recipientAccountIds?: string[];
  targetUrl?: string;
  expiresAt?: string;
}

export interface NotificationBroadcast extends BroadcastInput {
  id: string;
  status: 'Draft' | 'Queued' | 'Processing' | 'Completed' | 'Cancelled' | 'Failed';
  recipientCount: number;
  processedCount: number;
  createdAt: string;
  publishedAt?: string | null;
  completedAt?: string | null;
  lastError?: string | null;
}
