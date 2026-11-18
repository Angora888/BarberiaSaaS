# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


## Inicio de sesión con Google (web)

El login tradicional se mantiene. Google Identity Services aparece en `/login` solo cuando se define `VITE_GOOGLE_CLIENT_ID` en el frontend. La API valida la firma, vencimiento y audiencia del ID token con `Google.Apis.Auth` y responde con el mismo JWT y perfil que el login convencional.

1. En Google Cloud Console, configurar la pantalla de consentimiento OAuth y crear un cliente **Aplicación web**.
2. Agregar los orígenes JavaScript autorizados `https://barberiasaas.com`, `https://www.barberiasaas.com`, `https://miagendacr.app`, `https://www.miagendacr.app` (y `http://localhost:5173` solo para pruebas locales).
3. Configurar `VITE_GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com` en cada proyecto Vercel que sirva la web y volver a desplegar el frontend.
4. Configurar `GoogleAuth__ClientId=<mismo-client-id>` en Azure App Service (API) y reiniciar la aplicación para cargar los settings.
5. Probar con usuarios existentes activos cuyo negocio tenga correo confirmado. No se crean usuarios ni negocios nuevos mediante este endpoint.

**Importante:** usar el ID de cliente público, **nunca** un Client Secret en Vite, JavaScript ni en el repositorio. Si la pantalla de consentimiento OAuth está en modo prueba, agregar las cuentas de prueba permitidas en Google Cloud.
