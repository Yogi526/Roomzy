import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_KEY = "@staybook_user";

export type UserRole = "renter" | "owner" | "both";

export interface AppUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

interface UserContextValue {
  user: AppUser | null;
  setUser: (user: AppUser | null) => void;
  isLoading: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(USER_KEY);
        if (stored) setUserState(JSON.parse(stored));
      } catch {}
      setIsLoading(false);
    })();
  }, []);

  const setUser = async (u: AppUser | null) => {
    setUserState(u);
    if (u) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    } else {
      await AsyncStorage.removeItem(USER_KEY);
    }
  };

  const logout = () => setUser(null);

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
