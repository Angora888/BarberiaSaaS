import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import api from "./api";

export async function registrarPushNotifications() {
  if (!Device.isDevice) {
    console.warn("Las notificaciones push requieren un dispositivo físico.");
    return;
  }

  const actual = await Notifications.getPermissionsAsync();
  let status = actual.status;

  if (status !== "granted") {
    const solicitado = await Notifications.requestPermissionsAsync();
    status = solicitado.status;
  }

  if (status !== "granted") {
    console.warn("El usuario no autorizó las notificaciones.");
    return;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn("EAS projectId no configurado.");
    return;
  }

  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId,
    })
  ).data;

  await api.post("/push-tokens", {
    token,
    plataforma: Platform.OS,
  });
}