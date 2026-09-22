using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Middleware;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// CONTROLLERS
// ============================================================

builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddHttpClient<IPayPalService, PayPalService>();
builder.Services.AddHttpClient<IEmailService, ResendEmailService>();
builder.Services.AddHttpClient<IWhatsAppService, MetaWhatsAppService>();
builder.Services.AddHttpClient<IPushNotificationService, ExpoPushNotificationService>();
builder.Services.AddScoped<INotificacionCitaService, NotificacionCitaService>();
builder.Services.AddSingleton<IInternacionalizacionService, InternacionalizacionService>();
builder.Services.AddHostedService<NotificacionesWorker>();

// ============================================================
// POSTGRESQL
// ============================================================

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection no está configurado.");

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

// ============================================================
// MULTI-TENANT
// ============================================================

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantContext, TenantContext>();

// ============================================================
// ZONA HORARIA
// ============================================================

builder.Services.AddScoped<ITimeZoneService, TimeZoneService>();

// ============================================================
// RATE LIMITING
// ============================================================

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("RegistroPublico", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(15),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});

// ============================================================
// JWT
// ============================================================

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key no está configurado.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("Jwt:Issuer no está configurado.");
var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException("Jwt:Audience no está configurado.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// ============================================================
// SWAGGER + JWT
// ============================================================

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "BarberiaSaaS API",
        Version = "v1",
        Description = "API multi-tenant para gestión de salones, barberías y centros de belleza."
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Ingrese únicamente el token JWT."
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        { new OpenApiSecuritySchemeReference("Bearer", document), new List<string>() }
    });
});

// ============================================================
// CORS
// ============================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins("https://barberiasaas.com", "https://barberiasaas.vercel.app")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// ============================================================
// SWAGGER
// ============================================================

app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "BarberiaSaaS API v1");
    options.DocumentTitle = "BarberiaSaaS API";
});

// ============================================================
// MIDDLEWARE
// ============================================================

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseMiddleware<SaasAccessMiddleware>();
app.UseAuthorization();
app.MapControllers();
app.Run();