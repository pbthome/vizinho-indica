import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { User } from '../types';
import * as api from './mockApi';

type AppContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshSession: () => Promise<User | null>;
  signOut: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      setUser,
      refreshSession: async () => {
        const session = await api.getCurrentUser();
        setUser(session);
        return session;
      },
      signOut: async () => {
        await api.logout();
        setUser(null);
      }
    }),
    [user]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
