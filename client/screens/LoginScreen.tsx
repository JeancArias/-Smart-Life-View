import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Switch } from "@/components/Switch";
import { ThemedText } from "@/components/ThemedText";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useAuth } from "@/context/AuthContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { 
    login, 
    loginWithBiometric, 
    savedCredentials, 
    rememberMe: savedRememberMe,
    biometricEnabled,
    biometricAvailable,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canUseBiometric = biometricAvailable && biometricEnabled && savedCredentials && Platform.OS !== "web";

  useEffect(() => {
    if (savedCredentials) {
      setEmail(savedCredentials.email);
      setPassword(savedCredentials.password);
    }
    setRememberMe(savedRememberMe);
  }, [savedCredentials, savedRememberMe]);

  useEffect(() => {
    if (canUseBiometric) {
      handleBiometricLogin();
    }
  }, [canUseBiometric]);

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    const result = await loginWithBiometric();
    setIsLoading(false);
    
    if (!result.success && result.error !== "Autenticacion cancelada") {
      setError(result.error || "Error de autenticacion");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Por favor ingresa tu email y contrasena");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setError("");
    setIsLoading(true);

    const result = await login(email, password, rememberMe);

    setIsLoading(false);

    if (!result.success) {
      setError(result.error || "Error al iniciar sesion");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing["3xl"] }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="h2" style={styles.appName}>
            Smart Cam View
          </ThemedText>
          <ThemedText
            type="small"
            style={[styles.subtitle, { color: Colors.dark.textSecondary }]}
          >
            Visualiza tus camaras Smart Life
          </ThemedText>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            icon="mail"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            testID="input-email"
          />

          <Input
            label="Contrasena"
            icon="lock"
            placeholder="Tu contrasena"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            testID="input-password"
          />

          <Switch
            label="Recordarme"
            value={rememberMe}
            onValueChange={setRememberMe}
          />

          {error ? (
            <ThemedText
              type="small"
              style={[styles.error, { color: Colors.dark.error }]}
            >
              {error}
            </ThemedText>
          ) : null}

          <Button
            onPress={handleLogin}
            style={styles.loginButton}
            disabled={isLoading}
          >
            Iniciar Sesion
          </Button>

          <ThemedText
            type="small"
            style={[styles.hint, { color: Colors.dark.textSecondary }]}
          >
            Usa tus credenciales de Smart Life / Tuya
          </ThemedText>

          {canUseBiometric ? (
            <Pressable 
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
            >
              <Feather name="smartphone" size={24} color={Colors.dark.primary} />
              <ThemedText style={{ color: Colors.dark.primary, marginLeft: Spacing.sm }}>
                Usar huella dactilar
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      {isLoading ? <LoadingOverlay message="Conectando..." /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing["3xl"],
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.lg,
  },
  appName: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: "center",
  },
  form: {
    flex: 1,
  },
  error: {
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  loginButton: {
    marginTop: Spacing.lg,
  },
  hint: {
    marginTop: Spacing.xl,
    textAlign: "center",
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing["2xl"],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
});
