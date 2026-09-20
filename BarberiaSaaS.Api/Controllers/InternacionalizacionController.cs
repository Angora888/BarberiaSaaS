using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class InternacionalizacionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;
        private readonly IInternacionalizacionService _internacionalizacion;

        public InternacionalizacionController(
            AppDbContext context,
            ITenantContext tenantContext,
            IInternacionalizacionService internacionalizacion)
        {
            _context = context;
            _tenantContext = tenantContext;
            _internacionalizacion = internacionalizacion;
        }

        [HttpGet("paises")]
        public async Task<IActionResult> GetPaises()
        {
            var tenantId = _tenantContext.TenantId;
            var paisTenant = await _context.Tenants
                .Where(x => x.Id == tenantId)
                .Select(x => x.PaisCodigo)
                .FirstAsync();

            return Ok(new
            {
                paisPredeterminado = paisTenant,
                paises = _internacionalizacion.ObtenerPaises()
            });
        }
    }
}
