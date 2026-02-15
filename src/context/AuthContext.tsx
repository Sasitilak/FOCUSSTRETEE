import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

// ─── Test credentials (dev only — stripped from production builds) ───


interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isAdmin: boolean;
    adminLoading: boolean;
    signInWithUsername: (username: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    checkAdmin: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminLoading, setAdminLoading] = useState(false);
    const [testMode, setTestMode] = useState(false);
    const lastCheckedUser = React.useRef<string | null>(null);

    useEffect(() => {
        // Check if we were previously in test mode (dev only)
        if (import.meta.env.DEV && sessionStorage.getItem('test_admin') === 'true') {
            setTestMode(true);
            setIsAdmin(true);
            setUser({ id: 'test-admin', email: 'admin@acumen.internal' } as User);
            setLoading(false);
            return;
        }

        if (!isSupabaseConfigured()) { setLoading(false); return; }

        supabase.auth.getSession().then(({ data: { session: s } }) => {
            setSession(s);
            const currentUser = s?.user ?? null;
            setUser(currentUser);
            setLoading(false);
            if (currentUser) checkAdmin(currentUser);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, s: Session | null) => {
            setSession(s);
            const newUser = s?.user ?? null;
            setUser(newUser);

            if (newUser) {
                checkAdmin(newUser);
            } else {
                setIsAdmin(false);
                lastCheckedUser.current = null;
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkAdmin = React.useCallback(async (user: User) => {
        if (!user || !user.email) { setIsAdmin(false); return; }
        if (lastCheckedUser.current === user.id) return;


        setAdminLoading(true);
        // We set this immediately to prevent concurrent calls from the Effect
        lastCheckedUser.current = user.id;

        try {
            const username = user.email.split('@')[0];

            const timeout = new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 10000)
            );

            const fetchAdmin = (async () => {
                const { data, error } = await supabase
                    .from('admins')
                    .select('username')
                    .in('username', [username, user.email])
                    .maybeSingle();
                if (error) throw error;
                return data;
            })();

            const result = await Promise.race([fetchAdmin, timeout]);
            const isAdm = !!result;
            setIsAdmin(isAdm);
        } catch (err) {
            console.error("[Auth] checkAdmin error:", err);
            setIsAdmin(false);
            lastCheckedUser.current = null;
        } finally {
            setAdminLoading(false);
        }
    }, []); // Stable reference

    const signInWithUsername = async (username: string, password: string): Promise<{ error: string | null }> => {
        if (!isSupabaseConfigured()) return { error: 'Supabase not configured' };
        const email = `${username}@acumen.internal`;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
    };

    const signOut = async () => {
        if (testMode) {
            sessionStorage.removeItem('test_admin');
            setTestMode(false);
        } else {
            await supabase.auth.signOut();
        }
        setUser(null);
        setSession(null);
        setIsAdmin(false);
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, isAdmin, adminLoading, signInWithUsername, signOut, checkAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
