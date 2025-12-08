/**
 * Local storage utilities for persisting user data
 * Implements TTL (Time To Live) for cached data
 * 
 * IMPORTANT: Sessions are now stored per-user to prevent cross-user data access
 * - Guest sessions use a generic key
 * - Logged-in users have their session stored with their UID
 */

const STORAGE_KEYS = {
    // Guest session key (for unauthenticated users)
    GUEST_SESSION_ID: 'sql_workspace_guest_session_id',
    GUEST_SESSION_EXPIRY: 'sql_workspace_guest_session_expiry',
    // User session prefix (will be combined with user UID)
    USER_SESSION_PREFIX: 'sql_workspace_user_session_',
    USER_SESSION_EXPIRY_PREFIX: 'sql_workspace_user_session_expiry_',
    // Current logged-in user ID (to detect user switches)
    CURRENT_USER_ID: 'sql_workspace_current_user_id',
    // Query storage
    CURRENT_QUERY: 'sql_workspace_current_query',
    QUERY_PREFIX: 'sql_workspace_query_',
} as const;

const GUEST_TTL_HOURS = 1; // 1 hour TTL for guests
const USER_TTL_HOURS = 24; // 24 hours TTL for logged-in users

/**
 * Check if stored data has expired
 */
function isExpired(expiryTime: string | null): boolean {
    if (!expiryTime) return true;
    return new Date().getTime() > new Date(expiryTime).getTime();
}

/**
 * Get expiry time (current time + TTL)
 */
function getExpiryTime(isLoggedIn: boolean = false): string {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + (isLoggedIn ? USER_TTL_HOURS : GUEST_TTL_HOURS));
    return expiry.toISOString();
}

/**
 * Session Storage - Now supports per-user sessions
 */
export const sessionStorage = {
    /**
     * Save session for a specific user (or guest)
     */
    save: (sessionId: string, userId?: string | null, expiresAt?: string) => {
        if (typeof window === 'undefined') return;
        
        try {
            if (userId) {
                // Save user-specific session
                localStorage.setItem(`${STORAGE_KEYS.USER_SESSION_PREFIX}${userId}`, sessionId);
                localStorage.setItem(
                    `${STORAGE_KEYS.USER_SESSION_EXPIRY_PREFIX}${userId}`,
                    expiresAt || getExpiryTime(true)
                );
                // Track current user
                localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
            } else {
                // Save guest session
                localStorage.setItem(STORAGE_KEYS.GUEST_SESSION_ID, sessionId);
                localStorage.setItem(
                    STORAGE_KEYS.GUEST_SESSION_EXPIRY,
                    expiresAt || getExpiryTime(false)
                );
                // Clear current user tracking
                localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
            }
        } catch (error) {
            console.error('Error saving session to localStorage:', error);
        }
    },

    /**
     * Get session for a specific user (or guest)
     */
    get: (userId?: string | null): string | null => {
        if (typeof window === 'undefined') return null;
        
        try {
            let sessionId: string | null;
            let expiry: string | null;
            
            if (userId) {
                // Get user-specific session
                sessionId = localStorage.getItem(`${STORAGE_KEYS.USER_SESSION_PREFIX}${userId}`);
                expiry = localStorage.getItem(`${STORAGE_KEYS.USER_SESSION_EXPIRY_PREFIX}${userId}`);
            } else {
                // Get guest session
                sessionId = localStorage.getItem(STORAGE_KEYS.GUEST_SESSION_ID);
                expiry = localStorage.getItem(STORAGE_KEYS.GUEST_SESSION_EXPIRY);
            }
            
            if (!sessionId || isExpired(expiry)) {
                sessionStorage.clear(userId);
                return null;
            }
            
            return sessionId;
        } catch (error) {
            console.error('Error getting session from localStorage:', error);
            return null;
        }
    },

    /**
     * Get expiry time for a specific user (or guest)
     */
    getExpiry: (userId?: string | null): string | null => {
        if (typeof window === 'undefined') return null;
        
        try {
            if (userId) {
                return localStorage.getItem(`${STORAGE_KEYS.USER_SESSION_EXPIRY_PREFIX}${userId}`);
            }
            return localStorage.getItem(STORAGE_KEYS.GUEST_SESSION_EXPIRY);
        } catch (error) {
            console.error('Error getting session expiry:', error);
            return null;
        }
    },

    /**
     * Clear session for a specific user (or guest)
     */
    clear: (userId?: string | null) => {
        if (typeof window === 'undefined') return;
        
        try {
            if (userId) {
                // Clear user-specific session
                localStorage.removeItem(`${STORAGE_KEYS.USER_SESSION_PREFIX}${userId}`);
                localStorage.removeItem(`${STORAGE_KEYS.USER_SESSION_EXPIRY_PREFIX}${userId}`);
            } else {
                // Clear guest session
                localStorage.removeItem(STORAGE_KEYS.GUEST_SESSION_ID);
                localStorage.removeItem(STORAGE_KEYS.GUEST_SESSION_EXPIRY);
            }
        } catch (error) {
            console.error('Error clearing session from localStorage:', error);
        }
    },

    /**
     * Clear ALL sessions (guest + all users) - used on complete logout
     */
    clearAll: () => {
        if (typeof window === 'undefined') return;
        
        try {
            // Clear guest session
            localStorage.removeItem(STORAGE_KEYS.GUEST_SESSION_ID);
            localStorage.removeItem(STORAGE_KEYS.GUEST_SESSION_EXPIRY);
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
            
            // Note: We don't clear user-specific sessions here
            // Those are tied to specific users and should persist
        } catch (error) {
            console.error('Error clearing all sessions:', error);
        }
    },

    /**
     * Check if session is valid for a specific user (or guest)
     */
    isValid: (userId?: string | null): boolean => {
        if (typeof window === 'undefined') return false;
        
        try {
            let sessionId: string | null;
            let expiry: string | null;
            
            if (userId) {
                sessionId = localStorage.getItem(`${STORAGE_KEYS.USER_SESSION_PREFIX}${userId}`);
                expiry = localStorage.getItem(`${STORAGE_KEYS.USER_SESSION_EXPIRY_PREFIX}${userId}`);
            } else {
                sessionId = localStorage.getItem(STORAGE_KEYS.GUEST_SESSION_ID);
                expiry = localStorage.getItem(STORAGE_KEYS.GUEST_SESSION_EXPIRY);
            }
            
            return !!sessionId && !isExpired(expiry);
        } catch (error) {
            return false;
        }
    },

    /**
     * Get the current logged-in user ID (if any)
     */
    getCurrentUserId: (): string | null => {
        if (typeof window === 'undefined') return null;
        try {
            return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
        } catch {
            return null;
        }
    },

    /**
     * Check if a different user has logged in (user switch detection)
     */
    hasUserChanged: (newUserId: string | null): boolean => {
        const currentUserId = sessionStorage.getCurrentUserId();
        // User changed if:
        // - We had a user and now we don't (logout)
        // - We didn't have a user and now we do (login)
        // - We had a different user (user switch)
        if (currentUserId === null && newUserId === null) return false;
        if (currentUserId === null || newUserId === null) return true;
        return currentUserId !== newUserId;
    },
};

