/**
 * Admin Feature Types
 */

export interface AdminReport {
  id: string;
  dealId: string;
  userId: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: string;
}

export interface AdminDeal {
  id: string;
  title: string;
  description: string;
  restaurantName: string;
  createdAt: string;
  status: 'active' | 'hidden' | 'deleted';
  reportCount: number;
}

export interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  createdAt: string;
  isAdmin: boolean;
  isBanned: boolean;
}
