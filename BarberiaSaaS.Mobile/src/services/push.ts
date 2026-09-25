import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import api from "./api";

export async function registrarPushNotifications() {
  if (!Constants.isDevice) return;

  let permisos = await Notifications.getPermissionsAsync();

  if (!permisos.granted) {
    permisos = await Notifications.requestPermissionsAsync();
  }

  if (!permisos.granted) return;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn(
      "EAS projectId no configurado; push se activará al preparar el development build."
    );
    return;
  }

  const token = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;

  await api.post("/push-tokens", {
    token,
    plataforma: Platform.OS
  });
}
