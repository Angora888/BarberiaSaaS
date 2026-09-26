import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import api from "./api";
import { obtenerToken } from "./session";

const INSTALLATION_ID_KEY = "barberiasaas_push_installation_id";
const PUSH_DIAGNOSTIC_KEY = "barberiasaas_push_diagnostic";
const EAS_PROJECT_ID = "aed50576-93e9-479c-b518-e005fbd49e91";

export type PushDiagnostic = {
  ok: boolean;
  permissionStatus: string;
  canAskAgain?: boolean;
  projectId: string;
  installationId: string;
  nativeToken?: string;
  expoToken?: string;
  apiRegistered: boolean;
  updatedAt: string;
  error?: string;
  lastTestStatus?: string;
  lastTestMessage?: string;
  lastTestAt?: string;
};

function crearInstallationId() {
  const rnd = () => Math.random().toString(36).slice(2, 10);
  return `inst-${Date.now().toString(36)}-${rnd()}-${rnd()}`;
}

async function obtenerInstallationId() {
  const actual = await SecureStore.getItemAsync(INSTALLATION_ID_KEY);
  if (actual) return actual;
  const nuevo = crearInstallationId();
  await SecureStore.setItemAsync(INSTALLATION_ID_KEY, nuevo);
  return nuevo;
}

function projectIdActual() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    EAS_PROJECT_ID
  );
}

function tokenNativoComoTexto(token: Notifications.DevicePushToken) {
  return typeof token.data === "string"
    ? token.data
    : JSON.stringify(token.data);
}

async function guardarDiagnostico(diag: PushDiagnostic) {
  await SecureStore.setItemAsync(PUSH_DIAGNOSTIC_KEY, JSON.stringify(diag));
  return diag;
}

async function asegurarCanalAndroid() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "General",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
  });
}

async function obtenerExpoTokenConReintento(
  projectId: string,
  devicePushToken: Notifications.DevicePushToken
) {
  let ultimoError: unknown;
  for (let intento = 1; intento <= 3; intento++) {
    try {
      return await Notifications.getExpoPushTokenAsync({
        projectId,
        devicePushToken,
      });
    } catch (error) {
      ultimoError = error;
      if (intento < 3) {
        await new Promise((resolve) => setTimeout(resolve, intento * 1000));
      }
    }
  }
  throw ultimoError;
}

