import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import api from "./api";

export async function registrarPushNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "General",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const actual = (await Notifications.getPermissionsAsync()) as any;
  let status = actual?.status;

  if (status !== "granted") {
    const solicitado = (await Notifications.requestPermissionsAsync()) as any;
    status = solicitado?.status;
  }

  if (status !== "granted") return;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn("EAS projectId no configurado; no se pudo registrar push.");
    return;
  }

  const token = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;

  await api.post("/push-tokens", {
    token,
    plataforma: Platform.OS,
  });
}
