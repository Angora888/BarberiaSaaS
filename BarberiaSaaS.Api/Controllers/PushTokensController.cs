using System.Security.Claims;
using BarberiaSaaS.Api.Data; using BarberiaSaaS.Api.Models; using BarberiaSaaS.Api.Services; using Microsoft.AspNetCore.Authorization; using Microsoft.AspNetCore.Mvc; using Microsoft.EntityFrameworkCore;
namespace BarberiaSaaS.Api.Controllers;
[ApiController][Route("api/push-tokens")][Authorize] public class PushTokensController:ControllerBase{
 private readonly AppDbContext _db; private readonly ITenantContext _tenant; public PushTokensController(AppDbContext db,ITenantContext tenant){_db=db;_tenant=tenant;}
 [HttpPost] public async Task<IActionResult> Registrar(RegistrarPushTokenDto request,CancellationToken ct){
  if(string.IsNullOrWhiteSpace(request.Token)||!request.Token.StartsWith("ExponentPushToken["))return BadRequest(new{mensaje="Push token no válido."});
  var raw=User.FindFirstValue(ClaimTypes.NameIdentifier)??User.FindFirstValue("sub"); if(!int.TryParse(raw,out var usuarioId))return Unauthorized();
  var token=request.Token.Trim();var item=await _db.PushTokens.FirstOrDefaultAsync(x=>x.Token==token,ct);
  if(item==null){item=new PushToken{TenantId=_tenant.TenantId,UsuarioId=usuarioId,Token=token};_db.PushTokens.Add(item);}
  item.TenantId=_tenant.TenantId;item.UsuarioId=usuarioId;item.Plataforma=(request.Plataforma??string.Empty).Trim();item.Activo=true;item.FechaActualizacion=DateTime.UtcNow;await _db.SaveChangesAsync(ct);return Ok(new{mensaje="Dispositivo registrado para notificaciones."});}}
public class RegistrarPushTokenDto{public string Token{get;set;}=string.Empty;public string? Plataforma{get;set;}}
