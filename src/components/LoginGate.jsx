'use client'

import React, { createContext, useContext } from 'react';

// AUTH BYPASSED - No login required
const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export default function LoginGate({ children }) {
  // Always render children directly - no auth check
  return (
    <AuthContext.Provider value={{ logout: () => {} }}>
      {children}
    </AuthContext.Provider>
  );
}
