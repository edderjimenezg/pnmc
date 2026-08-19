using System.Globalization;
using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.EntityFrameworkCore;
using PNMC.Api.Security;
using PNMC.Contracts;
using PNMC.Infrastructure.Common;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class ExternalOrganizationEndpoints
{
    private static readonly Regex IdentificationPattern = new("^[A-Za-z0-9.-]{3,60}$", RegexOptions.Compiled);

    public static RouteGroupBuilder MapExternalOrganizationEndpoints(this RouteGroupBuilder group)
    {
        var organizations = group.MapGroup("/external/organizations").WithTags("external-organizations");
        organizations.RequireAuthorization(SimusAuthentication.ExternalPolicy);

        organizations.MapGet("/csrf", (IAntiforgery antiforgery, HttpContext httpContext) =>
        {
            var tokens = antiforgery.GetAndStoreTokens(httpContext);
            return Results.Ok(new ExternalCsrfTokenResponse(tokens.RequestToken ?? string.Empty));
        });

        organizations.MapGet("/divipola", async (PnmcDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var locations = await dbContext.DivipolaLocations.AsNoTracking()
                .OrderBy(item => item.DepartmentName).ThenBy(item => item.MunicipalityName)
                .Select(item => new DivipolaLocationDto(
                    item.DepartmentCode, item.DepartmentName, item.MunicipalityCode, item.MunicipalityName,
                    item.LocationType ?? string.Empty, item.Latitude, item.Longitude))
                .ToListAsync(cancellationToken);
            return Results.Ok(locations);
        });

        organizations.MapPost("/", async (
            ExternalOrganizationCreateRequest request,
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            IAntiforgery antiforgery,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            if (!await IsValidAntiforgeryRequestAsync(antiforgery, httpContext))
            {
                return Results.BadRequest(new { message = "La solicitud de registro no pudo validarse. Actualiza la página e inténtalo nuevamente." });
            }

            var user = await ResolveExternalUserAsync(principal, dbContext, cancellationToken);
            if (user is null)
            {
                return Results.Unauthorized();
            }

            var errors = await ValidateRequestAsync(request, dbContext, cancellationToken);
            if (errors.Count > 0)
            {
                return Results.ValidationProblem(errors);
            }

            var now = DateTime.UtcNow;
            var identificationNumber = NormalizeIdentification(request.IdentificationNumber);
            var entity = new EntityProfileRow
            {
                EntityType = "organizacion",
                Name = ValidationHelpers.SanitizeText(request.Name, 240),
                IdentificationNumber = identificationNumber,
                ContactEmail = NormalizeEmail(request.ContactEmail),
                CoverageLevel = NormalizeCoverage(request.CoverageLevel),
                DepartmentCode = NormalizeOptional(request.DepartmentCode),
                MunicipalityCode = NormalizeOptional(request.MunicipalityCode),
                StatusCode = "registrada",
                IsActive = true,
                CreatedByUserId = user.Id,
                ResponsibleUserId = user.Id,
                CreatedAt = now,
                UpdatedAt = now
            };
            dbContext.EntityProfiles.Add(entity);
            await dbContext.SaveChangesAsync(cancellationToken);

            dbContext.UserEntities.Add(new UserEntityRow
            {
                UserId = user.Id,
                EntityId = entity.Id,
                EntityRole = "administrador",
                IsActive = true,
                CreatedAt = now
            });
            WriteAuditAsync(dbContext, user.Id, entity.Id, "crear_organizacion", cancellationToken);
            WriteAuditAsync(dbContext, user.Id, entity.Id, "asignar_administrador_inicial", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Created($"/api/v1/external/organizations/{entity.Id}", ToDto(entity));
        });

        organizations.MapGet("/{id:int}", async (
            int id,
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var user = await ResolveExternalUserAsync(principal, dbContext, cancellationToken);
            if (user is null)
            {
                return Results.Unauthorized();
            }

            var entity = await dbContext.EntityProfiles.AsNoTracking().FirstOrDefaultAsync(item => item.Id == id && item.IsActive, cancellationToken);
            if (entity is null)
            {
                return Results.NotFound();
            }

            var canAdminister = await dbContext.UserEntities.AsNoTracking().AnyAsync(
                item => item.UserId == user.Id && item.EntityId == id && item.EntityRole == "administrador" && item.IsActive,
                cancellationToken);
            return canAdminister ? Results.Ok(ToDto(entity)) : Results.Forbid();
        });

        return group;
    }

    private static async Task<Dictionary<string, string[]>> ValidateRequestAsync(
        ExternalOrganizationCreateRequest request,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);
        if (ValidationHelpers.IsMissing(request.Name)) errors["name"] = ["El nombre de la organización es obligatorio."];
        if (!ValidationHelpers.IsValidEmail(request.ContactEmail)) errors["contactEmail"] = ["El correo institucional no es válido."];

        var identificationNumber = NormalizeIdentification(request.IdentificationNumber);
        if (!string.IsNullOrEmpty(identificationNumber) && !IdentificationPattern.IsMatch(identificationNumber))
        {
            errors["identificationNumber"] = ["La identificación debe contener entre 3 y 60 caracteres alfanuméricos, puntos o guiones."];
        }
        else if (!string.IsNullOrEmpty(identificationNumber)
                 && await dbContext.EntityProfiles.AsNoTracking().AnyAsync(item => item.IdentificationNumber == identificationNumber, cancellationToken))
        {
            errors["identificationNumber"] = ["Ya existe una organización registrada con esta identificación."];
        }

        var coverage = NormalizeCoverage(request.CoverageLevel);
        if (coverage is not ("municipal" or "departamental" or "nacional"))
        {
            errors["coverageLevel"] = ["El nivel territorial no es válido."];
            return errors;
        }

        if (coverage == "nacional") return errors;

        var departmentCode = NormalizeOptional(request.DepartmentCode);
        var municipalityCode = NormalizeOptional(request.MunicipalityCode);
        var departmentExists = !string.IsNullOrEmpty(departmentCode)
            && await dbContext.DivipolaLocations.AsNoTracking().AnyAsync(item => item.DepartmentCode == departmentCode, cancellationToken);
        if (!departmentExists)
        {
            errors["departmentCode"] = ["El departamento indicado no existe en DIVIPOLA."];
            return errors;
        }

        if (coverage == "municipal")
        {
            var municipalityExists = !string.IsNullOrEmpty(municipalityCode)
                && await dbContext.DivipolaLocations.AsNoTracking().AnyAsync(
                    item => item.DepartmentCode == departmentCode && item.MunicipalityCode == municipalityCode,
                    cancellationToken);
            if (!municipalityExists) errors["municipalityCode"] = ["El municipio indicado no existe en DIVIPOLA."];
        }

        return errors;
    }

    private static async Task<UserRow?> ResolveExternalUserAsync(ClaimsPrincipal principal, PnmcDbContext dbContext, CancellationToken cancellationToken)
    {
        var value = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var userId)) return null;

        return await dbContext.Users
            .Join(dbContext.Roles, user => user.RoleId, role => role.Id, (user, role) => new { User = user, Role = role })
            .Where(item => item.User.Id == userId && item.User.IsActive && item.Role.Name.ToLower() == "externo")
            .Select(item => item.User)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private static async Task<bool> IsValidAntiforgeryRequestAsync(IAntiforgery antiforgery, HttpContext httpContext)
    {
        try
        {
            await antiforgery.ValidateRequestAsync(httpContext);
            return true;
        }
        catch (AntiforgeryValidationException)
        {
            return false;
        }
    }

    private static ExternalOrganizationDto ToDto(EntityProfileRow entity) => new(
        entity.Id.ToString(CultureInfo.InvariantCulture), entity.Name, entity.IdentificationNumber, entity.ContactEmail ?? string.Empty,
        entity.CoverageLevel, entity.DepartmentCode, entity.MunicipalityCode, "administrador", entity.StatusCode);

    private static void WriteAuditAsync(PnmcDbContext dbContext, int userId, int entityId, string action, CancellationToken cancellationToken)
    {
        dbContext.AuditLogs.Add(new AuditLogRow
        {
            UserId = userId,
            TableName = "Entidades",
            RecordId = entityId.ToString(CultureInfo.InvariantCulture),
            Action = action,
            CreatedAt = DateTime.UtcNow
        });
    }

    private static string NormalizeCoverage(string? value) => (value ?? string.Empty).Trim().ToLowerInvariant();
    private static string? NormalizeOptional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static string NormalizeEmail(string? value) => (value ?? string.Empty).Trim().ToLowerInvariant();
    private static string? NormalizeIdentification(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToUpperInvariant();
}
