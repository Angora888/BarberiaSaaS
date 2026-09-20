using PhoneNumbers;

namespace BarberiaSaaS.Api.Services
{
    public sealed record PaisSoportado(
        string Codigo,
        string Nombre,
        string Bandera,
        string CodigoTelefonico,
        string Moneda,
        string ZonaHoraria,
        string Idioma);

    public interface IInternacionalizacionService
    {
        IReadOnlyList<PaisSoportado> ObtenerPaises();
        bool TryNormalizarTelefono(string? telefono, string? paisCodigo, out string? telefonoE164, out string? error);
        PaisSoportado? ObtenerPais(string? paisCodigo);
    }

    public sealed class InternacionalizacionService : IInternacionalizacionService
    {
        private static readonly PhoneNumberUtil PhoneUtil = PhoneNumberUtil.GetInstance();

        private static readonly IReadOnlyList<PaisSoportado> Paises = new[]
        {
            new PaisSoportado("CR", "Costa Rica", "🇨🇷", "+506", "CRC", "America/Costa_Rica", "es"),
            new PaisSoportado("PA", "Panamá", "🇵🇦", "+507", "USD", "America/Panama", "es"),
            new PaisSoportado("NI", "Nicaragua", "🇳🇮", "+505", "NIO", "America/Managua", "es"),
            new PaisSoportado("HN", "Honduras", "🇭🇳", "+504", "HNL", "America/Tegucigalpa", "es"),
            new PaisSoportado("SV", "El Salvador", "🇸🇻", "+503", "USD", "America/El_Salvador", "es"),
            new PaisSoportado("GT", "Guatemala", "🇬🇹", "+502", "GTQ", "America/Guatemala", "es"),
            new PaisSoportado("BZ", "Belice", "🇧🇿", "+501", "BZD", "America/Belize", "en"),
            new PaisSoportado("US", "Estados Unidos", "🇺🇸", "+1", "USD", "America/New_York", "en")
        };

        public IReadOnlyList<PaisSoportado> ObtenerPaises() => Paises;

        public PaisSoportado? ObtenerPais(string? paisCodigo)
        {
            var codigo = paisCodigo?.Trim().ToUpperInvariant();
            return Paises.FirstOrDefault(x => x.Codigo == codigo);
        }

        public bool TryNormalizarTelefono(
            string? telefono,
            string? paisCodigo,
            out string? telefonoE164,
            out string? error)
        {
            telefonoE164 = null;
            error = null;

            if (string.IsNullOrWhiteSpace(telefono))
            {
                error = "El teléfono del negocio es requerido.";
                return false;
            }

            var pais = ObtenerPais(paisCodigo);
            if (pais == null)
            {
                error = "Selecciona un país válido.";
                return false;
            }

            try
            {
                var numero = PhoneUtil.Parse(telefono.Trim(), pais.Codigo);

                if (!PhoneUtil.IsValidNumberForRegion(numero, pais.Codigo))
                {
                    error = $"El teléfono no es válido para {pais.Nombre}.";
                    return false;
                }

                telefonoE164 = PhoneUtil.Format(numero, PhoneNumberFormat.E164);
                return true;
            }
            catch (NumberParseException)
            {
                error = $"El teléfono no es válido para {pais.Nombre}.";
                return false;
            }
        }
    }
}