/**
 * Query Storage - Now supports per-user query storage
 */
export const queryStorage = {
    /**
     * Save query for a specific user (or guest)
     */
    save: (query: string, userId?: string | null) => {
        if (typeof window === 'undefined') return;
        
        try {
            const key = userId 
                ? `${STORAGE_KEYS.QUERY_PREFIX}${userId}` 
                : STORAGE_KEYS.CURRENT_QUERY;
            localStorage.setItem(key, query);
        } catch (error) {
            console.error('Error saving query to localStorage:', error);
        }
    },

    /**
     * Get query for a specific user (or guest)
     */
    get: (userId?: string | null): string => {
        if (typeof window === 'undefined') return '';
        
        try {
            const key = userId 
                ? `${STORAGE_KEYS.QUERY_PREFIX}${userId}` 
                : STORAGE_KEYS.CURRENT_QUERY;
            return localStorage.getItem(key) || '';
        } catch (error) {
            console.error('Error getting query from localStorage:', error);
            return '';
        }
    },

    /**
     * Clear query for a specific user (or guest)
     */
    clear: (userId?: string | null) => {
        if (typeof window === 'undefined') return;
        
        try {
            const key = userId 
                ? `${STORAGE_KEYS.QUERY_PREFIX}${userId}` 
                : STORAGE_KEYS.CURRENT_QUERY;
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error clearing query from localStorage:', error);
        }
    },
};

/**
 * Clear all app data from localStorage for a specific user
 */
export function clearAllStorage(userId?: string | null) {
    sessionStorage.clear(userId);
    queryStorage.clear(userId);
}

/**
 * Clear guest data only (used when user logs in)
 */
export function clearGuestStorage() {
    sessionStorage.clear(null);
    queryStorage.clear(null);
}

