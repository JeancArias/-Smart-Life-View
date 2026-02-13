import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { User } from "@/types/camera";
import {
  getUser,
  setUser as saveUser,
  clearAllData,
  getSavedCredentials,
  setSavedCredentials,
  clearSavedCredentials,
  getRememberMe,
  setRememberMe as saveRememberMe,
  getBiometricEnabled,
  setBiometricEnabled as saveBiometricEnabled,
} from "@/lib/storage";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    rememberMe: boolean,
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithBiometric: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  savedCredentials: { email: string; password: string } | null;
  rememberMe: boolean;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedCredentials, setSavedCreds] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    loadUser();
    checkBiometricAvailability();
  }, []);

  async function checkBiometricAvailability() {
    if (Platform.OS === "web") {
      setBiometricAvailable(false);
      return;
    }
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    } catch {
      setBiometricAvailable(false);
    }
  }

  async function loadUser() {
    try {
      const [storedUser, creds, remember, biometric] = await Promise.all([
        getUser(),
        getSavedCredentials(),
        getRememberMe(),
        getBiometricEnabled(),
      ]);
      setUser(storedUser);
      setSavedCreds(creds);
      setRememberMe(remember);
      setBiometricEnabledState(biometric);
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(
    email: string,
    password: string,
    remember: boolean,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (!email.includes("@") || password.length < 4) {
        return { success: false, error: "Credenciales invalidas" };
      }

      const newUser: User = {
        id: `user_${Date.now()}`,
        email,
        displayName: email.split("@")[0],
        camerasCount: 0,
      };

      await saveUser(newUser);
      setUser(newUser);

      if (remember) {
        await setSavedCredentials(email, password);
        await saveRememberMe(true);
        setSavedCreds({ email, password });
        setRememberMe(true);
      } else {
        await clearSavedCredentials();
        await saveRememberMe(false);
        setSavedCreds(null);
        setRememberMe(false);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "Error de conexion" };
    }
  }

  async function loginWithBiometric(): Promise<{ success: boolean; error?: string }> {
    if (!biometricAvailable || !biometricEnabled || !savedCredentials) {
      return { success: false, error: "Biometria no disponible" };
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Inicia sesion con tu huella",
        fallbackLabel: "Usar contrasena",
        cancelLabel: "Cancelar",
      });

      if (result.success) {
        const newUser: User = {
          id: `user_${Date.now()}`,
          email: savedCredentials.email,
          displayName: savedCredentials.email.split("@")[0],
          camerasCount: 0,
        };
        await saveUser(newUser);
        setUser(newUser);
        return { success: true };
      } else {
        return { success: false, error: "Autenticacion cancelada" };
      }
    } catch (error) {
      return { success: false, error: "Error de autenticacion" };
    }
  }

  async function logout() {
    await clearAllData();
    setUser(null);
  }

  async function setBiometricEnabled(enabled: boolean) {
    await saveBiometricEnabled(enabled);
    setBiometricEnabledState(enabled);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithBiometric,
        logout,
        savedCredentials,
        rememberMe,
        biometricEnabled,
        biometricAvailable,
        setBiometricEnabled,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
