import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import api from "@/src/services/api";
import { cerrarSesion, obtenerUsuario, UsuarioSesion } from "@/src/services/session";

type Cita = {
  id: number;
  fechaInicio?: string;
  precio?: number;
  estado?: string;
  cliente?: { id?: number; nombre?: string; apellidos?: string };
  profesional?: { nombre?: string; apellidos?: string };
  servicio?: { nombre?: string };
};

type ResumenFinanciero = {
  ingresosTotales?: number;
  servicios?: { ingresos?: number; cantidadCobros?: number };
  productos?: { ingresos?: number; cantidadCobros?: number };
  caja?: { cantidadCobros?: number };
};

export default function DashboardScreen() {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [resumen, setResumen] = useState<ResumenFinanciero | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState("");

  const fechaHoy = useMemo(() => {
    try {
      const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Costa_Rica",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).formatToParts(new Date());
      const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value;
      return `${valor("year")}-${valor("month")}-${valor("day")}`;
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }, []);

  const cargarDashboard = useCallback(async (esRefresh = false) => {
    esRefresh ? setRefrescando(true) : setCargando(true);
    setError("");

    try {
      const desde = `${fechaHoy}T00:00:00`;
      const hasta = `${fechaHoy}T23:59:59`;

      const [rCitas, rClientes, rProfesionales, rResumen] = await Promise.all([
        api.get("/Citas", { params: { desde, hasta } }),
        api.get("/Clientes"),
        api.get("/Profesionales"),
        api.get("/ResumenFinanciero/diario", { params: { fecha: fechaHoy } })
      ]);

      setCitas(Array.isArray(rCitas.data) ? rCitas.data : []);
      setClientes(Array.isArray(rClientes.data) ? rClientes.data : []);
      setProfesionales(Array.isArray(rProfesionales.data) ? rProfesionales.data : []);
      setResumen(rResumen.data ?? null);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        await cerrarSesion();
        router.replace("/login");
        return;
      }
      setError(
        e?.response?.data?.mensaje ??
          e?.response?.data?.title ??
          "No fue posible cargar el resumen del negocio."
      );
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [fechaHoy]);

  useEffect(() => {
    obtenerUsuario().then((u) => {
      if (!u) {
        router.replace("/login");
        return;
      }
      setUsuario(u);
      cargarDashboard();
    });
  }, [cargarDashboard]);

  const citasActivas = citas.filter((c) => c.estado !== "Cancelada");
  const pendientes = citasActivas.filter((c) => c.estado === "Pendiente").length;
  const completadas = citasActivas.filter((c) => c.estado === "Completada").length;
  const profesionalesActivos = profesionales.filter((p) => p.activo !== false).length;
  const proximas = citasActivas
    .filter((c) => ["Pendiente", "Confirmada", "EnProceso"].includes(c.estado ?? ""))
    .sort((a, b) => fechaCita(a) - fechaCita(b))
    .slice(0, 5);

  const salir = async () => {
    await cerrarSesion();
    router.replace("/login");
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Cargando tu negocio...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={() => cargarDashboard(true)} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.hello}>Hola, {usuario?.nombre ?? ""} 👋</Text>
            <Text style={styles.business}>{usuario?.negocio ?? "Barbería SaaS"}</Text>
          </View>
          <Pressable onPress={salir} hitSlop={12}>
            <Text style={styles.logout}>Salir</Text>
          </Pressable>
        </View>

        <Pressable style={styles.agendaButton} onPress={() => router.push("/agenda")}><Text style={styles.agendaButtonText}>📅 Abrir agenda</Text><Text style={styles.agendaArrow}>›</Text></Pressable>
        <Pressable style={styles.clientsButton} onPress={() => router.push("/clientes")}><Text style={styles.agendaButtonText}>👥 Clientes</Text><Text style={styles.agendaArrow}>›</Text></Pressable>
        <Pressable style={styles.clientsButton} onPress={() => router.push("/ventas")}><Text style={styles.agendaButtonText}>💳 Ventas / Caja</Text><Text style={styles.agendaArrow}>›</Text></Pressable>
        <Pressable style={styles.clientsButton} onPress={() => router.push("/profesionales")}><Text style={styles.agendaButtonText}>✂️ Profesionales</Text><Text style={styles.agendaArrow}>›</Text></Pressable>
        <Pressable style={styles.clientsButton} onPress={() => router.push("/servicios")}><Text style={styles.agendaButtonText}>✨ Servicios</Text><Text style={styles.agendaArrow}>›</Text></Pressable>
        <Pressable style={styles.clientsButton} onPress={() => router.push("/configuracion")}><Text style={styles.agendaButtonText}>⚙️ Configuración</Text><Text style={styles.agendaArrow}>›</Text></Pressable>\n        <Pressable style={styles.clientsButton} onPress={() => router.push("/sucursales")}><Text style={styles.agendaButtonText}>🏢 Sucursales</Text><Text style={styles.agendaArrow}>›</Text></Pressable>
        <Pressable style={styles.clientsButton} onPress={() => router.push("/inventario")}><Text style={styles.agendaButtonText}>📦 Inventario</Text><Text style={styles.agendaArrow}>›</Text></Pressable>
        <Pressable style={styles.clientsButton} onPress={() => router.push("/cuentas-por-cobrar")}><Text style={styles.agendaButtonText}>💰 Cuentas por cobrar</Text><Text style={styles.agendaArrow}>›</Text></Pressable>

        <View style={styles.titleRow}>
          <View>
            <Text style={styles.heading}>Hoy</Text>
            <Text style={styles.date}>{formatearFecha(fechaHoy)}</Text>
          </View>
          <View style={styles.livePill}><Text style={styles.liveText}>● En vivo</Text></View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => cargarDashboard()}><Text style={styles.retry}>Reintentar</Text></Pressable>
          </View>
        ) : null}

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Ingresos recibidos hoy</Text>
          <Text style={styles.heroValue}>{moneda(resumen?.ingresosTotales)}</Text>
          <Text style={styles.heroDetail}>{resumen?.caja?.cantidadCobros ?? 0} cobro(s) recibido(s)</Text>
        </View>

        <View style={styles.grid}>
          <MetricCard label="Citas" value={String(citasActivas.length)} detail={`${pendientes} pendientes`} />
          <MetricCard label="Completadas" value={String(completadas)} detail="hoy" />
          <MetricCard label="Clientes" value={String(clientes.length)} detail="registrados" />
          <MetricCard label="Profesionales" value={String(profesionalesActivos)} detail="activos" />
        </View>

        <Text style={styles.sectionTitle}>Ingresos</Text>
        <View style={styles.moneyRow}>
          <MoneyCard label="Servicios" value={moneda(resumen?.servicios?.ingresos)} />
          <MoneyCard label="Productos" value={moneda(resumen?.productos?.ingresos)} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximas citas</Text>
          <Text style={styles.sectionHint}>Agenda de hoy</Text>
        </View>

        <View style={styles.listCard}>
          {proximas.length === 0 ? (
            <Text style={styles.empty}>No hay citas pendientes para hoy.</Text>
          ) : (
            proximas.map((cita, index) => (
              <View key={cita.id} style={[styles.appointment, index === proximas.length - 1 && styles.last]}>
                <View style={styles.timeBox}><Text style={styles.time}>{horaCita(cita)}</Text></View>
                <View style={styles.appointmentBody}>
                  <Text style={styles.client}>{nombre(cita.cliente) || "Cliente"}</Text>
                  <Text style={styles.appointmentDetail}>
                    {cita.servicio?.nombre ?? "Servicio"} · {nombre(cita.profesional) || "Profesional"}
                  </Text>
                </View>
                <Text style={styles.status}>{estado(cita.estado)}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.pullHint}>Desliza hacia abajo para actualizar</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricDetail}>{detail}</Text></View>;
}

function MoneyCard({ label, value }: { label: string; value: string }) {
  return <View style={styles.moneyCard}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.moneyValue}>{value}</Text></View>;
}

