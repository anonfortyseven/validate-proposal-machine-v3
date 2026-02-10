'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Lock, Loader2, ChevronRight, AlertCircle } from 'lucide-react';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

const TOKEN_KEY = 'validate_auth_token';

export default function LoginGate({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      setChecking(false);
      return;
    }
    fetch('/api/auth/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setAuthenticated(true);
        } else {
          sessionStorage.removeItem(TOKEN_KEY);
        }
      })
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setChecking(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.success && data.token) {
        sessionStorage.setItem(TOKEN_KEY, data.token);
        setAuthenticated(true);
      } else {
        setError(data.error || 'Invalid password');
        setPassword('');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setAuthenticated(false);
    setPassword('');
    setError('');
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
      </div>
    );
  }

  if (authenticated) {
    return (
      <AuthContext.Provider value={{ logout }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6 relative overflow-hidden">
      {/* Atmospheric background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-accent/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div
        className="relative z-10 w-full max-w-md transition-all duration-700 ease-out"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
        }}
      >
        <div className="p-8 bg-bg-secondary/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl">
          {/* Lock Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Lock className="w-7 h-7 text-accent" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center mb-8">
            <h1 className="text-text-primary text-xl font-medium mb-2">Authorized Access Only</h1>
            <p className="text-text-tertiary text-sm">Enter your password to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                disabled={isLoading}
                className="w-full px-4 py-4 bg-bg-tertiary border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-accent focus:ring-2 focus:ring-accent-subtle focus:outline-none transition-all text-center text-lg tracking-wider"
              />
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 text-status-error text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-4 bg-accent hover:bg-accent-secondary disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 hover:shadow-glow flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
