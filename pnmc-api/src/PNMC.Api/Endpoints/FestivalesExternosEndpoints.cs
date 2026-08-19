using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.EntityFrameworkCore;
using PNMC.Api.Security;
using PNMC.Contracts;
using PNMC.Infrastructure.Common;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class FestivalesExternosEndpoints
{
    public static RouteGroupBuilder MapFestivalesExternosEndpoints(this RouteGroupBuilder group)
    {
        var externo = group.MapGroup("/externo").WithTags("festivales-externos");
        externo.RequireAuthorization(SimusAuthentication.ExternalPolicy);

        externo.MapGet("/organizaciones/mis", async (ClaimsPrincipal principal, PnmcDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var personaId = ObtenerPersonaId(principal);
            if (personaId is null) return Results.Unauthorized();

            var organizaciones = await dbContext.UserEntities.AsNoTracking()
                .Where(item => item.UserId == personaId && item.EntityRole == "administrador" && item.IsActive)
                .Join(dbContext.EntityProfiles.AsNoTracking().Where(item => item.IsActive),
                    relacion => relacion.EntityId,
                    organizacion => organizacion.Id,
                    (_, organizacion) => new OrganizacionAdministradaDto(
                        organizacion.Id.ToString(CultureInfo.InvariantCulture), organizacion.Name))
                .OrderBy(item => item.Nombre)
                .ToListAsync(cancellationToken);
            return Results.Ok(organizaciones);
        });

        externo.MapGet("/catalogos/festival", async (PnmcDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var practicas = await dbContext.PracticasMusicales.AsNoTracking()
                .OrderBy(item => item.Nombre)
                .Select(item => new CatalogoFestivalDto(item.Id, item.Nombre))
                .ToListAsync(cancellationToken);
            var territorios = await dbContext.TerritoriosSonoros.AsNoTracking()
                .OrderBy(item => item.Nombre)
                .Select(item => new CatalogoFestivalDto(item.Id, item.Nombre))
                .ToListAsync(cancellationToken);
            return Results.Ok(new { practicasMusicales = practicas, territoriosSonoros = territorios });
        });

        externo.MapPost("/organizaciones/{organizacionId:int}/festivales", async (
            int organizacionId,
            CrearFestivalBorradorSolicitud solicitud,
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            IAntiforgery antiforgery,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            if (!await ValidarAntiforgeryAsync(antiforgery, httpContext))
            {
                return Results.BadRequest(new { message = "La solicitud de Festival no pudo validarse. Actualiza la página e inténtalo nuevamente." });
            }

            var personaId = ObtenerPersonaId(principal);
            if (personaId is null) return Results.Unauthorized();
            if (!await PuedeAdministrarOrganizacionAsync(dbContext, personaId.Value, organizacionId, cancellationToken)) return Results.Forbid();

            var errores = await ValidarSolicitudAsync(solicitud, dbContext, cancellationToken);
            if (errores.Count > 0) return Results.ValidationProblem(errores);

            var ahora = DateTime.UtcNow;
            var festival = new FestivalRow
            {
                Name = ValidationHelpers.SanitizeText(solicitud.Nombre, 240),
                Description = LimpiarTexto(solicitud.Descripcion),
                Periodicidad = LimpiarTexto(solicitud.Periodicidad),
                ContactEmail = NormalizarCorreo(solicitud.CorreoContacto),
                CoverageLevel = NormalizarNivel(solicitud.NivelCobertura),
                DepartmentCode = LimpiarTexto(solicitud.CodigoDepartamento) ?? string.Empty,
                MunicipalityCode = LimpiarTexto(solicitud.CodigoMunicipio),
                OrganizacionPrincipalId = organizacionId,
                StatusCode = "Borrador",
                CreatedAt = ahora,
                UpdatedAt = ahora
            };
            dbContext.FestivalRecords.Add(festival);
            await dbContext.SaveChangesAsync(cancellationToken);

            dbContext.FestivalesPracticasMusicales.AddRange(solicitud.PracticasMusicalesIds.Distinct().Select(id => new FestivalPracticaMusicalRow
            {
                FestivalId = festival.Id,
                PracticaMusicalId = id,
                FechaCreacion = ahora
            }));
            dbContext.FestivalesTerritoriosSonoros.AddRange(solicitud.TerritoriosSonorosIds.Distinct().Select(id => new FestivalTerritorioSonoroRow
            {
                FestivalId = festival.Id,
                TerritorioSonoroId = id,
                FechaCreacion = ahora
            }));
            RegistrarAuditoria(dbContext, personaId.Value, festival.Id, organizacionId, "FestivalCreado");
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Created($"/api/v1/externo/festivales/{festival.Id}", await ADtoAsync(festival, dbContext, cancellationToken));
        });

        externo.MapGet("/organizaciones/{organizacionId:int}/festivales", async (
            int organizacionId,
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var personaId = ObtenerPersonaId(principal);
            if (personaId is null) return Results.Unauthorized();
            if (!await PuedeAdministrarOrganizacionAsync(dbContext, personaId.Value, organizacionId, cancellationToken)) return Results.Forbid();

            var festivales = await dbContext.FestivalRecords.AsNoTracking()
                .Where(item => item.OrganizacionPrincipalId == organizacionId && item.StatusCode == "Borrador")
                .OrderByDescending(item => item.UpdatedAt ?? item.CreatedAt)
                .ToListAsync(cancellationToken);
            var resultado = new List<FestivalBorradorDto>();
            foreach (var festival in festivales) resultado.Add(await ADtoAsync(festival, dbContext, cancellationToken));
            return Results.Ok(resultado);
        });

        externo.MapGet("/festivales/{festivalId:int}", async (
            int festivalId,
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var personaId = ObtenerPersonaId(principal);
            if (personaId is null) return Results.Unauthorized();
            var festival = await dbContext.FestivalRecords.AsNoTracking()
                .FirstOrDefaultAsync(item => item.Id == festivalId && item.StatusCode == "Borrador", cancellationToken);
            if (festival is null) return Results.NotFound();
            if (festival.OrganizacionPrincipalId is null
                || !await PuedeAdministrarOrganizacionAsync(dbContext, personaId.Value, festival.OrganizacionPrincipalId.Value, cancellationToken)) return Results.Forbid();

            return Results.Ok(await ADtoAsync(festival, dbContext, cancellationToken));
        });

        externo.MapPost("/festivales/{festivalId:int}/enviar-a-revision", async (
            int festivalId,
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            IAntiforgery antiforgery,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            if (!await ValidarAntiforgeryAsync(antiforgery, httpContext))
            {
                return Results.BadRequest(new { message = "El envío a revisión no pudo validarse. Actualiza la página e inténtalo nuevamente." });
            }

            var personaId = ObtenerPersonaId(principal);
            if (personaId is null) return Results.Unauthorized();
            var festival = await dbContext.FestivalRecords.FirstOrDefaultAsync(item => item.Id == festivalId, cancellationToken);
            if (festival is null) return Results.NotFound();
            if (festival.OrganizacionPrincipalId is null
                || !await PuedeAdministrarOrganizacionAsync(dbContext, personaId.Value, festival.OrganizacionPrincipalId.Value, cancellationToken)) return Results.Forbid();
            if (festival.StatusCode != "Borrador")
            {
                return Results.Conflict(new { message = "Solo un Festival en Borrador puede enviarse a revisión.", estado = festival.StatusCode });
            }

            var errores = await ValidarFestivalParaRevisionAsync(festival, dbContext, cancellationToken);
            if (errores.Count > 0) return Results.ValidationProblem(errores);

            var ahora = DateTime.UtcNow;
            festival.StatusCode = "EnRevision";
            festival.UpdatedAt = ahora;
            RegistrarAuditoria(dbContext, personaId.Value, festival.Id, festival.OrganizacionPrincipalId.Value,
                "FestivalEnviadoARevision", "Borrador", "EnRevision", ahora);
            await CrearNotificacionEnvioRevisionAsync(dbContext, personaId.Value, festival, ahora, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(await ADtoAsync(festival, dbContext, cancellationToken));
        });

        return group;
    }

    private static async Task<Dictionary<string, string[]>> ValidarSolicitudAsync(
        CrearFestivalBorradorSolicitud solicitud,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var errores = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);
        if (ValidationHelpers.IsMissing(solicitud.Nombre)) errores["nombre"] = ["El nombre del Festival es obligatorio."];
        if (!string.IsNullOrWhiteSpace(solicitud.CorreoContacto) && !ValidationHelpers.IsValidEmail(solicitud.CorreoContacto))
            errores["correoContacto"] = ["El correo de contacto no es válido."];

        var nivel = NormalizarNivel(solicitud.NivelCobertura);
        if (nivel is not ("municipal" or "departamental" or "nacional"))
        {
            errores["nivelCobertura"] = ["El nivel territorial no es válido."];
            return errores;
        }

        if (nivel != "nacional")
        {
            var departamento = LimpiarTexto(solicitud.CodigoDepartamento);
            var departamentoValido = departamento is not null && await dbContext.DivipolaLocations.AsNoTracking()
                .AnyAsync(item => item.DepartmentCode == departamento, cancellationToken);
            if (!departamentoValido)
            {
                errores["codigoDepartamento"] = ["El departamento indicado no existe en DIVIPOLA."];
                return errores;
            }

            if (nivel == "municipal")
            {
                var municipio = LimpiarTexto(solicitud.CodigoMunicipio);
                var municipioValido = municipio is not null && await dbContext.DivipolaLocations.AsNoTracking()
                    .AnyAsync(item => item.DepartmentCode == departamento && item.MunicipalityCode == municipio, cancellationToken);
                if (!municipioValido) errores["codigoMunicipio"] = ["El municipio indicado no existe en DIVIPOLA."];
            }
        }

        var practicasIds = solicitud.PracticasMusicalesIds.Distinct().ToArray();
        if (practicasIds.Length > 0)
        {
            var existentes = await dbContext.PracticasMusicales.AsNoTracking().CountAsync(item => practicasIds.Contains(item.Id), cancellationToken);
            if (existentes != practicasIds.Length) errores["practicasMusicalesIds"] = ["Una o más prácticas musicales no existen en el catálogo."];
        }

        var territoriosIds = solicitud.TerritoriosSonorosIds.Distinct().ToArray();
        if (territoriosIds.Length > 0)
        {
            var existentes = await dbContext.TerritoriosSonoros.AsNoTracking().CountAsync(item => territoriosIds.Contains(item.Id), cancellationToken);
            if (existentes != territoriosIds.Length) errores["territoriosSonorosIds"] = ["Uno o más territorios sonoros no existen en el catálogo."];
        }

        return errores;
    }

    private static async Task<FestivalBorradorDto> ADtoAsync(FestivalRow festival, PnmcDbContext dbContext, CancellationToken cancellationToken)
    {
        var organizacionNombre = await dbContext.EntityProfiles.AsNoTracking()
            .Where(item => item.Id == festival.OrganizacionPrincipalId)
            .Select(item => item.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;
        var practicas = await dbContext.FestivalesPracticasMusicales.AsNoTracking()
            .Where(item => item.FestivalId == festival.Id)
            .Join(dbContext.PracticasMusicales.AsNoTracking(), relacion => relacion.PracticaMusicalId, practica => practica.Id,
                (_, practica) => new { practica.Id, practica.Nombre })
            .OrderBy(item => item.Nombre)
            .Select(item => new CatalogoFestivalDto(item.Id, item.Nombre))
            .ToListAsync(cancellationToken);
        var territorios = await dbContext.FestivalesTerritoriosSonoros.AsNoTracking()
            .Where(item => item.FestivalId == festival.Id)
            .Join(dbContext.TerritoriosSonoros.AsNoTracking(), relacion => relacion.TerritorioSonoroId, territorio => territorio.Id,
                (_, territorio) => new { territorio.Id, territorio.Nombre })
            .OrderBy(item => item.Nombre)
            .Select(item => new CatalogoFestivalDto(item.Id, item.Nombre))
            .ToListAsync(cancellationToken);

        return new FestivalBorradorDto(
            festival.Id.ToString(CultureInfo.InvariantCulture), festival.Name, festival.StatusCode,
            festival.OrganizacionPrincipalId?.ToString(CultureInfo.InvariantCulture) ?? string.Empty, organizacionNombre,
            festival.CoverageLevel, string.IsNullOrWhiteSpace(festival.DepartmentCode) ? null : festival.DepartmentCode,
            festival.MunicipalityCode, festival.Periodicidad, festival.ContactEmail, practicas, territorios);
    }

    private static async Task<bool> PuedeAdministrarOrganizacionAsync(PnmcDbContext dbContext, int personaId, int organizacionId, CancellationToken cancellationToken) =>
        await dbContext.UserEntities.AsNoTracking()
            .Where(item => item.UserId == personaId && item.EntityId == organizacionId && item.EntityRole == "administrador" && item.IsActive)
            .Join(dbContext.EntityProfiles.AsNoTracking().Where(item => item.IsActive),
                relacion => relacion.EntityId,
                organizacion => organizacion.Id,
                (_, _) => true)
            .AnyAsync(cancellationToken);

    private static int? ObtenerPersonaId(ClaimsPrincipal principal) =>
        int.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), NumberStyles.Integer, CultureInfo.InvariantCulture, out var personaId)
            ? personaId : null;

    private static async Task<bool> ValidarAntiforgeryAsync(IAntiforgery antiforgery, HttpContext httpContext)
    {
        try { await antiforgery.ValidateRequestAsync(httpContext); return true; }
        catch (AntiforgeryValidationException) { return false; }
    }

    private static async Task<Dictionary<string, string[]>> ValidarFestivalParaRevisionAsync(
        FestivalRow festival,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var errores = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);
        if (ValidationHelpers.IsMissing(festival.Name)) errores["nombre"] = ["El nombre del Festival es obligatorio."];
        if (festival.OrganizacionPrincipalId is null
            || !await dbContext.EntityProfiles.AsNoTracking().AnyAsync(item => item.Id == festival.OrganizacionPrincipalId && item.IsActive, cancellationToken))
            errores["organizacionPrincipal"] = ["La organización principal del Festival debe estar activa."];

        var nivel = NormalizarNivel(festival.CoverageLevel);
        if (nivel is not ("municipal" or "departamental" or "nacional"))
        {
            errores["nivelCobertura"] = ["El nivel territorial no es válido."];
            return errores;
        }

        if (nivel != "nacional")
        {
            var departamentoValido = !string.IsNullOrWhiteSpace(festival.DepartmentCode) && await dbContext.DivipolaLocations.AsNoTracking()
                .AnyAsync(item => item.DepartmentCode == festival.DepartmentCode, cancellationToken);
            if (!departamentoValido)
            {
                errores["codigoDepartamento"] = ["El departamento principal debe existir en DIVIPOLA."];
                return errores;
            }

            if (nivel == "municipal")
            {
                var municipioValido = !string.IsNullOrWhiteSpace(festival.MunicipalityCode) && await dbContext.DivipolaLocations.AsNoTracking()
                    .AnyAsync(item => item.DepartmentCode == festival.DepartmentCode && item.MunicipalityCode == festival.MunicipalityCode, cancellationToken);
                if (!municipioValido) errores["codigoMunicipio"] = ["El municipio principal debe existir en DIVIPOLA."];
            }
        }

        return errores;
    }

    private static async Task CrearNotificacionEnvioRevisionAsync(
        PnmcDbContext dbContext,
        int personaId,
        FestivalRow festival,
        DateTime ahora,
        CancellationToken cancellationToken)
    {
        var persona = await dbContext.Users.AsNoTracking().FirstOrDefaultAsync(item => item.Id == personaId && item.IsActive, cancellationToken);
        if (persona is null) return;

        dbContext.Notifications.Add(new NotificationRow
        {
            RecipientUserId = personaId,
            RecipientEmail = persona.Email,
            EventType = "FestivalEnviadoARevision",
            Channel = "internal",
            Title = "Festival enviado a revisión",
            Body = $"Tu Festival “{festival.Name}” fue enviado a revisión.",
            Status = "enviada",
            ModuleId = "festivales",
            RecordId = festival.Id.ToString(CultureInfo.InvariantCulture),
            MetadataJson = $"{{\"OrganizacionPrincipalId\":{festival.OrganizacionPrincipalId},\"Estado\":\"EnRevision\"}}",
            CreatedAt = ahora,
            SentAt = ahora,
            Attempts = 0
        });
    }

    private static void RegistrarAuditoria(
        PnmcDbContext dbContext,
        int personaId,
        int festivalId,
        int organizacionId,
        string accion,
        string? estadoAnterior = null,
        string? estadoNuevo = null,
        DateTime? fecha = null)
    {
        dbContext.AuditLogs.Add(new AuditLogRow
        {
            UserId = personaId,
            TableName = "Festivales",
            RecordId = festivalId.ToString(CultureInfo.InvariantCulture),
            Action = accion,
            PreviousValuesJson = estadoAnterior is null ? null : $"{{\"Estado\":\"{estadoAnterior}\"}}",
            NewValuesJson = $"{{\"OrganizacionPrincipalId\":{organizacionId},\"Estado\":\"{estadoNuevo ?? "Borrador"}\"}}",
            CreatedAt = fecha ?? DateTime.UtcNow
        });
    }

    private static string NormalizarNivel(string? valor) => (valor ?? string.Empty).Trim().ToLowerInvariant();
    private static string? LimpiarTexto(string? valor) => string.IsNullOrWhiteSpace(valor) ? null : ValidationHelpers.SanitizeText(valor, 500);
    private static string? NormalizarCorreo(string? valor) => string.IsNullOrWhiteSpace(valor) ? null : valor.Trim().ToLowerInvariant();
}
