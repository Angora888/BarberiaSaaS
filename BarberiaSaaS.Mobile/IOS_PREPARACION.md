# Preparación Mi Agenda CR para iOS

Se reutiliza **BarberiaSaaS.Mobile** (Expo SDK 57), el backend .NET y los datos de Neon. Android conserva `com.barberiasaas.mobile` y la marca actual; iOS usa `com.miagendacr.app` y el nombre visible **Mi Agenda CR**.

## Sign in with Apple

- iOS configura `usesAppleSignIn: true` y el plugin `expo-apple-authentication` (SDK 57).
- Desde `/login`, Apple envía el `identityToken` a `POST /api/auth/apple/login`.
- La API verifica **firma RS256 con JWKS de Apple, emisor, audiencia, vencimiento** y utiliza el identificador estable `sub`. No confía en el correo enviado por el teléfono.
- Para impedir secuestro o duplicado de cuentas, no vinculamos automáticamente por correo. El usuario primero accede con correo/contraseña y vincula Apple desde **Configuración → Acceso con Apple** mediante `POST /api/auth/apple/link`, que exige un JWT de sesión válido.
- La identidad se guarda en `AppleIdentities` con índices únicos de `Subject` y `UsuarioId`.
- El login conserva el JWT, las autorizaciones, las restricciones de suscripción y la base de datos existentes.

## Pasos pendientes para habilitarlo

1. Aplicar la migración EF Core `20261118190000_AddAppleIdentities` **de forma controlada**, antes de probar las rutas Apple en la API desplegada. No ejecutar SQL manual sin verificar las migraciones aplicadas.
2. En Apple Developer, registrar el Bundle ID `com.miagendacr.app` y habilitar **Sign in with Apple** para el App ID. Crear certificados/perfiles desde EAS.
3. Instalar dependencias del móvil en el equipo local con `npx expo install expo-apple-authentication`, y ejecutar `npx expo install --check` y `npx tsc --noEmit`.
4. Crear la compilación física de prueba con `eas build --platform ios --profile preview` una vez que exista membresía/credenciales. Verificar que el consentimiento Apple y los entitlements estén disponibles.
5. Probar: cuenta existente, vinculación, login sucesivo, cancelación, usuario no vinculado, cuenta inactiva, pérdida de suscripción, usuario profesional, correo oculto y Android sin regresiones.
6. Antes de publicar, generar iconos, screenshots de iPhone, revisar políticas y notificaciones APNs/Expo con credenciales de Apple, y subir build a TestFlight.

**Nota:** El botón no debe tratarse como listo para clientes hasta que se haya aplicado la migración, completado la inscripción Apple y probado una build firmada. La marca de App Store se define también en App Store Connect. Apple puede ocultar el correo y solo entregar nombre una vez.

## Comandos

```sh
cd BarberiaSaaS.Mobile
npm install
npx expo install --check
npm run typecheck
npx eas-cli build --platform ios --profile production
```

Para aplicar migraciones EF Core de forma controlada, confirmar primero la versión y el historial de la BD mediante `dotnet ef migrations list` y el procedimiento operativo del proyecto.
