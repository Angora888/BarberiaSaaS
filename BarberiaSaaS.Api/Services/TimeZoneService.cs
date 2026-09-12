using BarberiaSaaS.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Services
{
    public class TimeZoneService : ITimeZoneService
    {
        private readonly AppDbContext _context;

        private const string ZonaHorariaDefault =
            "America/Costa_Rica";

        private readonly Dictionary<int, string>
            _zonasHorariasPorTenant = new();

        private readonly Dictionary<string, TimeZoneInfo>
            _timeZones = new(
                StringComparer.OrdinalIgnoreCase);

        public TimeZoneService(
            AppDbContext context)
        {
            _context = context;
        }

        public async Task<string> ObtenerZonaHorariaAsync(
            int tenantId)
        {
            if (
                _zonasHorariasPorTenant.TryGetValue(
                    tenantId,
                    out var zonaHorariaCache)
            )
            {
                return zonaHorariaCache;
            }

            var zonaHoraria =
                await _context.ConfiguracionesTenant
                    .AsNoTracking()
                    .Where(x =>
                        x.TenantId == tenantId)
                    .Select(x =>
                        x.ZonaHoraria)
                    .FirstOrDefaultAsync();

            if (
                string.IsNullOrWhiteSpace(
                    zonaHoraria)
            )
            {
                zonaHoraria =
                    ZonaHorariaDefault;
            }

            _zonasHorariasPorTenant[tenantId] =
                zonaHoraria;

            return zonaHoraria;
        }

        public async Task<DateTime> LocalAUtcAsync(
            int tenantId,
            DateTime fechaLocal)
        {
            var zonaId =
                await ObtenerZonaHorariaAsync(
                    tenantId);

            var zona =
                ObtenerTimeZoneInfo(
                    zonaId);

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
                await ObtenerZonaHorariaAsync(
                    tenantId);

            var zona =
                ObtenerTimeZoneInfo(
                    zonaId);

            var utc =
                DateTime.SpecifyKind(
                    fechaUtc,
                    DateTimeKind.Utc);

            return TimeZoneInfo.ConvertTimeFromUtc(
                utc,
                zona);
        }

        private TimeZoneInfo ObtenerTimeZoneInfo(
            string zonaId)
        {
            if (
                _timeZones.TryGetValue(
                    zonaId,
                    out var zonaCache)
            )
            {
                return zonaCache;
            }

            TimeZoneInfo zona;

            try
            {
                zona =
                    TimeZoneInfo
                        .FindSystemTimeZoneById(
                            zonaId);
            }
            catch (
                TimeZoneNotFoundException)
            {
                zona =
                    ObtenerZonaFallback();
            }
            catch (
                InvalidTimeZoneException)
            {
                zona =
                    ObtenerZonaFallback();
            }

            _timeZones[zonaId] = zona;

            return zona;
        }

        private static TimeZoneInfo ObtenerZonaFallback()
        {
            try
            {
                return TimeZoneInfo
                    .FindSystemTimeZoneById(
                        ZonaHorariaDefault);
            }
            catch (
                TimeZoneNotFoundException)
            {
                return TimeZoneInfo
                    .FindSystemTimeZoneById(
                        "Central America Standard Time");
            }
            catch (
                InvalidTimeZoneException)
            {
                return TimeZoneInfo
                    .FindSystemTimeZoneById(
                        "Central America Standard Time");
            }
        }
    }
}
