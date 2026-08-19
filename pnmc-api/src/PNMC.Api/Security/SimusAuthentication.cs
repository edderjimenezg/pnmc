using Microsoft.AspNetCore.Authentication.Cookies;

namespace PNMC.Api.Security;

public static class SimusAuthentication
{
    public const string InstitutionalScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    public const string ExternalScheme = "SimusExternal";
    public const string InstitutionalPolicy = "institutional-principal";
    public const string ExternalPolicy = "external-principal";
    public const string AccessScopeClaim = "pnmc_access_scope";
    public const string InstitutionalScope = "institutional";
    public const string ExternalScope = "external";
}
