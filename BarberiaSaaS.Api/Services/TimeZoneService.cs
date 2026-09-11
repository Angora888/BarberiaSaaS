using BarberiaSaaS.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Services
{
    public class TimeZoneService : ITimeZoneService
    {
        private readonly AppDbContext _context;

        private const string ZonaHorariaDefault =
            "America/Costa_Rica";

        public TimeZoneService(
            AppDbContext context)
        {
            _context = context;
        }

        public async Task<string> ObtenerZonaHorariaAsync(
            int tenantId)
        {
            var zonaHoraria = await _context.ConfiguracionesTenant
                .Where(x => x.TenantId == tenantId)
                .Select(x => x.ZonaHoraria)
                .FirstOrDefaultAsync();

            if (string.IsNullOrWhiteSpace(zonaHoraria))
            {
                return ZonaHorariaDefault;
            }

            return zonaHoraria;
        }

        public async Task<DateTime> LocalAUtcAsync(
            int tenantId,
            DateTime fechaLocal)
        {
            var zonaId =
                await ObtenerZonaHorariaAsync(tenantId);

            var zona =
                ObtenerTimeZoneInfo(zonaId);

            var fechaSinZona =
                DateTime.SpecifyKind(
                    fechaLocal,
                    DateTimeKind.Unspecified);

            var fechaUtc =
                TimeZoneInfo.ConvertTimeToUtc(
                    fechaSinZona,
                    zona);

            return DateTime.SpecifyKind(
                fechaUtc,
                DateTimeKind.Utc);
        }

        public async Task<DateTime> UtcALocalAsync(
            int tenantId,
            DateTime fechaUtc)
        {
            var zonaId =
                await ObtenerZonaHorariaAsync(tenantId);

            var zona =
                ObtenerTimeZoneInfo(zonaId);

            var utc =
                DateTime.SpecifyKind(
                    fechaUtc,
                    DateTimeKind.Utc);

            return TimeZoneInfo.ConvertTimeFromUtc(
                utc,
                zona);
        }

        private static TimeZoneInfo ObtenerTimeZoneInfo(
            string zonaId)
        {
            try
            {
                return TimeZoneInfo
                    .FindSystemTimeZoneById(zonaId);
            }
            catch (TimeZoneNotFoundException)
            {
                // Fallback para algunos entornos Windows.
                return TimeZoneInfo
                    .FindSystemTimeZoneById(
                        "Central America Standard Time");
            }
            catch (InvalidTimeZoneException)
            {
                return TimeZoneInfo
                    .FindSystemTimeZoneById(
                        "Central America Standard Time");
            }
        }
    }
}