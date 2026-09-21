# Barbería SaaS Mobile

Aplicación móvil separada del frontend web. Consume la API existente de Barbería SaaS y no modifica la API ni la base de datos.

## Requisitos
- Node.js 22.13+ para Expo SDK 57
- Expo Go en iPhone/Android
- VS Code

## Ejecutar
1. Copia `.env.example` a `.env`.
2. Ejecuta `npm install`.
3. Ejecuta `npx expo install --fix` para alinear las dependencias con el SDK instalado.
4. Ejecuta `npx expo start`.
5. Escanea el QR con Expo Go.

Si la red local bloquea la conexión: `npx expo start --tunnel`.

## Estado inicial
- Welcome
- Login real contra /api/Auth/login
- JWT y usuario guardados con SecureStore
- Dashboard inicial
- Recuperación de contraseña
