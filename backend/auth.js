import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const SUPABASE_KEY = (process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '').trim();
export const authConfigured = !!SUPABASE_URL && !!SUPABASE_KEY;

export const supabaseAuth = createClient(SUPABASE_URL || 'https://invalid.local', SUPABASE_KEY || 'invalid', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

function ensureConfigured() {
  if (!authConfigured) throw new Error('Secure login is not configured in this build.');
}

export async function signInEmail(email, password) {
  ensureConfigured();
  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email: String(email || '').trim().toLowerCase(), password });
  if (error) throw error;
  return data;
}

export async function signUpEmail(email, password) {
  ensureConfigured();
  const { data, error } = await supabaseAuth.auth.signUp({ email: String(email || '').trim().toLowerCase(), password });
  if (error) throw error;
  return data;
}

export async function sendPhoneOtp(phone) {
  ensureConfigured();
  const { data, error } = await supabaseAuth.auth.signInWithOtp({ phone: String(phone || '').replace(/\s/g, '') });
  if (error) throw error;
  return data;
}

export async function verifyPhoneOtp(phone, token) {
  ensureConfigured();
  const { data, error } = await supabaseAuth.auth.verifyOtp({ phone: String(phone || '').replace(/\s/g, ''), token: String(token || '').trim(), type: 'sms' });
  if (error) throw error;
  return data;
}

export async function signInGoogle() {
  ensureConfigured();
  const redirectTo = 'earnzo://google-auth';
  const { data, error } = await supabaseAuth.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } } });
  if (error) throw error;
  if (!data?.url) throw new Error('Google login URL was not returned.');
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, { showInRecents: true });
  if (!result || result.type !== 'success' || !result.url) throw new Error('Google login was cancelled.');
  const code = new URL(result.url).searchParams.get('code');
  if (!code) throw new Error('Google login did not return an authorization code.');
  const sessionResult = await supabaseAuth.auth.exchangeCodeForSession(code);
  if (sessionResult.error) throw sessionResult.error;
  return sessionResult.data;
}

export async function signOutAuth() {
  if (!authConfigured) return;
  const { error } = await supabaseAuth.auth.signOut();
  if (error) throw error;
}
