using System.Net.Http.Json;
using BarberiaSaaS.Api.Data;
using Microsoft.EntityFrameworkCore;
namespace BarberiaSaaS.Api.Services;
public interface IPushNotificationService { Task EnviarTenantAsync(int tenantId,string titulo,string cuerpo,object? data=null,CancellationToken ct=default); }
public sealed class ExpoPushNotificationService:IPushNotificationService {
 private readonly AppDbContext _db; private readonly HttpClient _http; private readonly ILogger<ExpoPushNotificationService> _logger;
 public ExpoPushNotificationService(AppDbContext db,HttpClient http,ILogger<ExpoPushNotificationService> logger){_db=db;_http=http;_logger=logger;}
 public async Task EnviarTenantAsync(int tenantId,string titulo,string cuerpo,object? data=null,CancellationToken ct=default){
  var tokens=await _db.PushTokens.AsNoTracking().Where(x=>x.TenantId==tenantId&&x.Activo).Select(x=>x.Token).Distinct().ToListAsync(ct); if(tokens.Count==0)return;
  var mensajes=tokens.Select(token=>new{to=token,sound="default",title=titulo,body=cuerpo,data}).ToArray();
  try{using var response=await _http.PostAsJsonAsync("https://exp.host/--/api/v2/push/send",mensajes,ct);if(!response.IsSuccessStatusCode)_logger.LogWarning("Expo Push respondió {StatusCode}.",response.StatusCode);}
  catch(Exception ex){_logger.LogError(ex,"No fue posible enviar Expo Push para tenant {TenantId}.",tenantId);}
 }}
