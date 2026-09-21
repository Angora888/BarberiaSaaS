using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarberiaSaaS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ImagenesController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ITenantContext _tenantContext;

    public ImagenesController(IConfiguration configuration, ITenantContext tenantContext)
    {
        _configuration = configuration;
        _tenantContext = tenantContext;
    }

    [HttpPost("subir")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> Subir(IFormFile archivo)
    {
        if (archivo == null || archivo.Length == 0)
            return BadRequest(new { mensaje = "Debe seleccionar una imagen." });
        var permitidos = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!permitidos.Contains(archivo.ContentType))
            return BadRequest(new { mensaje = "Solo se permiten imágenes JPG, PNG o WEBP." });
        if (archivo.Length > 5 * 1024 * 1024)
            return BadRequest(new { mensaje = "La imagen no puede superar los 5 MB." });

        var connectionString = _configuration["AzureStorage:ConnectionString"];
        if (string.IsNullOrWhiteSpace(connectionString))
            return StatusCode(500, new { mensaje = "Azure Storage no está configurado." });
        var containerName = _configuration["AzureStorage:Container"];
        if (string.IsNullOrWhiteSpace(containerName)) containerName = "barberia-saas";

        var container = new BlobContainerClient(connectionString, containerName);
        await container.CreateIfNotExistsAsync(PublicAccessType.Blob);

        var extension = Path.GetExtension(archivo.FileName).ToLowerInvariant();
        var nombre = $"tenant-{_tenantContext.TenantId}/{Guid.NewGuid():N}{extension}";
        var blob = container.GetBlobClient(nombre);
        await using var stream = archivo.OpenReadStream();
        await blob.UploadAsync(stream, new BlobHttpHeaders { ContentType = archivo.ContentType });
        return Ok(new { url = blob.Uri.ToString() });
    }
}
