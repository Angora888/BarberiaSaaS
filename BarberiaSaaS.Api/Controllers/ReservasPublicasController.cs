using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Models;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Controllers
{
    [ApiController]
    [Route("api/Publico/{slug}/reservas")]
    [AllowAnonymous]
    public class ReservasPublicasController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITimeZoneService _timeZoneService;
        private readonly IInternacionalizacionService _internacionalizacion;
        private readonly IPushNotificationService _push;

        public ReservasPublicasController(
            AppDbContext context,
            ITimeZoneService timeZoneService,
            IInternacionalizacionService internacionalizacion,
            IPushNotificationService push)
        {
            _context = context;
            _timeZoneService = timeZoneService;
            _internacionalizacion = internacionalizacion;
            _push = push;
        }

        [HttpPost]
        public async Task<IActionResult> Crear(
            string slug,
            CrearReservaPublicaDto request)
        {
            if (string.IsNullOrWhiteSpace(slug))
            {
                return BadRequest(new
                {
                    mensaje = "El negocio es obligatorio."
                });
            }

            if (string.IsNullOrWhiteSpace(request.NombreCompleto))
            {
                return BadRequest(new
                {
                    mensaje = "Ingresa tu nombre completo."
                });
            }

            if (request.ServicioId <= 0 ||
                request.ProfesionalId <= 0 ||
                request.DuracionMinutos <= 0)
            {
                return BadRequest(new
                {
                    mensaje = "La información de la cita no está completa."
                });
            }

            if (!TryParseHoraReserva(request.HoraInicio, out var horaInicio))
            {
                return BadRequest(new
                {
                    mensaje = "La hora seleccionada no es válida."
                });
            }

            slug = slug.Trim().ToLowerInvariant();

            var tenant = await _context.Tenants
                .FirstOrDefaultAsync(x =>
                    x.Activo &&
                    x.LandingPublicaActiva &&
                    x.SlugPublico != null &&
                    x.SlugPublico.ToLower() == slug);

            if (tenant == null)
            {
                return NotFound(new
                {
                    mensaje = "La página pública del negocio no está disponible."
                });
            }

            var paisTelefono = string.IsNullOrWhiteSpace(request.PaisCodigoTelefono)
                ? tenant.PaisCodigo
                : request.PaisCodigoTelefono.Trim().ToUpperInvariant();

            if (!_internacionalizacion.TryNormalizarTelefono(
                    request.Telefono,
                    paisTelefono,
                    out var telefonoE164,
                    out var errorTelefono))
            {
                return BadRequest(new { mensaje = errorTelefono });
            }

            var tenantId = tenant.Id;

            var servicio = await _context.Servicios
                .FirstOrDefaultAsync(x =>
                    x.Id == request.ServicioId &&
                    x.TenantId == tenantId &&
                    x.Activo);

            if (servicio == null)
            {
                return BadRequest(new
                {
                    mensaje = "El servicio seleccionado ya no está disponible."
                });
            }

            var profesional = await _context.Profesionales
                .FirstOrDefaultAsync(x =>
                    x.Id == request.ProfesionalId &&
                    x.TenantId == tenantId &&
                    x.Activo);

            if (profesional == null)
            {
                return BadRequest(new
                {
                    mensaje = "El profesional seleccionado ya no está disponible."
                });
            }

            var realizaServicio = await _context.ProfesionalServicios
                .AnyAsync(x =>
                    x.ProfesionalId == profesional.Id &&
                    x.ServicioId == servicio.Id);

            if (!realizaServicio)
            {
                return BadRequest(new
                {
                    mensaje = "El profesional seleccionado no realiza este servicio."
                });
            }

            var sucursalId = profesional.SucursalId;

            if (!sucursalId.HasValue)
            {
                sucursalId = await _context.Sucursales
                    .Where(x =>
                        x.TenantId == tenantId &&
                        x.Activa)
                    .OrderBy(x => x.Id)
                    .Select(x => (int?)x.Id)
                    .FirstOrDefaultAsync();
            }

            if (!sucursalId.HasValue)
            {
                return BadRequest(new
                {
                    mensaje = "El negocio no tiene una sucursal activa para registrar la cita."
                });
            }

            var sucursalValida = await _context.Sucursales
                .AnyAsync(x =>
                    x.Id == sucursalId.Value &&
                    x.TenantId == tenantId &&
                    x.Activa);

            if (!sucursalValida)
            {
                return BadRequest(new
                {
                    mensaje = "La sucursal del profesional no está disponible."
                });
            }

            var fechaLocal = DateTime.SpecifyKind(
                request.Fecha.Date,
                DateTimeKind.Unspecified);

            var inicioLocal = fechaLocal.Add(horaInicio);
            var finLocal = inicioLocal.AddMinutes(request.DuracionMinutos);

            var ahoraLocal = await _timeZoneService.UtcALocalAsync(
                tenantId,
                DateTime.UtcNow);

            if (inicioLocal <= ahoraLocal)
            {
                return Conflict(new
                {
                    mensaje = "Ese horario ya pasó. Selecciona otro espacio disponible."
                });
            }

            var horarioValido = await _context.HorariosProfesionales
                .AnyAsync(x =>
                    x.TenantId == tenantId &&
                    x.ProfesionalId == profesional.Id &&
                    x.Activo &&
                    x.DiaSemana == inicioLocal.DayOfWeek &&
                    x.HoraInicio <= inicioLocal.TimeOfDay &&
                    x.HoraFin >= finLocal.TimeOfDay);

            if (!horarioValido)
            {
                return Conflict(new
                {
                    mensaje = "Ese horario ya no se encuentra disponible."
                });
            }

            var chocaConAlmuerzo = await _context.AlmuerzosProfesionales
                .AnyAsync(x =>
                    x.TenantId == tenantId &&
                    x.ProfesionalId == profesional.Id &&
                    x.DiaSemana == inicioLocal.DayOfWeek &&
                    x.Activo &&
                    inicioLocal.TimeOfDay < x.HoraFin &&
                    finLocal.TimeOfDay > x.HoraInicio);

            if (chocaConAlmuerzo)
            {
                return Conflict(new { mensaje = "Ese horario coincide con la hora de almuerzo del profesional." });
            }

            var inicioUtc = await _timeZoneService.LocalAUtcAsync(
                tenantId,
                inicioLocal);

            var finUtc = await _timeZoneService.LocalAUtcAsync(
                tenantId,
                finLocal);

            var chocaConCita = await _context.Citas
                .AnyAsync(x =>
                    x.TenantId == tenantId &&
                    x.ProfesionalId == profesional.Id &&
                    x.Estado != EstadosCita.Cancelada &&
                    inicioUtc < x.FechaFin &&
                    finUtc > x.FechaInicio);

            if (chocaConCita)
            {
                return Conflict(new
                {
                    mensaje = "Ese espacio acaba de ser reservado. Selecciona otro horario."
                });
            }

            var chocaConBloqueo = await _context.BloqueosProfesionales
                .AnyAsync(x =>
                    x.TenantId == tenantId &&
                    x.ProfesionalId == profesional.Id &&
                    inicioUtc < x.FechaFin &&
                    finUtc > x.FechaInicio);

            if (chocaConBloqueo)
            {
                return Conflict(new
                {
                    mensaje = "Ese horario ya no se encuentra disponible."
                });
            }

            var clientesTenant = await _context.Clientes
                .Where(x =>
                    x.TenantId == tenantId &&
                    x.Activo &&
                    x.Telefono != null)
                .ToListAsync();

            var cliente = clientesTenant
                .FirstOrDefault(x =>
                    string.Equals(x.Telefono, telefonoE164, StringComparison.OrdinalIgnoreCase));

            var clienteCreado = false;

            if (cliente == null)
            {
                var nombrePartes = SepararNombre(request.NombreCompleto);

                cliente = new Cliente
                {
                    TenantId = tenantId,
                    Nombre = nombrePartes.Nombre,
                    Apellidos = nombrePartes.Apellidos,
                    Telefono = telefonoE164,
                    PaisCodigoTelefono = paisTelefono,
                    Activo = true,
                    FechaCreacion = DateTime.UtcNow
                };

                _context.Clientes.Add(cliente);
                clienteCreado = true;
            }
            else
            {
                cliente.Telefono = telefonoE164;
                cliente.PaisCodigoTelefono = paisTelefono;
            }

            var cita = new Cita
            {
                TenantId = tenantId,
                SucursalId = sucursalId.Value,
                Cliente = cliente,
                ProfesionalId = profesional.Id,
                ServicioId = servicio.Id,
                ServicioVarianteId = null,
                FechaInicio = inicioUtc,
                DuracionMinutos = request.DuracionMinutos,
                FechaFin = finUtc,
                Precio = servicio.Precio,
                Estado = EstadosCita.Pendiente,
                Notas = "Reserva solicitada desde la página pública.",
                FechaCreacion = DateTime.UtcNow
            };

            _context.Citas.Add(cita);

            await _context.SaveChangesAsync();

            await _push.EnviarTenantAsync(
                tenantId,
                "📅 Nueva cita",
                $"{request.NombreCompleto.Trim()} reservó {servicio.Nombre} para {inicioLocal:dd/MM/yyyy HH:mm}.",
                new { tipo = "nueva_cita", citaId = cita.Id });

            return Ok(new
            {
                mensaje = "¡Listo! Tu solicitud de cita fue registrada correctamente.",
                citaId = cita.Id,
                clienteId = cliente.Id,
                clienteCreado,
                servicio = servicio.Nombre,
                profesional = $"{profesional.Nombre} {profesional.Apellidos}".Trim(),
                fecha = inicioLocal.ToString("yyyy-MM-dd"),
                hora = inicioLocal.ToString("HH:mm"),
                duracionMinutos = cita.DuracionMinutos,
                precioEstimado = cita.Precio,
                estado = cita.Estado
            });
        }

        private static (string Nombre, string Apellidos) SepararNombre(
            string nombreCompleto)
        {
            var partes = nombreCompleto
                .Trim()
                .Split(' ', StringSplitOptions.RemoveEmptyEntries);

            if (partes.Length == 0)
            {
                return ("Cliente", string.Empty);
            }

            if (partes.Length == 1)
            {
                return (partes[0], string.Empty);
            }

            return (
                partes[0],
                string.Join(" ", partes.Skip(1)));
        }

        private static bool TryParseHoraReserva(string? valor, out TimeSpan hora)
        {
            hora = default;

            if (string.IsNullOrWhiteSpace(valor))
                return false;

            var formatos = new[]
            {
                "H:mm",
                "HH:mm",
                "H:mm:ss",
                "HH:mm:ss",
                "h:mm tt",
                "hh:mm tt"
            };

            if (DateTime.TryParseExact(
                    valor.Trim(),
                    formatos,
                    System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.AllowWhiteSpaces,
                    out var fechaHora))
            {
                hora = fechaHora.TimeOfDay;
                return true;
            }

            return TimeSpan.TryParse(
                valor.Trim(),
                System.Globalization.CultureInfo.InvariantCulture,
                out hora);
        }

    }

    public class CrearReservaPublicaDto
    {
        public string NombreCompleto { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string? PaisCodigoTelefono { get; set; }
        public int ServicioId { get; set; }
        public int ProfesionalId { get; set; }
        public DateTime Fecha { get; set; }
        public string HoraInicio { get; set; } = string.Empty;
        public int DuracionMinutos { get; set; }


    }
}
