using System;

namespace BarberiaSaaS.Api.Services
{
    /// <summary>
    /// Keeps the configured reservation cadence while restarting it at the end
    /// of a lunch break. This does not change appointment durations or saved shifts.
    /// </summary>
    public static class HorariosAlmuerzo
    {
        public static DateTime AjustarInicio(DateTime candidato, TimeSpan? inicioAlmuerzo, TimeSpan? finAlmuerzo)
        {
            if (!inicioAlmuerzo.HasValue || !finAlmuerzo.HasValue || finAlmuerzo <= inicioAlmuerzo)
                return candidato;

            if (candidato.TimeOfDay >= inicioAlmuerzo.Value && candidato.TimeOfDay < finAlmuerzo.Value)
                return candidato.Date.Add(finAlmuerzo.Value);

            return candidato;
        }
    }
}
