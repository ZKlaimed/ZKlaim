/**
 * App Store
 * Global application state using Zustand
 */

import { create } from 'zustand';

/**
 * App state interface
 */
interface AppState {
  // UI state
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;

  // Theme
  theme: 'light' | 'dark' | 'system';

  // Notifications
  notifications: Notification[];

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

/**
 * Notification type
 */
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  timestamp: number;
  duration?: number; // Auto-dismiss after ms (0 = no auto-dismiss)
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Zustand app store
 */
export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  isSidebarOpen: true,
  isMobileMenuOpen: false,
  theme: 'system',
  notifications: [],

  // Sidebar actions
  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  setSidebarOpen: (open: boolean) => {
    set({ isSidebarOpen: open });
  },

  // Mobile menu actions
  toggleMobileMenu: () => {
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen }));
  },

  setMobileMenuOpen: (open: boolean) => {
    set({ isMobileMenuOpen: open });
  },

  // Theme action
  setTheme: (theme) => {
    set({ theme });
    // Apply theme to document
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      if (theme !== 'system') {
        root.classList.add(theme);
      }
    }
  },

  // Notification actions
  addNotification: (notification) => {
    const id = generateId();
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-dismiss if duration is set
    const duration = notification.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }

    return id;
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },
}));
