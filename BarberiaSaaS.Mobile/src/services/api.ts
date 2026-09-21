import axios from "axios";
import * as SecureStore from "expo-secure-store";

const baseURL =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://barberiasaas-egfgfkezcrgzcpcz.canadacentral-01.azurewebsites.net/api";

const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("barberiasaas_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
