import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  obtenerDiagnosticoPush,
  PushDiagnostic,
  registrarPushNotifications,
} from "@/src/services/push";

export default function NotificacionesScreen() {
  const [diag, setDiag] = useState<PushDiagnostic | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = async () => {
    setDiag(await obtenerDiagnosticoPush());
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const renovar = async () => {
    setRefreshing(true);
    try {
      const resultado = await registrarPushNotifications();
      setDiag(resultado);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.content}>
        <Pressable onPress={() => router.back()}>
          <Text style={s.back}>‹ Configuración</Text>
        </Pressable>

        <Text style={s.title}>Notificaciones</Text>
        <Text style={s.sub}>
          Estado real del registro push de este teléfono
        </Text>

        <View style={[s.statusCard, diag?.ok ? s.okCard : s.warnCard]}>
          <Text style={s.statusTitle}>
            {diag?.ok ? "✓ Registro push correcto" : "⚠ Requiere revisión"}
          </Text>
          <Text style={s.statusText}>
            {diag?.ok
              ? "FCM y Expo fueron registrados y enviados al servidor."
              : diag?.error ?? "Aún no hay diagnóstico guardado."}
          </Text>
        </View>

        <View style={s.card}>
          <Row label="Permiso" value={diag?.permissionStatus ?? "Sin comprobar"} />
          <Row label="Registrado en API" value={diag?.apiRegistered ? "Sí" : "No"} />
          <Row label="Project ID" value={diag?.projectId ?? "—"} selectable />
          <Row label="Installation ID" value={diag?.installationId ?? "—"} selectable />
          <Row label="FCM / token nativo" value={diag?.nativeToken ?? "—"} selectable />
          <Row label="Expo Push Token" value={diag?.expoToken ?? "—"} selectable />
          <Row
            label="Última sincronización"
            value={diag?.updatedAt ? new Date(diag.updatedAt).toLocaleString() : "—"}
          />
          {diag?.error ? <Row label="Último error" value={diag.error} /> : null}
        </View>

        <Pressable
          disabled={refreshing}
          onPress={renovar}
          style={[s.primary, refreshing && s.disabled]}
        >
          {refreshing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.primaryText}>🔔 Renovar registro push</Text>
          )}
        </Pressable>

        <Pressable style={s.secondary} onPress={() => Linking.openSettings()}>
          <Text style={s.secondaryText}>Abrir permisos del teléfono</Text>
        </Pressable>

        <Text style={s.note}>
          Este diagnóstico permite comprobar el token nativo FCM y el token Expo
          sin conectar el teléfono por cable.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  selectable = false,
}: {
  label: string;
  value: string;
  selectable?: boolean;
}) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text selectable={selectable} style={s.value}>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f4f6f8" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f6f8",
  },
  content: { padding: 20, paddingBottom: 50 },
  back: { color: "#2563eb", fontWeight: "800", marginTop: 8 },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#111827",
    marginTop: 20,
  },
  sub: { color: "#64748b", marginTop: 4, marginBottom: 16 },
  statusCard: { borderRadius: 18, padding: 16, marginBottom: 14 },
  okCard: { backgroundColor: "#ecfdf5" },
  warnCard: { backgroundColor: "#fff7ed" },
  statusTitle: { fontWeight: "900", color: "#111827", fontSize: 16 },
  statusText: { color: "#475569", marginTop: 5, lineHeight: 19 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 16 },
  row: {
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  label: { color: "#64748b", fontSize: 11, fontWeight: "800" },
  value: { color: "#111827", marginTop: 5, fontSize: 12, lineHeight: 18 },
  primary: {
    backgroundColor: "#2563eb",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  primaryText: { color: "#fff", fontWeight: "900" },
  secondary: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  secondaryText: { color: "#2563eb", fontWeight: "900" },
  disabled: { opacity: 0.6 },
  note: {
    color: "#64748b",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 14,
  },
});
