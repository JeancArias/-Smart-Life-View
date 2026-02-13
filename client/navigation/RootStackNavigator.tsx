import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@/context/AuthContext";
import { Camera } from "@/types/camera";
import MainTabNavigator, { MainTabParamList } from "@/navigation/MainTabNavigator";
import LoginScreen from "@/screens/LoginScreen";
import CameraFullscreenScreen from "@/screens/CameraFullscreenScreen";
import AboutScreen from "@/screens/AboutScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Colors } from "@/constants/theme";
import { NavigatorScreenParams } from "@react-navigation/native";

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  CameraFullscreen: { camera: Camera };
  About: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const screenOptions = useScreenOptions();

  if (isLoading) {
    return <LoadingOverlay message="Cargando..." />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenOptions,
        headerStyle: {
          backgroundColor: Colors.dark.backgroundRoot,
        },
        headerTintColor: Colors.dark.text,
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CameraFullscreen"
            component={CameraFullscreenScreen}
            options={{
              headerShown: false,
              presentation: "fullScreenModal",
              animation: "fade",
            }}
          />
          <Stack.Screen
            name="About"
            component={AboutScreen}
            options={{
              headerTitle: "Acerca de",
              headerTransparent: true,
            }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
