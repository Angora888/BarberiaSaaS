namespace BarberiaSaaS.Api.Services
{
    public interface ITimeZoneService
    {
        Task<string> ObtenerZonaHorariaAsync(int tenantId);

        Task<DateTime> LocalAUtcAsync(
            int tenantId,
            DateTime fechaLocal);

        Task<DateTime> UtcALocalAsync(
            int tenantId,
            DateTime fechaUtc);
    }
}