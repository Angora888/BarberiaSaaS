using System.Security.Claims;

namespace BarberiaSaaS.Api.Services
{
    public class TenantContext : ITenantContext
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public TenantContext(
            IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        private ClaimsPrincipal? User =>
            _httpContextAccessor.HttpContext?.User;

        // ============================================================
        // ESTÁ AUTENTICADO
        // ============================================================

        public bool EstaAutenticado =>
            User?.Identity?.IsAuthenticated == true;

        // ============================================================
        // TENANT ID
        // ============================================================

        public int TenantId
        {
            get
            {
                var value =
                    User?.FindFirstValue("TenantId");

                if (string.IsNullOrWhiteSpace(value) ||
                    !int.TryParse(value, out var tenantId))
                {
                    throw new UnauthorizedAccessException(
                        "No se pudo determinar el TenantId del usuario.");
                }

                return tenantId;
            }
        }

        // ============================================================
        // USUARIO ID
        // ============================================================

        public int UsuarioId
        {
            get
            {
                var value =
                    User?.FindFirstValue(
                        ClaimTypes.NameIdentifier);

                if (string.IsNullOrWhiteSpace(value) ||
                    !int.TryParse(value, out var usuarioId))
                {
                    throw new UnauthorizedAccessException(
                        "No se pudo determinar el UsuarioId.");
                }

                return usuarioId;
            }
        }

        // ============================================================
        // SUCURSAL ID
        // ============================================================

        public int? SucursalId
        {
            get
            {
                var value =
                    User?.FindFirstValue("SucursalId");

                if (string.IsNullOrWhiteSpace(value))
                {
                    return null;
                }

                if (!int.TryParse(value, out var sucursalId))
                {
                    return null;
                }

                return sucursalId;
            }
        }

        // ============================================================
        // ROL
        // ============================================================

        public string Rol =>
            User?.FindFirstValue(ClaimTypes.Role)
            ?? string.Empty;
    }
}