async function registrarConTokenNativo(
  devicePushToken: Notifications.DevicePushToken,
  permissionStatus = "granted",
  canAskAgain?: boolean
): Promise<PushDiagnostic> {
  const projectId = projectIdActual();
  const installationId = await obtenerInstallationId();
  const nativeToken = tokenNativoComoTexto(devicePushToken);

  try {
    const expo = await obtenerExpoTokenConReintento(projectId, devicePushToken);

    await api.post("/push-tokens", {
      token: expo.data,
      plataforma: Platform.OS,
      installationId,
      nativeToken,
      projectId,
    });

    return guardarDiagnostico({
      ok: true,
      permissionStatus,
      canAskAgain,
      projectId,
      installationId,
      nativeToken,
      expoToken: expo.data,
      apiRegistered: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return guardarDiagnostico({
      ok: false,
      permissionStatus,
      canAskAgain,
      projectId,
      installationId,
      nativeToken,
      apiRegistered: false,
      updatedAt: new Date().toISOString(),
      error:
        error?.response?.data?.mensaje ??
        error?.response?.data?.title ??
        error?.message ??
        String(error),
    });
  }
}

export async function registrarPushNotifications(): Promise<PushDiagnostic> {
  await asegurarCanalAndroid();

  let permisos = (await Notifications.getPermissionsAsync()) as any;

  if (permisos?.status !== "granted") {
    if (permisos?.canAskAgain === false) {
      const installationId = await obtenerInstallationId();
      return guardarDiagnostico({
        ok: false,
        permissionStatus: permisos?.status ?? "denied",
        canAskAgain: false,
        projectId: projectIdActual(),
        installationId,
        apiRegistered: false,
        updatedAt: new Date().toISOString(),
        error: "El permiso de notificaciones está desactivado en el sistema.",
      });
    }

    permisos = (await Notifications.requestPermissionsAsync()) as any;
  }

  if (permisos?.status !== "granted") {
    const installationId = await obtenerInstallationId();
    return guardarDiagnostico({
      ok: false,
      permissionStatus: permisos?.status ?? "denied",
      canAskAgain: permisos?.canAskAgain,
      projectId: projectIdActual(),
      installationId,
      apiRegistered: false,
      updatedAt: new Date().toISOString(),
      error: "No se concedió permiso para notificaciones.",
    });
  }

  try {
    // Importante: obtenemos primero el token nativo FCM/APNs y lo pasamos
    // explícitamente a Expo para refrescar la asociación del dispositivo.
    const devicePushToken = await Notifications.getDevicePushTokenAsync();

    return registrarConTokenNativo(
      devicePushToken,
      permisos.status,
      permisos.canAskAgain
    );
  } catch (error: any) {
    const installationId = await obtenerInstallationId();
    return guardarDiagnostico({
      ok: false,
      permissionStatus: permisos?.status ?? "granted",
      canAskAgain: permisos?.canAskAgain,
      projectId: projectIdActual(),
      installationId,
      apiRegistered: false,
      updatedAt: new Date().toISOString(),
      error: error?.message ?? String(error),
    });
  }
}

export async function sincronizarPushSiHaySesion() {
  const tokenSesion = await obtenerToken();
  if (!tokenSesion) return null;
  return registrarPushNotifications();
}

export function escucharCambiosTokenPush() {
  return Notifications.addPushTokenListener(async (devicePushToken) => {
    try {
      const tokenSesion = await obtenerToken();
      if (!tokenSesion) return;
      const permisos = (await Notifications.getPermissionsAsync()) as any;
      if (permisos?.status !== "granted") return;

      // No llamar getDevicePushTokenAsync aquí: el listener ya entrega
      // el nuevo token nativo y hacerlo dispararía el listener otra vez.
      await registrarConTokenNativo(
        devicePushToken,
        permisos.status,
        permisos.canAskAgain
      );
    } catch (error) {
      console.warn("No fue posible renovar el token push:", error);
    }
  });
}


export async function probarPushActual() {
  const registro = await registrarPushNotifications();
  if (!registro.ok || !registro.expoToken) return registro;

  try {
    const sendResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: registro.expoToken,
        sound: "default",
        title: "Barbería SaaS",
        body: "✅ Prueba de notificaciones completada",
        data: { tipo: "push_test" },
      }),
    });

    const ticket = await sendResponse.json();
    const ticketData = Array.isArray(ticket?.data) ? ticket.data[0] : ticket?.data;
    const receiptId = ticketData?.id;

    if (!sendResponse.ok || ticketData?.status === "error" || !receiptId) {
      return guardarDiagnostico({
        ...registro,
        ok: false,
        lastTestStatus: ticketData?.details?.error ?? "send_error",
        lastTestMessage:
          ticketData?.message ??
          `Expo respondió HTTP ${sendResponse.status} al enviar la prueba.`,
        lastTestAt: new Date().toISOString(),
      });
    }

    let receipt: any = null;
    for (const espera of [2000, 4000, 7000]) {
      await new Promise((resolve) => setTimeout(resolve, espera));
      const receiptResponse = await fetch(
        "https://exp.host/--/api/v2/push/getReceipts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [receiptId] }),
        }
      );
      const body = await receiptResponse.json();
      receipt = body?.data?.[receiptId];
      if (receipt) break;
    }

    if (!receipt) {
      return guardarDiagnostico({
        ...registro,
        lastTestStatus: "pending",
        lastTestMessage:
          "Expo aceptó la prueba, pero el receipt todavía no estaba disponible.",
        lastTestAt: new Date().toISOString(),
      });
    }

    const receiptOk = receipt.status === "ok";
    return guardarDiagnostico({
      ...registro,
      ok: receiptOk,
      lastTestStatus: receiptOk
        ? "ok"
        : receipt?.details?.error ?? receipt?.status ?? "error",
      lastTestMessage: receiptOk
        ? "Expo y FCM aceptaron la notificación de prueba."
        : receipt?.message ?? "FCM rechazó la notificación de prueba.",
      lastTestAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return guardarDiagnostico({
      ...registro,
      ok: false,
      lastTestStatus: "exception",
      lastTestMessage: error?.message ?? String(error),
      lastTestAt: new Date().toISOString(),
    });
  }
}

export async function obtenerDiagnosticoPush(): Promise<PushDiagnostic | null> {
  const raw = await SecureStore.getItemAsync(PUSH_DIAGNOSTIC_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PushDiagnostic;
  } catch {
    return null;
  }
}
