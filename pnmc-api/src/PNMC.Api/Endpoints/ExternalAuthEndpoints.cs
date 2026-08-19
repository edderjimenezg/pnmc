using System.Globalization;
using System.Security.Cryptography;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PNMC.Api.Security;
using PNMC.Contracts;
using PNMC.Infrastructure.Common;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class ExternalAuthEndpoints
{
    private static readonly PasswordHasher<UserRow> PasswordHasher = new();

    public static RouteGroupBuilder MapExternalAuthEndpoints(this RouteGroupBuilder group)
    {
        var external = group.MapGroup("/external/auth").WithTags("external-auth");

        external.MapPost("/register", async (
            ExternalRegisterRequest request,
            PnmcDbContext dbContext,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            var errors = await ValidateRegisterRequestAsync(request, dbContext, cancellationToken);
            if (errors.Count > 0)
            {
                return Results.ValidationProblem(errors);
            }

            var email = NormalizeEmail(request.Email);
            var existing = await dbContext.Users.FirstOrDefaultAsync(user => user.Email == email, cancellationToken);
            if (existing is not null)
            {
                return Results.Conflict(new { message = "Ya existe una cuenta registrada con ese correo." });
            }

            var role = await dbContext.Roles.FirstOrDefaultAsync(item => item.Name == "externo", cancellationToken)
                ?? throw new InvalidOperationException("No existe el rol externo.");
            var now = DateTime.UtcNow;
            var displayName = ValidationHelpers.SanitizeText(request.FullName, 240);
            var user = new UserRow
            {
                FullName = displayName,
                Email = email,
                RoleId = role.Id,
                AccessChannel = "externo",
                ProfileType = Clean(request.ProfileType),
                IsActive = false,
                CreatedAt = now,
                UpdatedAt = now
            };
            user.PasswordHash = PasswordHasher.HashPassword(user, request.Password);
            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync(cancellationToken);

            var code = GenerateCode();
            var expiresAt = now.AddMinutes(20);
            dbContext.UserVerificationCodes.Add(new UserVerificationCodeRow
            {
                UserId = user.Id,
                Purpose = "external_email_verification",
                Code = code,
                ExpiresAt = expiresAt,
                CreatedAt = now
            });
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Created($"/api/v1/external/auth/users/{user.Id}", new ExternalRegisterResponse(
                user.Id.ToString(CultureInfo.InvariantCulture),
                user.Email,
                "correo_pendiente",
                "codigo_generado",
                expiresAt,
                environment.IsDevelopment() || environment.IsEnvironment("Local") || environment.IsEnvironment("Test") ? code : string.Empty));
        }).RequireRateLimiting("external-register");

        external.MapPost("/verify-email", async (
            ExternalVerifyEmailRequest request,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var email = NormalizeEmail(request.Email);
            if (!ValidationHelpers.IsValidEmail(email) || ValidationHelpers.IsMissing(request.Code))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["verification"] = ["Correo y codigo de verificacion son obligatorios."]
                });
            }

            var user = await dbContext.Users.FirstOrDefaultAsync(item => item.Email == email, cancellationToken);
            if (user is null)
            {
                return Results.NotFound();
            }

            var now = DateTime.UtcNow;
            var code = await dbContext.UserVerificationCodes
                .Where(item =>
                    item.UserId == user.Id
                    && item.Purpose == "external_email_verification"
                    && item.ConsumedAt == null
                    && item.ExpiresAt >= now)
                .OrderByDescending(item => item.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (code is null || !string.Equals(code.Code, request.Code.Trim(), StringComparison.Ordinal))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["code"] = ["El codigo de verificacion no es valido o ya expiro."]
                });
            }

            code.ConsumedAt = now;
            user.IsActive = true;
            user.UpdatedAt = now;
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new ExternalVerifyEmailResponse(
                user.Id.ToString(CultureInfo.InvariantCulture),
                user.Email,
                "activo"));
        }).RequireRateLimiting("external-register");

        external.MapPost("/login", async (
            ExternalLoginRequest request,
            PnmcDbContext dbContext,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var email = NormalizeEmail(request.Email);
            if (ValidationHelpers.IsMissing(email) || ValidationHelpers.IsMissing(request.Password))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["credentials"] = ["Correo y contrasena son obligatorios."]
                });
            }

            var user = await dbContext.Users.FirstOrDefaultAsync(item => item.Email == email, cancellationToken);
            var role = user is null
                ? null
                : await dbContext.Roles.AsNoTracking().FirstOrDefaultAsync(item => item.Id == user.RoleId, cancellationToken);
            if (user is null
                || !user.IsActive
                || !string.Equals(Clean(role?.Name ?? string.Empty), "externo", StringComparison.Ordinal)
                || !IsPasswordValid(user, request.Password))
            {
                return Results.Unauthorized();
            }

            var now = DateTime.UtcNow;
            user.LastLoginAt = now;
            user.UpdatedAt = now;
            await WriteAuditAsync(dbContext, user.Id, "Usuarios", user.Id.ToString(), "iniciar_sesion_externa", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            await httpContext.SignInAsync(
                SimusAuthentication.ExternalScheme,
                BuildExternalPrincipal(user),
                new AuthenticationProperties
                {
                    IsPersistent = true,
                    IssuedUtc = DateTimeOffset.UtcNow,
                    ExpiresUtc = DateTimeOffset.UtcNow.AddHours(8),
                    AllowRefresh = true
                });

            return Results.Ok(ToSessionResponse(user));
        }).RequireRateLimiting("external-login");

        external.MapGet("/me", async (
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var user = await ResolveExternalUserAsync(principal, dbContext, cancellationToken);
            return user is null ? Results.Unauthorized() : Results.Ok(ToSessionResponse(user));
        }).RequireAuthorization(SimusAuthentication.ExternalPolicy);

        external.MapPost("/logout", async (
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var user = await ResolveExternalUserAsync(principal, dbContext, cancellationToken);
            if (user is not null)
            {
                await WriteAuditAsync(dbContext, user.Id, "Usuarios", user.Id.ToString(), "cerrar_sesion_externa", cancellationToken);
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            await httpContext.SignOutAsync(SimusAuthentication.ExternalScheme);
            return Results.NoContent();
        }).RequireAuthorization(SimusAuthentication.ExternalPolicy);

        return group;
    }

    private static async Task<Dictionary<string, string[]>> ValidateRegisterRequestAsync(
        ExternalRegisterRequest request,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);
        var profileType = Clean(request.ProfileType);
        if (profileType != "persona")
        {
            errors["profileType"] = ["La cuenta externa corresponde a una persona. Las organizaciones se registran y administran en un flujo separado."];
        }

        if (ValidationHelpers.IsMissing(request.FullName))
        {
            errors["fullName"] = ["Nombre completo es obligatorio para persona."];
        }

        if (!ValidationHelpers.IsValidEmail(request.Email)) errors["email"] = ["Correo electronico no es valido."];
        if (ValidationHelpers.IsMissing(request.Password) || request.Password.Length < 10) errors["password"] = ["La contrasena debe tener minimo 10 caracteres."];
        if (!request.AcceptTerms) errors["acceptTerms"] = ["Debes aceptar los terminos de uso."];
        if (!request.AcceptDataPolicy) errors["acceptDataPolicy"] = ["Debes aceptar la politica de tratamiento de datos."];

        return errors;
    }

    private static string GenerateCode()
    {
        return RandomNumberGenerator.GetInt32(100000, 999999).ToString(CultureInfo.InvariantCulture);
    }

    private static string NormalizeEmail(string value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static string Clean(string value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static bool IsPasswordValid(UserRow user, string password)
    {
        try
        {
            return PasswordHasher.VerifyHashedPassword(user, user.PasswordHash, password) != PasswordVerificationResult.Failed;
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static ClaimsPrincipal BuildExternalPrincipal(UserRow user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString(CultureInfo.InvariantCulture)),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, "externo"),
            new(SimusAuthentication.AccessScopeClaim, SimusAuthentication.ExternalScope)
        };

        return new ClaimsPrincipal(new ClaimsIdentity(claims, SimusAuthentication.ExternalScheme));
    }

    private static async Task<UserRow?> ResolveExternalUserAsync(
        ClaimsPrincipal principal,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var value = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var userId))
        {
            return null;
        }

        return await dbContext.Users
            .Join(
                dbContext.Roles,
                user => user.RoleId,
                role => role.Id,
                (user, role) => new { User = user, Role = role })
            .Where(item => item.User.Id == userId && item.User.IsActive && item.Role.Name.ToLower() == "externo")
            .Select(item => item.User)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private static ExternalSessionResponse ToSessionResponse(UserRow user)
    {
        return new ExternalSessionResponse(
            user.Id.ToString(CultureInfo.InvariantCulture),
            user.FullName,
            user.Email,
            user.IsActive ? "activo" : "inactivo");
    }

    private static Task WriteAuditAsync(
        PnmcDbContext dbContext,
        int userId,
        string tableName,
        string recordId,
        string action,
        CancellationToken cancellationToken)
    {
        dbContext.AuditLogs.Add(new AuditLogRow
        {
            UserId = userId,
            TableName = tableName,
            RecordId = recordId,
            Action = action,
            CreatedAt = DateTime.UtcNow
        });
        return Task.CompletedTask;
    }
}