function moneda(valor?: number) {
  return new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(Number(valor ?? 0));
}

function nombre(persona?: { nombre?: string; apellidos?: string }) {
  return [persona?.nombre, persona?.apellidos].filter(Boolean).join(" ");
}

function fechaCita(cita: Cita) {
  if (!cita.fechaInicio) return 0;
  const value = /Z$|[+-]\d{2}:\d{2}$/.test(cita.fechaInicio) ? cita.fechaInicio : `${cita.fechaInicio}Z`;
  return new Date(value).getTime();
}

function horaCita(cita: Cita) {
  const timestamp = fechaCita(cita);
  if (!timestamp) return "--:--";
  return new Intl.DateTimeFormat("es-CR", { timeZone: "America/Costa_Rica", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(timestamp));
}

function estado(valor?: string) {
  if (valor === "EnProceso") return "En proceso";
  return valor ?? "Pendiente";
}

function formatearFecha(fecha: string) {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(y, m - 1, d));
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f4f6f8" },
  agendaButton: { marginTop: 22, backgroundColor: "#fff", borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  agendaButtonText: { color: "#111827", fontWeight: "800" },
  clientsButton: { marginTop: 10, backgroundColor: "#fff", borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  agendaArrow: { color: "#2563eb", fontSize: 26, lineHeight: 26 },
  content: { padding: 20, paddingBottom: 40 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: "#f4f6f8" },
  muted: { color: "#64748b" },
  header: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerText: { flex: 1, paddingRight: 12 },
  hello: { fontSize: 22, fontWeight: "800", color: "#111827" },
  business: { color: "#64748b", marginTop: 3 },
  logout: { color: "#2563eb", fontWeight: "700" },
  titleRow: { marginTop: 28, marginBottom: 16, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  heading: { fontSize: 30, fontWeight: "900", color: "#111827" },
  date: { marginTop: 3, color: "#64748b", textTransform: "capitalize" },
  livePill: { backgroundColor: "#e8f7ee", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  liveText: { color: "#16803d", fontWeight: "700", fontSize: 12 },
  errorBox: { backgroundColor: "#fff1f2", borderRadius: 16, padding: 16, marginBottom: 14 },
  errorText: { color: "#9f1239", lineHeight: 20 },
  retry: { color: "#2563eb", fontWeight: "800", marginTop: 8 },
  heroCard: { backgroundColor: "#111827", borderRadius: 24, padding: 22, marginBottom: 14 },
  heroLabel: { color: "#cbd5e1", fontSize: 13, fontWeight: "600" },
  heroValue: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 8 },
  heroDetail: { color: "#94a3b8", marginTop: 5 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metric: { width: "48%", flexGrow: 1, backgroundColor: "#fff", borderRadius: 18, padding: 17, minHeight: 116 },
  metricLabel: { color: "#64748b", fontSize: 13, fontWeight: "600" },
  metricValue: { color: "#111827", fontSize: 28, fontWeight: "900", marginTop: 7 },
  metricDetail: { color: "#94a3b8", fontSize: 12, marginTop: 3 },
  sectionTitle: { color: "#111827", fontSize: 19, fontWeight: "900", marginTop: 24, marginBottom: 12 },
  moneyRow: { flexDirection: "row", gap: 12 },
  moneyCard: { flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 17 },
  moneyValue: { color: "#111827", fontSize: 20, fontWeight: "900", marginTop: 7 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  sectionHint: { color: "#94a3b8", fontSize: 12 },
  listCard: { backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 16 },
  appointment: { flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb" },
  last: { borderBottomWidth: 0 },
  timeBox: { width: 64 },
  time: { color: "#111827", fontWeight: "800", fontSize: 12 },
  appointmentBody: { flex: 1, paddingRight: 8 },
  client: { color: "#111827", fontWeight: "800" },
  appointmentDetail: { color: "#64748b", fontSize: 12, marginTop: 3 },
  status: { color: "#2563eb", fontSize: 11, fontWeight: "800" },
  empty: { textAlign: "center", color: "#64748b", paddingVertical: 28 },
  pullHint: { textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 20 }
});
