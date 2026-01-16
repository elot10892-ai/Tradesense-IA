import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import apiAuth from '../api/apiAuth';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Normalisation Robuste
    const normalizeUser = useCallback((profileData) => {
        if (!profileData || !profileData.user) return null;

        const challenges = profileData.active_challenges || [];
        // Prioritize explicit active_challenge, fallback to first in list
        const activeChallenge = profileData.active_challenge || (challenges.length > 0 ? challenges[0] : null);

        return {
            ...profileData.user,
            active_challenges: challenges,
            activeChallenge: activeChallenge
        };
    }, []);

    const refreshProfile = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log("[Auth] No token found, session inactive.");
            setLoading(false);
            setUser(null);
            return null;
        }

        try {
            console.log("[Auth] Syncing profile with backend...");
            const response = await api.get('/api/auth/profile', {
                headers: { 'Cache-Control': 'no-cache' }
            });

            const normalized = normalizeUser(response.data);

            if (normalized) {
                console.log(`[Auth] Sync success. Challenge: ${normalized.activeChallenge?.id || "None"}`);
                setUser(normalized);
            } else {
                console.warn("[Auth] Received empty user profile from API.");
                // We keep current user if normalization fails but didn't throw
            }
            return normalized;
        } catch (err) {
            console.error("[Auth] Sync failed:", err.response?.data || err.message);

            if (err.response?.status === 401) {
                console.warn("[Auth] Token invalid or expired. Cleaning session.");
                localStorage.removeItem('token');
                setUser(null);
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [normalizeUser]);

    // Effect for initial load
    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            if (isMounted) await refreshProfile();
        };
        init();
        return () => { isMounted = false; };
    }, [refreshProfile]);

    const login = async (email, password) => {
        setError(null);
        try {
            const data = await apiAuth.login({ email, password });
            const token = data.access_token || data.token;
            if (token) {
                localStorage.setItem('token', token);
                const fullUser = await refreshProfile();
                return !!fullUser;
            }
            return false;
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Login failed';
            setError(msg);
            throw err;
        }
    };

    const register = async (username, email, password) => {
        setError(null);
        try {
            const data = await apiAuth.register({ username, email, password });
            const token = data.access_token || data.token;
            if (token) {
                localStorage.setItem('token', token);
                await refreshProfile();
                return true;
            }
            return false;
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message || "Registration failed";
            setError(msg);
            throw err;
        }
    };

    const logout = useCallback(async () => {
        try {
            // Optionnel: Appeler l'API de déconnexion si un token existe
            const token = localStorage.getItem('token');
            if (token) {
                await api.post('/api/auth/logout').catch(() => {
                    // Ignorer les erreurs si le token est déjà expiré
                });
            }
        } catch (err) {
            console.error("Logout API error:", err);
        } finally {
            // Dans tous les cas, on nettoie le local storage et on redirige
            localStorage.removeItem('token');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            setUser(null);
            // On utilise window.location pour vider l'état React proprement
            window.location.href = '/login';
        }
    }, []);

    const value = useMemo(() => ({
        user,
        loading,
        error,
        login,
        register,
        logout,
        refreshProfile,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    }), [user, loading, error, logout, refreshProfile]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
