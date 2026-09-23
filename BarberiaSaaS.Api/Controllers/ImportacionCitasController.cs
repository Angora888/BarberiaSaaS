using System.Globalization;
using System.IO.Compression;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Models;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Controllers
{
    [ApiController]
    [Route("api/importacion-citas")]
    [Authorize]
    public class ImportacionCitasController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;
        private readonly ITimeZoneService _timeZoneService;

        public ImportacionCitasController(
            AppDbContext context,
            ITenantContext tenantContext,
            ITimeZoneService timeZoneService)
        {
            _context = context;
            _tenantContext = tenantContext;
            _timeZoneService = timeZoneService;
        }

        [HttpPost("validar")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Validar([FromForm] ImportarCitasRequest request)
        {
            var resultado = await PrepararAsync(request);
            if (resultado.ErrorGeneral != null)
                return BadRequest(new { mensaje = resultado.ErrorGeneral });

            return Ok(new
            {
                total = resultado.Filas.Count,
                validas = resultado.Filas.Count(x => x.Errores.Count == 0),
                conErrores = resultado.Filas.Count(x => x.Errores.Count > 0),
                filas = resultado.Filas.Select(SerializarFila)
            });
        }

        [HttpPost("importar")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Importar([FromForm] ImportarCitasRequest request)
        {
            var tenantId = _tenantContext.TenantId;
            var resultado = await PrepararAsync(request);

            if (resultado.ErrorGeneral != null)
                return BadRequest(new { mensaje = resultado.ErrorGeneral });

            var errores = resultado.Filas.Where(x => x.Errores.Count > 0).ToList();
            if (errores.Count > 0)
            {
                return BadRequest(new
                {
                    mensaje = "El archivo tiene filas que deben corregirse antes de importar.",
                    filas = resultado.Filas.Select(SerializarFila)
                });
            }

            var sucursal = await _context.Sucursales
                .FirstAsync(x => x.Id == request.SucursalId && x.TenantId == tenantId);

            var profesional = await _context.Profesionales
                .FirstAsync(x => x.Id == request.ProfesionalId && x.TenantId == tenantId);

            await using var transaction = await _context.Database.BeginTransactionAsync();

            var telefonos = resultado.Filas.Select(x => x.Telefono).Distinct().ToList();
            var clientesExistentes = await _context.Clientes
                .Where(x => x.TenantId == tenantId && x.Telefono != null && telefonos.Contains(x.Telefono))
                .ToListAsync();

            var clientesPorTelefono = clientesExistentes
                .GroupBy(x => x.Telefono!)
                .ToDictionary(x => x.Key, x => x.First());

            var creados = 0;
            var citasCreadas = 0;

            foreach (var fila in resultado.Filas.OrderBy(x => x.FechaInicioLocal))
            {
                if (!clientesPorTelefono.TryGetValue(fila.Telefono, out var cliente))
                {
                    cliente = new Cliente
                    {
                        TenantId = tenantId,
                        Nombre = fila.Cliente,
                        Apellidos = string.Empty,
                        Telefono = fila.Telefono,
                        PaisCodigoTelefono = fila.Telefono.StartsWith("+506") ? "CR" : null,
                        Activo = true,
                        FechaCreacion = DateTime.UtcNow
                    };

                    _context.Clientes.Add(cliente);
                    await _context.SaveChangesAsync();
                    clientesPorTelefono[fila.Telefono] = cliente;
                    creados++;
                }

                var inicioUtc = await _timeZoneService.LocalAUtcAsync(tenantId, fila.FechaInicioLocal);
                var finUtc = await _timeZoneService.LocalAUtcAsync(tenantId, fila.FechaFinLocal);

                _context.Citas.Add(new Cita
                {
                    TenantId = tenantId,
                    SucursalId = sucursal.Id,
                    ClienteId = cliente.Id,
                    ProfesionalId = profesional.Id,
                    ServicioId = fila.ServicioId!.Value,
                    ServicioVarianteId = null,
                    FechaInicio = inicioUtc,
                    FechaFin = finUtc,
                    DuracionMinutos = fila.DuracionMinutos,
                    Precio = fila.Precio,
                    Estado = EstadosCita.Confirmada,
                    Notas = "Importada desde Excel.",
                    FechaCreacion = DateTime.UtcNow
                });

                citasCreadas++;
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new
            {
                mensaje = $"Importación completada: {citasCreadas} citas.",
                citasCreadas,
                clientesCreados = creados,
                clientesExistentes = resultado.Filas.Select(x => x.Telefono).Distinct().Count() - creados
            });
        }

        private async Task<PreparacionResultado> PrepararAsync(ImportarCitasRequest request)
        {
            var tenantId = _tenantContext.TenantId;

            if (request.Archivo == null || request.Archivo.Length == 0)
                return PreparacionResultado.Error("Selecciona un archivo Excel.");

            if (!Path.GetExtension(request.Archivo.FileName).Equals(".xlsx", StringComparison.OrdinalIgnoreCase))
                return PreparacionResultado.Error("El archivo debe ser .xlsx.");

            var sucursal = await _context.Sucursales
                .FirstOrDefaultAsync(x => x.Id == request.SucursalId && x.TenantId == tenantId && x.Activa);

            if (sucursal == null)
                return PreparacionResultado.Error("Selecciona una sucursal válida.");

            var profesional = await _context.Profesionales
                .Include(x => x.Servicios)
                .FirstOrDefaultAsync(x => x.Id == request.ProfesionalId && x.TenantId == tenantId && x.Activo);

            if (profesional == null)
                return PreparacionResultado.Error("Selecciona un profesional válido.");

            if (profesional.SucursalId.HasValue && profesional.SucursalId.Value != sucursal.Id)
                return PreparacionResultado.Error("El profesional no pertenece a la sucursal seleccionada.");

            List<FilaImportacion> filas;
            try
            {
                await using var stream = request.Archivo.OpenReadStream();
                filas = LeerExcel(stream);
            }
            catch (Exception ex)
            {
                return PreparacionResultado.Error($"No fue posible leer el Excel: {ex.Message}");
            }

            if (filas.Count == 0)
                return PreparacionResultado.Error("No se encontraron citas para importar.");

            var servicios = await _context.Servicios
                .Include(x => x.Variantes)
                .Where(x => x.TenantId == tenantId && x.Activo)
                .ToListAsync();

            var serviciosPorNombre = servicios
                .GroupBy(x => NormalizarTexto(x.Nombre))
                .ToDictionary(x => x.Key, x => x.First());

            var servicioIdsProfesional = profesional.Servicios.Select(x => x.ServicioId).ToHashSet();

            foreach (var fila in filas)
            {
                if (string.IsNullOrWhiteSpace(fila.Cliente))
                    fila.Errores.Add("Cliente requerido.");

                if (!Regex.IsMatch(fila.Telefono, @"^\+\d{8,15}$"))
                    fila.Errores.Add("Celular inválido. Usa formato internacional, por ejemplo +50660662375.");

                if (string.IsNullOrWhiteSpace(fila.Servicio))
                {
                    fila.Errores.Add("Servicio requerido.");
                }
                else if (!serviciosPorNombre.TryGetValue(NormalizarTexto(fila.Servicio), out var servicio))
                {
                    fila.Errores.Add($"No existe el servicio '{fila.Servicio}' en Barbería SaaS.");
                }
                else
                {
                    fila.ServicioId = servicio.Id;
                    fila.Precio = servicio.Precio;

                    if (!servicioIdsProfesional.Contains(servicio.Id))
                        fila.Errores.Add($"El profesional seleccionado no realiza '{servicio.Nombre}'.");

                    if (servicio.Variantes.Any(x => x.Activo))
                        fila.Errores.Add($"'{servicio.Nombre}' tiene variantes. Esta plantilla requiere un servicio sin variantes.");
                }

                if (fila.FechaFinLocal <= fila.FechaInicioLocal)
                    fila.Errores.Add("La hora fin debe ser posterior a la hora inicio.");
            }

            // Conflictos dentro del mismo archivo.
            var ordenadas = filas.OrderBy(x => x.FechaInicioLocal).ToList();
            for (var i = 0; i < ordenadas.Count; i++)
            {
                for (var j = i + 1; j < ordenadas.Count; j++)
                {
                    if (ordenadas[j].FechaInicioLocal >= ordenadas[i].FechaFinLocal)
                        break;

                    ordenadas[i].Errores.Add($"Se traslapa con la fila {ordenadas[j].FilaExcel}.");
                    ordenadas[j].Errores.Add($"Se traslapa con la fila {ordenadas[i].FilaExcel}.");
                }
            }

            // Conflictos con citas ya existentes del profesional.
            foreach (var fila in filas.Where(x => x.Errores.Count == 0))
            {
                var inicioUtc = await _timeZoneService.LocalAUtcAsync(tenantId, fila.FechaInicioLocal);
                var finUtc = await _timeZoneService.LocalAUtcAsync(tenantId, fila.FechaFinLocal);

                var existe = await _context.Citas.AnyAsync(x =>
                    x.TenantId == tenantId &&
                    x.ProfesionalId == profesional.Id &&
                    x.Estado != EstadosCita.Cancelada &&
                    x.FechaInicio < finUtc &&
                    x.FechaFin > inicioUtc);

                if (existe)
                    fila.Errores.Add("Se traslapa con una cita que ya existe en la agenda.");
            }

            return new PreparacionResultado { Filas = filas };
        }

        private static object SerializarFila(FilaImportacion x) => new
        {
            fila = x.FilaExcel,
            fecha = x.FechaInicioLocal.ToString("dd/MM/yyyy"),
            horaInicio = x.FechaInicioLocal.ToString("hh:mm tt", CultureInfo.InvariantCulture),
            horaFin = x.FechaFinLocal.ToString("hh:mm tt", CultureInfo.InvariantCulture),
            x.Cliente,
            x.Telefono,
            x.Servicio,
            duracionMinutos = x.DuracionMinutos,
            valido = x.Errores.Count == 0,
            errores = x.Errores
        };

        private static List<FilaImportacion> LeerExcel(Stream stream)
        {
            using var zip = new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: true);
            var sharedStrings = LeerSharedStrings(zip);
            var sheet = zip.GetEntry("xl/worksheets/sheet1.xml")
                ?? throw new InvalidOperationException("No se encontró la primera hoja del Excel.");

            using var sheetStream = sheet.Open();
            var doc = XDocument.Load(sheetStream);
            var rows = doc.Descendants().Where(x => x.Name.LocalName == "row").ToList();

            Dictionary<string, int>? columnas = null;
            var resultado = new List<FilaImportacion>();

            foreach (var row in rows)
            {
                var numeroFila = (int?)row.Attribute("r") ?? 0;
                var valores = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

                foreach (var cell in row.Elements().Where(x => x.Name.LocalName == "c"))
                {
                    var referencia = (string?)cell.Attribute("r") ?? "";
                    var columna = new string(referencia.TakeWhile(char.IsLetter).ToArray());
                    valores[columna] = LeerValorCelda(cell, sharedStrings);
                }

                if (columnas == null)
                {
                    var encabezados = valores.ToDictionary(
                        x => NormalizarTexto(x.Value),
                        x => ColumnaAIndice(x.Key),
                        StringComparer.OrdinalIgnoreCase);

                    var requeridos = new[] { "fecha", "hora inicio", "hora fin", "cliente", "celular", "servicio" };
                    if (requeridos.All(encabezados.ContainsKey))
                    {
                        columnas = encabezados;
                        continue;
                    }

                    continue;
                }

                string Valor(string encabezado)
                {
                    var indice = columnas[encabezado];
                    var letra = IndiceAColumna(indice);
                    return valores.TryGetValue(letra, out var valor) ? valor.Trim() : "";
                }

                var cliente = Valor("cliente");
                if (string.IsNullOrWhiteSpace(cliente))
                    continue;

                if (NormalizarTexto(cliente).StartsWith("ejemplo"))
                    continue;

                var fechaTexto = Valor("fecha");
                var inicioTexto = Valor("hora inicio");
                var finTexto = Valor("hora fin");

                var fila = new FilaImportacion
                {
                    FilaExcel = numeroFila,
                    Cliente = cliente,
                    Telefono = LimpiarTelefono(Valor("celular")),
                    Servicio = Valor("servicio")
                };

                if (!TryParseFecha(fechaTexto, out var fecha))
                    fila.Errores.Add("Fecha inválida.");

                if (!TryParseHora(inicioTexto, out var horaInicio))
                    fila.Errores.Add("Hora inicio inválida.");

                if (!TryParseHora(finTexto, out var horaFin))
                    fila.Errores.Add("Hora fin inválida.");

                if (fila.Errores.Count == 0)
                {
                    fila.FechaInicioLocal = fecha.Date.Add(horaInicio);
                    fila.FechaFinLocal = fecha.Date.Add(horaFin);
                    fila.DuracionMinutos = (int)(fila.FechaFinLocal - fila.FechaInicioLocal).TotalMinutes;
                }

                resultado.Add(fila);
            }

            if (columnas == null)
                throw new InvalidOperationException("No se encontraron las columnas Fecha, Hora inicio, Hora fin, Cliente, Celular y Servicio.");

            return resultado;
        }

        private static List<string> LeerSharedStrings(ZipArchive zip)
        {
            var entry = zip.GetEntry("xl/sharedStrings.xml");
            if (entry == null) return new List<string>();

            using var stream = entry.Open();
            var doc = XDocument.Load(stream);
            return doc.Descendants()
                .Where(x => x.Name.LocalName == "si")
                .Select(x => string.Concat(x.Descendants().Where(y => y.Name.LocalName == "t").Select(y => y.Value)))
                .ToList();
        }

        private static string LeerValorCelda(XElement cell, List<string> sharedStrings)
        {
            var tipo = (string?)cell.Attribute("t");
            if (tipo == "inlineStr")
                return string.Concat(cell.Descendants().Where(x => x.Name.LocalName == "t").Select(x => x.Value));

            var value = cell.Elements().FirstOrDefault(x => x.Name.LocalName == "v")?.Value ?? "";
            if (tipo == "s" && int.TryParse(value, out var index) && index >= 0 && index < sharedStrings.Count)
                return sharedStrings[index];

            return value;
        }

        private static bool TryParseFecha(string valor, out DateTime fecha)
        {
            fecha = default;
            if (double.TryParse(valor, NumberStyles.Any, CultureInfo.InvariantCulture, out var oa) && oa > 20000)
            {
                fecha = DateTime.FromOADate(oa);
                return true;
            }

            var formatos = new[] { "dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd", "M/d/yyyy", "MM/dd/yyyy" };
            return DateTime.TryParseExact(valor, formatos, CultureInfo.InvariantCulture, DateTimeStyles.None, out fecha)
                || DateTime.TryParse(valor, CultureInfo.GetCultureInfo("es-CR"), DateTimeStyles.None, out fecha);
        }

        private static bool TryParseHora(string valor, out TimeSpan hora)
        {
            hora = default;
            if (double.TryParse(valor, NumberStyles.Any, CultureInfo.InvariantCulture, out var numero) && numero >= 0 && numero < 1)
            {
                hora = TimeSpan.FromDays(numero);
                return true;
            }

            var formatos = new[] { "h:mm tt", "hh:mm tt", "H:mm", "HH:mm", "h:mm:ss tt", "HH:mm:ss" };
            if (DateTime.TryParseExact(valor.Trim(), formatos, CultureInfo.InvariantCulture, DateTimeStyles.AllowWhiteSpaces, out var dt))
            {
                hora = dt.TimeOfDay;
                return true;
            }

            return false;
        }

        private static string LimpiarTelefono(string valor)
        {
            if (string.IsNullOrWhiteSpace(valor)) return "";
            var limpio = new string(valor.Where(c => char.IsDigit(c) || c == '+').ToArray());
            return limpio.StartsWith("+") ? "+" + new string(limpio.Skip(1).Where(char.IsDigit).ToArray()) : limpio;
        }

        private static string NormalizarTexto(string valor)
        {
            var texto = (valor ?? "").Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder();
            foreach (var c in texto)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                    sb.Append(c);
            }
            return Regex.Replace(sb.ToString().Normalize(NormalizationForm.FormC), @"\s+", " ");
        }

        private static int ColumnaAIndice(string columna)
        {
            var total = 0;
            foreach (var c in columna.ToUpperInvariant())
                total = total * 26 + (c - 'A' + 1);
            return total;
        }

        private static string IndiceAColumna(int indice)
        {
            var resultado = "";
            while (indice > 0)
            {
                indice--;
                resultado = (char)('A' + indice % 26) + resultado;
                indice /= 26;
            }
            return resultado;
        }

        public class ImportarCitasRequest
        {
            public IFormFile? Archivo { get; set; }
            public int SucursalId { get; set; }
            public int ProfesionalId { get; set; }
        }

        private class FilaImportacion
        {
            public int FilaExcel { get; set; }
            public string Cliente { get; set; } = "";
            public string Telefono { get; set; } = "";
            public string Servicio { get; set; } = "";
            public DateTime FechaInicioLocal { get; set; }
            public DateTime FechaFinLocal { get; set; }
            public int DuracionMinutos { get; set; }
            public int? ServicioId { get; set; }
            public decimal Precio { get; set; }
            public List<string> Errores { get; } = new();
        }

        private class PreparacionResultado
        {
            public string? ErrorGeneral { get; set; }
            public List<FilaImportacion> Filas { get; set; } = new();
            public static PreparacionResultado Error(string mensaje) => new() { ErrorGeneral = mensaje };
        }
    }
}
