using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using PNMC.Api.Endpoints;
using PNMC.Infrastructure;
using PNMC.Infrastructure.Common;
using PNMC.Infrastructure.Data;
using PNMC.Api.Security;

PNMC.Api.DotEnvLoader.Load();
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
var requiereCookiesSeguras = !(builder.Environment.IsDevelopment()
    || builder.Environment.IsEnvironment("Local")
    || builder.Environment.IsEnvironment("Test"));
var politicaCookieSegura = requiereCookiesSeguras ? CookieSecurePolicy.Always : CookieSecurePolicy.SameAsRequest;
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = "pnmc.external.csrf";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = politicaCookieSegura;
});
builder.Services.AddAuthentication(SimusAuthentication.InstitutionalScheme)
    .AddCookie(SimusAuthentication.InstitutionalScheme, options =>
    {
        options.Cookie.Name = "pnmc.admin";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = politicaCookieSegura;
        options.SlidingExpiration = true;
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    })
    .AddCookie(SimusAuthentication.ExternalScheme, options =>
    {
        options.Cookie.Name = "pnmc.external";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = politicaCookieSegura;
        options.SlidingExpiration = true;
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(SimusAuthentication.InstitutionalPolicy, policy =>
        policy.AddAuthenticationSchemes(SimusAuthentication.InstitutionalScheme)
            .RequireAuthenticatedUser()
            .RequireClaim(SimusAuthentication.AccessScopeClaim, SimusAuthentication.InstitutionalScope));
    options.AddPolicy(SimusAuthentication.ExternalPolicy, policy =>
        policy.AddAuthenticationSchemes(SimusAuthentication.ExternalScheme)
            .RequireAuthenticatedUser()
            .RequireClaim(SimusAuthentication.AccessScopeClaim, SimusAuthentication.ExternalScope));
});
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("participation-submit", limiter =>
    {
        limiter.PermitLimit = 30;
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiter.QueueLimit = 0;
        limiter.AutoReplenishment = true;
    });
    options.AddPolicy("external-register", context => CreateExternalAuthRateLimitPartition(context, builder.Environment));
    options.AddPolicy("external-login", context => CreateExternalAuthRateLimitPartition(context, builder.Environment));
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("PnmcWebFrontend", policy =>
    {
        var configuredOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        if (builder.Environment.IsDevelopment()
            || builder.Environment.IsEnvironment("Local")
            || builder.Environment.IsEnvironment("Test"))
        {
            var localOrigins = configuredOrigins
                .Concat(["http://localhost:4200", "http://127.0.0.1:4200"])
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
            policy
                .WithOrigins(localOrigins)
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
            return;
        }

        if (configuredOrigins.Length > 0)
        {
            policy.WithOrigins(configuredOrigins).AllowAnyMethod().AllowAnyHeader().AllowCredentials();
        }
    });
});

builder.Services.AddPnmcInfrastructure(builder.Configuration, builder.Environment);

var app = builder.Build();

app.UseMiddleware<RequestContextMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<GlobalExceptionMiddleware>();
await DatabaseBootstrapper.EnsureReadyAsync(app.Services);

if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Local"))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("PnmcWebFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health/live");
app.MapHealthChecks("/health/ready");

var api = app.MapGroup("/api/v1");
api.MapAgendaEndpoints();
api.MapNewsEndpoints();
api.MapMapEndpoints();
api.MapEditorialEndpoints();
api.MapGalleryEndpoints();
api.MapCatalogModuleEndpoints();
api.MapParticipationEndpoints();
api.MapExternalAuthEndpoints();
api.MapExternalOrganizationEndpoints();
api.MapFestivalesExternosEndpoints();
api.MapSolicitudesAdministracionFestivalEndpoints();
api.MapPropuestasCambioFestivalExternosEndpoints();
api.MapRevisionInstitucionalFestivalesEndpoints();
api.MapNormalizacionVersionesFestivalEndpoints();
api.MapRevisionInstitucionalPropuestasFestivalEndpoints();
api.MapFestivalesPublicosEndpoints();
api.MapAnaliticaFestivalesPublicosEndpoints();
api.MapNotificationEndpoints();
api.MapRecordGovernanceEndpoints();
api.MapAdminAuthEndpoints();
api.MapAdminAllyEndpoints();
api.MapAllyPortalEndpoints();
api.MapAdminEntityEndpoints();
api.MapAdminDataEndpoints();
app.MapLegacyParticipationCompatibilityEndpoint();

app.Run();

static RateLimitPartition<string> CreateExternalAuthRateLimitPartition(HttpContext context, IHostEnvironment environment)
{
    if (environment.IsEnvironment("Test"))
    {
        return RateLimitPartition.GetNoLimiter("test");
    }

    var partitionKey = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
    {
        PermitLimit = 10,
        Window = TimeSpan.FromMinutes(1),
        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
        QueueLimit = 0,
        AutoReplenishment = true
    });
}

public partial class Program;
