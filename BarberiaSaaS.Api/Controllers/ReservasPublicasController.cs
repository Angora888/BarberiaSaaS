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

        public ReservasPublicasController(
            AppDbContext context,
            ITimeZoneService timeZoneService)
        {
            _context = context;
            _timeZoneService = timeZoneService;
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

            var telefonoNormalizado =
                NormalizarTelefono(request.Telefono);

            if (telefonoNormalizado.Length != 8)
            {
                return BadRequest(new
                {
                    mensaje = "Ingresa exactamente 8 dígitos en el teléfono."
                });
            }

            var telefonoFormatoCostaRica =
                FormatearTelefonoCostaRica(
                    telefonoNormalizado);

            if (request.ServicioId <= 0 ||
                request.ProfesionalId <= 0 ||
                request.DuracionMinutos <= 0)
            {
                return BadRequest(new
                {
                    mensaje = "La información de la cita no está completa."
                });
            }

            if (!TimeSpan.TryParse(request.HoraInicio, out var horaInicio))
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
                    NormalizarTelefono(x.Telefono) == telefonoNormalizado);

            var clienteCreado = false;

            if (cliente == null)
            {
                var nombrePartes = SepararNombre(request.NombreCompleto);

                cliente = new Cliente
                {
                    TenantId = tenantId,
                    Nombre = nombrePartes.Nombre,
                    Apellidos = nombrePartes.Apellidos,
                    Telefono = telefonoFormatoCostaRica,
                    Activo = true,
                    FechaCreacion = DateTime.UtcNow
                };

                _context.Clientes.Add(cliente);
                clienteCreado = true;
            }
            else if (cliente.Telefono != telefonoFormatoCostaRica)
            {
                cliente.Telefono = telefonoFormatoCostaRica;
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

        private static string NormalizarTelefono(string? telefono)
        {
            if (string.IsNullOrWhiteSpace(telefono))
            {
                return string.Empty;
            }

            var digitos = new string(
                telefono.Where(char.IsDigit).ToArray());

            if (digitos.StartsWith("00"))
            {
                digitos = digitos[2..];
            }

            if (digitos.Length == 11 &&
                digitos.StartsWith("506"))
            {
                digitos = digitos[3..];
            }

            return digitos;
        }

        private static string FormatearTelefonoCostaRica(
            string telefonoNormalizado)
        {
            return $"+506{telefonoNormalizado}";
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
    }

    public class CrearReservaPublicaDto
    {
        public string NombreCompleto { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public int ServicioId { get; set; }
        public int ProfesionalId { get; set; }
        public DateTime Fecha { get; set; }
        public string HoraInicio { get; set; } = string.Empty;
        public int DuracionMinutos { get; set; }
    }
}
