import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import api from "@/src/services/api";
import { obtenerUsuario, UsuarioSesion } from "@/src/services/session";

type Sucursal = {
  id: number;
  nombre: string;
  activa?: boolean;
};

type Servicio = {
  id: number;
  nombre: string;
  precio?: number;
  activo?: boolean;
};

type Profesional = {
  id: number;
  nombre: string;
  apellidos?: string;
  telefono?: string;
  paisCodigoTelefono?: string;
  email?: string;
  especialidad?: string;
  fotoUrl?: string;
  activo?: boolean;
  sucursalId?: number | null;
  servicios?: { id: number }[];
};

export default function FormProfesional() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const edit = Boolean(id) && id !== "nuevo";

  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [paisCodigoTelefono, setPaisCodigoTelefono] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [activo, setActivo] = useState(true);
  const [sucursalId, setSucursalId] = useState<number | undefined>();
  const [servicioIds, setServicioIds] = useState<number[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const esProfesional = usuario?.rol === "Profesional";

  useEffect(() => {
    let activoEffect = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const sesion = await obtenerUsuario();
        if (!activoEffect) return;

        if (!sesion) {
          router.replace("/login");
          return;
        }

        setUsuario(sesion);

        const esSesionProfesional = sesion.rol === "Profesional";

        if (esSesionProfesional) {
          if (!edit || sesion.profesionalId == null || Number(id) !== Number(sesion.profesionalId)) {
            router.replace("/agenda");
            return;
          }

          const response = await api.get("/Profesionales");
          const profesional: Profesional | undefined = (response.data ?? []).find(
            (x: Profesional) => x.id === Number(id)
          );

          if (!profesional) {
            throw new Error("No fue posible encontrar tu perfil profesional.");
          }

          cargarProfesional(profesional);
          return;
        }

        const [sucursalesResponse, serviciosResponse, profesionalesResponse] =
          await Promise.all([
            api.get("/Sucursales"),
            api.get("/Servicios"),
            api.get("/Profesionales")
          ]);

        setSucursales(
          (sucursalesResponse.data ?? []).filter(
            (x: Sucursal) => x.activa !== false
          )
        );
        setServicios(
          (serviciosResponse.data ?? []).filter(
            (x: Servicio) => x.activo !== false
          )
        );

        if (edit) {
          const profesional: Profesional | undefined = (
            profesionalesResponse.data ?? []
          ).find((x: Profesional) => x.id === Number(id));

          if (!profesional) {
            throw new Error("Profesional no encontrado.");
          }

          cargarProfesional(profesional);
        }
      } catch (e: any) {
        setError(
          e?.response?.data?.mensaje ??
            e?.message ??
            "No fue posible preparar el formulario."
        );
      } finally {
        if (activoEffect) setLoading(false);
      }
    })();

    return () => {
      activoEffect = false;
    };
  }, [edit, id]);

  const cargarProfesional = (profesional: Profesional) => {
    setNombre(profesional.nombre ?? "");
    setApellidos(profesional.apellidos ?? "");
    setTelefono(profesional.telefono ?? "");
    setPaisCodigoTelefono(profesional.paisCodigoTelefono ?? null);
    setEmail(profesional.email ?? "");
    setEspecialidad(profesional.especialidad ?? "");
    setFotoUrl(profesional.fotoUrl ?? "");
    setActivo(profesional.activo !== false);
    setSucursalId(profesional.sucursalId ?? undefined);
    setServicioIds((profesional.servicios ?? []).map((x) => x.id));
  };

  const pickFoto = async () => {
    try {
      setError("");
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permiso.granted) {
        setError("Necesitamos permiso para seleccionar una foto.");
        return;
      }

      const picker = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85
      });

      if (picker.canceled) return;

      const asset = picker.assets[0];
      const form = new FormData();
      form.append(
        "archivo",
        {
          uri: asset.uri,
          name: asset.fileName || "profesional.jpg",
          type: asset.mimeType || "image/jpeg"
        } as any
      );

      setUploading(true);
      const response = await api.post("/Imagenes/subir", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setFotoUrl(response.data.url);
    } catch (e: any) {
      setError(
        e?.response?.data?.mensaje ?? "No fue posible subir la foto."
      );
    } finally {
      setUploading(false);
    }
  };

  const toggleServicio = (servicioId: number) =>
    setServicioIds((actuales) =>
      actuales.includes(servicioId)
        ? actuales.filter((x) => x !== servicioId)
        : [...actuales, servicioId]
    );

  const save = async () => {
    if (!nombre.trim()) {
      setError("El nombre es requerido.");
      return;
    }

    if (!esProfesional && !servicioIds.length) {
      setError("Selecciona al menos un servicio.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        sucursalId: sucursalId ?? null,
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        telefono: telefono.trim() || null,
        paisCodigoTelefono,
        email: email.trim() || null,
        especialidad: especialidad.trim() || null,
        fotoUrl: fotoUrl.trim() || null,
        servicioIds,
        ...(edit ? { activo } : {})
      };

      if (edit) {
        await api.put(`/Profesionales/${id}`, payload);
        router.replace(`/profesional/${id}`);
      } else {
        await api.post("/Profesionales", payload);
        router.replace("/profesionales");
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.mensaje ??
          (edit
            ? "No fue posible actualizar el profesional."
            : "No fue posible crear el profesional.")
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>
            {esProfesional ? "‹ Mi perfil" : "‹ Profesionales"}
          </Text>
        </Pressable>

        <Text style={styles.title}>
          {esProfesional
            ? "Editar mi perfil"
            : edit
              ? "Editar profesional"
              : "Nuevo profesional"}
        </Text>

        {esProfesional ? (
          <Text style={styles.intro}>
            Puedes actualizar tu información personal y tu foto. La sucursal,
            los servicios asignados y tu estado los administra el propietario.
          </Text>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Field label="Nombre">
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
          />
        </Field>

        <Field label="Apellidos">
          <TextInput
            style={styles.input}
            value={apellidos}
            onChangeText={setApellidos}
          />
        </Field>

        <Field label="Teléfono">
          <TextInput
            style={styles.input}
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            placeholder="Ej. 8888 8888"
          />
        </Field>

        <Field label="Email">
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Field>

        <Field label="Especialidad">
          <TextInput
            style={styles.input}
            value={especialidad}
            onChangeText={setEspecialidad}
            placeholder="Ej. Barbería, colorista..."
          />
        </Field>

        {!esProfesional ? (
          <>
            <Field label="Sucursal">
              <View style={styles.chips}>
                <Chip
                  active={!sucursalId}
                  text="Sin sucursal"
                  onPress={() => setSucursalId(undefined)}
                />
                {sucursales.map((sucursal) => (
                  <Chip
                    key={sucursal.id}
                    active={sucursalId === sucursal.id}
                    text={sucursal.nombre}
                    onPress={() => setSucursalId(sucursal.id)}
                  />
                ))}
              </View>
            </Field>

            <Field label="Servicios">
              <View style={styles.chips}>
                {servicios.map((servicio) => (
                  <Chip
                    key={servicio.id}
                    active={servicioIds.includes(servicio.id)}
                    text={servicio.nombre}
                    onPress={() => toggleServicio(servicio.id)}
                  />
                ))}
              </View>
            </Field>
          </>
        ) : null}

        <Field label="Foto del profesional">
          {fotoUrl ? (
            <Image source={{ uri: fotoUrl }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>
                {nombre?.[0]?.toUpperCase() || "P"}
              </Text>
            </View>
          )}

          <Pressable
            disabled={uploading}
            onPress={pickFoto}
            style={styles.imageButton}
          >
            <Text style={styles.imageButtonText}>
              {uploading
                ? "Subiendo foto..."
                : fotoUrl
                  ? "📷 Cambiar foto"
                  : "📷 Cargar foto"}
            </Text>
          </Pressable>
        </Field>

        {edit && !esProfesional ? (
          <View style={styles.active}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.label}>Profesional activo</Text>
              <Text style={styles.help}>
                Los inactivos no aparecen para nuevas citas.
              </Text>
            </View>
            <Switch value={activo} onValueChange={setActivo} />
          </View>
        ) : null}

        <Pressable
          disabled={saving || uploading}
          onPress={save}
          style={[
            styles.save,
            (saving || uploading) && styles.disabled
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>
              {esProfesional
                ? "Guardar mi perfil"
                : edit
                  ? "Guardar cambios"
                  : "Crear profesional"}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginTop: 17 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Chip({
  active,
  text,
  onPress
}: {
  active: boolean;
  text: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipOn]}
    >
      <Text style={[styles.chipText, active && styles.chipTextOn]}>
        {active ? "✓ " : ""}
        {text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f4f6f8"
  },
  content: {
    padding: 20,
    paddingBottom: 50
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  back: {
    color: "#2563eb",
    fontWeight: "800",
    marginTop: 8
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#111827",
    marginTop: 20
  },
  intro: {
    color: "#64748b",
    lineHeight: 20,
    marginTop: 8
  },
  error: {
    backgroundColor: "#fff1f2",
    color: "#be123c",
    padding: 12,
    borderRadius: 12,
    marginTop: 14
  },
  label: {
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8
  },
  help: {
    color: "#64748b",
    fontSize: 11
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  chipOn: {
    backgroundColor: "#111827",
    borderColor: "#111827"
  },
  chipText: {
    color: "#334155",
    fontWeight: "700",
    fontSize: 12
  },
  chipTextOn: {
    color: "#fff"
  },
  active: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  save: {
    backgroundColor: "#2563eb",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 22
  },
  saveText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16
  },
  disabled: {
    opacity: 0.5
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 10,
    backgroundColor: "#e2e8f0"
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827"
  },
  photoPlaceholderText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "900"
  },
  imageButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    padding: 13,
    alignItems: "center"
  },
  imageButtonText: {
    fontWeight: "900",
    color: "#2563eb"
  }
});
