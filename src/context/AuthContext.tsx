import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// ─── Test credentials (dev only — stripped from production builds) ───
const TEST_PHONE = import.meta.env.DEV ? '+91 00000 00000' : '';
const TEST_OTP = import.meta.env.DEV ? '123456' : '';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isAdmin: boolean;
    signInWithPhone: (phone: string) => Promise<{ error: string | null }>;
    verifyOtp: (phone: string, token: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [testMode, setTestMode] = useState(false);

    useEffect(() => {
        // Check if we were previously in test mode (dev only)
        if (import.meta.env.DEV && sessionStorage.getItem('test_admin') === 'true') {
            setTestMode(true);
            setIsAdmin(true);
            setUser({ id: 'test-admin', phone: TEST_PHONE || 'test' } as User);
            setLoading(false);
            return;
        }

        if (!isSupabaseConfigured()) { setLoading(false); return; }

        supabase.auth.getSession().then(({ data: { session: s } }) => {
            setSession(s);
            setUser(s?.user ?? null);
            if (s?.user) checkAdmin(s.user.phone ?? '');
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            setSession(s);
            setUser(s?.user ?? null);
            if (s?.user) checkAdmin(s.user.phone ?? '');
            else setIsAdmin(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkAdmin = async (phone: string) => {
        if (!phone) { setIsAdmin(false); return; }
        const { data } = await supabase
            .from('admins')
            .select('id')
            .eq('phone', phone)
            .maybeSingle();
        setIsAdmin(!!data);
    };

    const signInWithPhone = async (phone: string): Promise<{ error: string | null }> => {
        // Test mode: accept test phone without Supabase (dev only)
        const cleanPhone = phone.replace(/\s/g, '');
        if (TEST_PHONE && cleanPhone === TEST_PHONE.replace(/\s/g, '')) {
            return { error: null }; // Skip real OTP
        }

        if (!isSupabaseConfigured()) {
            return { error: 'Supabase not configured' };
        }

        const { error } = await supabase.auth.signInWithOtp({ phone });
        return { error: error?.message ?? null };
    };

    const verifyOtp = async (phone: string, token: string): Promise<{ error: string | null }> => {
        const cleanPhone = phone.replace(/\s/g, '');

        // Test mode: accept test credentials (dev only)
        if (TEST_PHONE && cleanPhone === TEST_PHONE.replace(/\s/g, '')) {
            if (token === TEST_OTP) {
                setTestMode(true);
                setIsAdmin(true);
                setUser({ id: 'test-admin', phone: TEST_PHONE } as User);
                sessionStorage.setItem('test_admin', 'true');
                return { error: null };
            }
            return { error: 'Invalid OTP' };
        }

        if (!isSupabaseConfigured()) {
            return { error: 'Supabase not configured' };
        }

        const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
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
        <AuthContext.Provider value={{ user, session, loading, isAdmin, signInWithPhone, verifyOtp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
