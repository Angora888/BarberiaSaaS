using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarberiaSaaS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PruebaController : ControllerBase
    {
        private readonly ITenantContext _tenantContext;

        public PruebaController(
            ITenantContext tenantContext)
        {
            _tenantContext = tenantContext;
        }

        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new
            {
                autenticado =
                    _tenantContext.EstaAutenticado,

                usuarioId =
                    _tenantContext.UsuarioId,

                tenantId =
                    _tenantContext.TenantId,

                sucursalId =
                    _tenantContext.SucursalId,

                rol =
                    _tenantContext.Rol
            });
        }
    }
}