import { Stack, router, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { AppState } from "react-native";
import { useEffect } from "react";
import {
  escucharCambiosTokenPush,
  sincronizarPushSiHaySesion,
} from "@/src/services/push";
import { obtenerUsuario } from "@/src/services/session";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const pathname = usePathname();

  useEffect(() => {
    const abrirDesdeNotificacion = (
      response: Notifications.NotificationResponse
    ) => {
      const data = response.notification.request.content.data as
        | { citaId?: number | string }
        | undefined;
      const citaId = data?.citaId;

      if (citaId != null && String(citaId).trim()) {
        router.push(`/cita/${citaId}`);
      }
    };

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(
        abrirDesdeNotificacion
      );

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) abrirDesdeNotificacion(response);
    });

    // Si ya existe una sesión guardada, refresca FCM + Expo al abrir la app.
    // Así no dependemos únicamente del login para mantener el token vigente.
    const sincronizar = () => {
      sincronizarPushSiHaySesion().catch((error) =>
        console.warn("No fue posible sincronizar push:", error)
      );
    };

    const timer = setTimeout(sincronizar, 700);

    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active") sincronizar();
      }
    );

    // Si FCM rota el token nativo mientras la app está abierta, se vuelve a
    // registrar de inmediato sin esperar otro login o reinstalación.
    const tokenSubscription = escucharCambiosTokenPush();

    return () => {
      clearTimeout(timer);
      responseSubscription.remove();
      appStateSubscription.remove();
      tokenSubscription.remove();
    };
  }, []);

  useEffect(() => {
    let activo = true;

    obtenerUsuario().then((usuario) => {
      if (!activo || usuario?.rol !== "Profesional") return;

      const permitida =
        pathname === "/" ||
        pathname === "/login" ||
        pathname === "/dashboard" ||
        pathname === "/agenda" ||
        pathname === "/clientes" ||
        pathname === "/servicios" ||
        pathname === "/nueva-cita" ||
        pathname === "/nuevo-cliente" ||
        pathname.startsWith("/cliente/") ||
        pathname.startsWith("/cita/") ||
        pathname.startsWith("/recuperar-password") ||
        pathname.startsWith("/restablecer-password");

      if (!permitida) {
        router.replace("/agenda");
      }
    });

    return () => {
      activo = false;
    };
  }, [pathname]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
