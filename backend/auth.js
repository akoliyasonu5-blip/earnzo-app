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

function getOAuthParam(url, key) {
  try {
    const parsed = new URL(String(url || ''));
    const fromQuery = parsed.searchParams.get(key);
    if (fromQuery) return fromQuery;
    const hash = String(parsed.hash || '').replace(/^#/, '');
    if (!hash) return null;
    return new URLSearchParams(hash).get(key);
  } catch (_) {
    return null;
  }
}

export async function getAuthSession() {
  if (!authConfigured) return null;
  const { data, error } = await supabaseAuth.auth.getSession();
  if (error) throw error;
  return data?.session || null;
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
  const { data, error } = await supabaseAuth.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Google login URL was not returned.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, { showInRecents: true });
  if (!result || result.type !== 'success' || !result.url) throw new Error('Google login was cancelled.');

  const oauthError = getOAuthParam(result.url, 'error_description') || getOAuthParam(result.url, 'error');
  if (oauthError) throw new Error(decodeURIComponent(String(oauthError).replace(/\+/g, ' ')));

  const code = getOAuthParam(result.url, 'code');
  if (code) {
    const sessionResult = await supabaseAuth.auth.exchangeCodeForSession(code);
    if (sessionResult.error) throw sessionResult.error;
    return sessionResult.data;
  }

  // Some mobile OAuth redirects return a token pair in the URL fragment instead of a PKCE code.
  // Support that form as a safe fallback so Android browser/deep-link differences do not break login.
  const accessToken = getOAuthParam(result.url, 'access_token');
  const refreshToken = getOAuthParam(result.url, 'refresh_token');
  if (accessToken && refreshToken) {
    const sessionResult = await supabaseAuth.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (sessionResult.error) throw sessionResult.error;
    return sessionResult.data;
  }

  throw new Error('Google login callback mila, lekin session code/token nahi mila. Please try again.');
}

export async function changeAuthPassword(newPassword) {
  ensureConfigured();
  const password = String(newPassword || '');
  if (password.length < 8) throw new Error('Password minimum 8 characters ka hona chahiye.');
  const { data: sessionData, error: sessionError } = await supabaseAuth.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData?.session) throw new Error('Secure account session required. Please login again.');
  const { data, error } = await supabaseAuth.auth.updateUser({ password });
  if (error) throw error;
  return data;
}

export async function sendPasswordRecovery(email) {
  ensureConfigured();
  const address = String(email || '').trim().toLowerCase();
  if (!address.includes('@')) throw new Error('Valid recovery email enter kare.');
  const { data, error } = await supabaseAuth.auth.resetPasswordForEmail(address, { redirectTo: 'earnzo://password-reset' });
  if (error) throw error;
  return data;
}

export async function signOutAuth() {
  if (!authConfigured) return;
  const { error } = await supabaseAuth.auth.signOut();
  if (error) throw error;
}
