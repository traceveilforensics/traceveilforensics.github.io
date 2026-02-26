// Professional Authentication Manager
// Handles JWT tokens, refresh tokens, and session management

const AuthManager = {
    tokenKey: 'authToken',
    refreshTokenKey: 'refreshToken',
    userKey: 'authUser',
    rememberKey: 'authRemember',
    tokenExpiryKey: 'authTokenExpiry',

    getToken() {
        return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
    },

    getRefreshToken() {
        return localStorage.getItem(this.refreshTokenKey) || sessionStorage.getItem(this.refreshTokenKey);
    },

    getUser() {
        const userStr = localStorage.getItem(this.userKey);
        return userStr ? JSON.parse(userStr) : null;
    },

    isRememberMe() {
        return localStorage.getItem(this.rememberKey) === 'true';
    },

    setAuth(data) {
        const storage = this.isRememberMe() ? localStorage : sessionStorage;
        storage.setItem(this.tokenKey, data.token);
        storage.setItem(this.refreshTokenKey, data.refreshToken || '');
        localStorage.setItem(this.userKey, JSON.stringify(data.user));
        
        const expiresAt = Date.now() + (60 * 60 * 1000);
        localStorage.setItem(this.tokenExpiryKey, expiresAt.toString());
    },

    setRememberMe(value) {
        if (value) {
            localStorage.setItem(this.rememberKey, 'true');
        } else {
            localStorage.removeItem(this.rememberKey);
        }
    },

    clearAuth() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.rememberKey);
        localStorage.removeItem(this.tokenExpiryKey);
        sessionStorage.removeItem(this.tokenKey);
        sessionStorage.removeItem(this.refreshTokenKey);
    },

    isAuthenticated() {
        const token = this.getToken();
        const user = this.getUser();
        return !!(token && user);
    },

    isTokenExpired() {
        const expiry = localStorage.getItem(this.tokenExpiryKey);
        if (!expiry) return true;
        return Date.now() > parseInt(expiry);
    },

    async refreshAccessToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            this.clearAuth();
            return false;
        }

        try {
            const response = await fetch('/api/auth-refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                const storage = this.isRememberMe() ? localStorage : sessionStorage;
                storage.setItem(this.tokenKey, data.token);
                storage.setItem(this.refreshTokenKey, data.refreshToken);
                
                const expiresAt = Date.now() + (60 * 60 * 1000);
                localStorage.setItem(this.tokenExpiryKey, expiresAt.toString());
                return true;
            } else {
                this.clearAuth();
                return false;
            }
        } catch (error) {
            this.clearAuth();
            return false;
        }
    },

    async ensureValidToken() {
        if (this.isTokenExpired()) {
            return await this.refreshAccessToken();
        }
        return true;
    },

    getAuthHeaders() {
        const token = this.getToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    },

    async apiRequest(url, options = {}) {
        await this.ensureValidToken();
        
        const response = await fetch(url, {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers
            }
        });

        if (response.status === 401 && await this.refreshAccessToken()) {
            return await fetch(url, {
                ...options,
                headers: {
                    ...this.getAuthHeaders(),
                    ...options.headers
                }
            });
        }

        return response;
    },

    logout() {
        this.clearAuth();
        window.location.href = 'index.html';
    }
};

if (typeof window !== 'undefined') {
    window.AuthManager = AuthManager;
}

module.exports = AuthManager;
