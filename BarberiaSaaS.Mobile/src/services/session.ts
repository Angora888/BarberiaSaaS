import * as SecureStore from "expo-secure-store";

export type UsuarioSesion = {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  rol: string;
  tenantId: number;
  sucursalId?: number | null;
  negocio: string;
  sucursal?: string | null;
};

const TOKEN_KEY = "barberiasaas_token";
const USER_KEY = "barberiasaas_usuario";

export async function guardarSesion(token: string, usuario: UsuarioSesion) {
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, token),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(usuario))
  ]);
}

export async function obtenerToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function obtenerUsuario(): Promise<UsuarioSesion | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function cerrarSesion() {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY)
  ]);
}
