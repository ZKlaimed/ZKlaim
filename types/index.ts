/**
 * Core Type Definitions
 * Re-exports all types and defines common interfaces
 */

// Re-export all types
export * from './policy';
export * from './claim';
export * from './pool';
export * from './user';
export * from './blockchain';
export * from './oracle';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * Pagination parameters for list endpoints
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Base model with common timestamp fields
 */
export interface BaseModel {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Async operation status for UI state management
 */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Generic async state wrapper
 */
export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: string | null;
}

/**
 * Navigation item for menus
 */
export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  external?: boolean;
  children?: NavItem[];
}

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'system';
