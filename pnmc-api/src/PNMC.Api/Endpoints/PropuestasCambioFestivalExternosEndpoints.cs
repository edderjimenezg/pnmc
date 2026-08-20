using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.EntityFrameworkCore;
using PNMC.Api.Security;
using PNMC.Contracts;
using PNMC.Infrastructure.Common;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class PropuestasCambioFestivalExternosEndpoints
{
    public static RouteGroupBuilder MapPropuestasCambioFestivalExternosEndpoints(this RouteGroupBuilder group)
    {
        var externo = group.MapGroup("/externo/festivales").WithTags("propuestas-cambio-festival");
        externo.RequireAuthorization(SimusAuthentication.ExternalPolicy);

        externo.MapPost("/{festivalId:int}/propuestas-cambio", async (
            int festivalId,
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            IAntiforgery antiforgery,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            if (!await ValidarAntiforgeryAsync(antiforgery, httpContext))
                return Results.BadRequest(new { message = "La propuesta de cambio no pudo validarse. Actualiza la página e inténtalo nuevamente." });

            var personaId = ObtenerPersonaId(principal);
            if (personaId is null) return Results.Unauthorized();
            var festival = await dbContext.FestivalRecords.FirstOrDefaultAsync(item => item.Id == festivalId, cancellationToken);
            if (festival is null) return Results.NotFound();
            if (festival.OrganizacionPrincipalId is null
                || !await PuedeAdministrarOrganizacionAsync(dbContext, personaId.Value, festival.OrganizacionPrincipalId.Value, cancellationToken)) return Results.Forbid();
            if (festival.StatusCode != "Publicado")
                return Results.Conflict(new { message = "Solo un Festival publicado puede recibir una propuesta de cambio.", estado = festival.StatusCode });

            var existente = await dbContext.PropuestasCambioFestival
                .FirstOrDefaultAsync(item => item.FestivalOrigenId == festival.Id && item.Activa, cancellationToken);
            if (existente is not null) return Results.Ok(await ADtoAsync(existente, dbContext, cancellationToken));

            await using var transaccion = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            var version = await dbContext.VersionesFestival
                .FirstOrDefaultAsync(item => item.FestivalOrigenId == festival.Id && item.EsVigente, cancellationToken);
            if (version is null)
                return Results.Conflict(new
                {
                    codigo = "requiereNormalizacionInstitucional",
                    message = "Este Festival histórico requiere una normalización institucional explícita antes de recibir una propuesta de cambios."
                });
            var ahora = DateTime.UtcNow;
            var propuesta = new PropuestaCambioFestivalRow
            {
                FestivalOrigenId = festival.Id,
                VersionOrigenId = version.Id,
                OrganizacionId = festival.OrganizacionPrincipalId.Value,
                PersonaProponenteId = personaId.Value,
                Estado = "Borrador",
                Activa = true,
                Nombre = version.Nombre,
                Descripcion = version.Descripcion,
                NivelCobertura = version.NivelCobertura,
                CodigoDepartamento = version.CodigoDepartamento,
                CodigoMunicipio = version.CodigoMunicipio,
                Periodicidad = version.Periodicidad,
                CorreoContacto = version.CorreoContacto,
                FechaPropuesta = ahora,
                FechaActualizacion = ahora
            };
            dbContext.PropuestasCambioFestival.Add(propuesta);
            await dbContext.SaveChangesAsync(cancellationToken);

            var practicasOrigen = await dbContext.VersionesFestivalPracticasMusicales.AsNoTracking()
                .Where(item => item.VersionFestivalId == version.Id).Select(item => item.PracticaMusicalId).ToListAsync(cancellationToken);
            var territoriosOrigen = await dbContext.VersionesFestivalTerritoriosSonoros.AsNoTracking()
                .Where(item => item.VersionFestivalId == version.Id).Select(item => item.TerritorioSonoroId).ToListAsync(cancellationToken);
            dbContext.PropuestasCambioFestivalPracticasMusicales.AddRange(practicasOrigen.Select(id => new PropuestaCambioFestivalPracticaMusicalRow
            {
                PropuestaCambioFestivalId = propuesta.Id, PracticaMusicalId = id, FechaCreacion = ahora
            }));
            dbContext.PropuestasCambioFestivalTerritoriosSonoros.AddRange(territoriosOrigen.Select(id => new PropuestaCambioFestivalTerritorioSonoroRow
            {
                PropuestaCambioFestivalId = propuesta.Id, TerritorioSonoroId = id, FechaCreacion = ahora
            }));
            RegistrarAuditoria(dbContext, personaId.Value, propuesta, "FestivalCambioPropuesto", ahora);
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaccion.CommitAsync(cancellationToken);

            return Results.Created($"/api/v1/externo/festivales/{festival.Id}/propuesta-cambio", await ADtoAsync(propuesta, dbContext, cancellationToken));
        });

        externo.MapGet("/{festivalId:int}/propuesta-cambio", async (
            int festivalId,
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var personaId = ObtenerPersonaId(principal);
            if (personaId is null) return Results.Unauthorized();
            var festival = await dbContext.FestivalRecords.AsNoTracking().FirstOrDefaultAsync(item => item.Id == festivalId, cancellationToken);
            if (festival is null) return Results.NotFound();
            if (festival.OrganizacionPrincipalId is null
                || !await PuedeAdministrarOrganizacionAsync(dbContext, personaId.Value, festival.OrganizacionPrincipalId.Value, cancellationToken)) return Results.Forbid();
            var propuesta = await dbContext.PropuestasCambioFestival.AsNoTracking()
                .Where(item => item.FestivalOrigenId == festival.Id)
                .OrderByDescending(item => item.Activa).ThenByDescending(item => item.FechaActualizacion)
                .FirstOrDefaultAsync(cancellationToken);
            return propuesta is null ? Results.NotFound() : Results.Ok(await ADtoAsync(propuesta, dbContext, cancellationToken));
        });

        externo.MapPut("/{festivalId:int}/propuesta-cambio", async (
            int festivalId,
            CrearFestivalBorradorSolicitud solicitud,
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            IAntiforgery antiforgery,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            if (!await ValidarAntiforgeryAsync(antiforgery, httpContext))
                return Results.BadRequest(new { message = "La propuesta de cambio no pudo validarse. Actualiza la página e inténtalo nuevamente." });

            var personaId = ObtenerPersonaId(principal);
            if (personaId is null) return Results.Unauthorized();
            var festival = await dbContext.FestivalRecords.AsNoTracking().FirstOrDefaultAsync(item => item.Id == festivalId, cancellationToken);
            if (festival is null) return Results.NotFound();
            if (festival.OrganizacionPrincipalId is null
                || !await PuedeAdministrarOrganizacionAsync(dbContext, personaId.Value, festival.OrganizacionPrincipalId.Value, cancellationToken)) return Results.Forbid();
            var propuesta = await dbContext.PropuestasCambioFestival
                .FirstOrDefaultAsync(item => item.FestivalOrigenId == festival.Id && item.Activa, cancellationToken);
            if (propuesta is null) return Results.NotFound();
            if (propuesta.Estado is not ("Borrador" or "AjustesSolicitados"))
                return Results.Conflict(new { message = "Esta propuesta no puede modificarse directamente en su estado actual.", estado = propuesta.Estado });

            var errores = await ValidarSolicitudAsync(solicitud, dbContext, cancellationToken);
            if (errores.Count > 0) return Results.ValidationProblem(errores);

            var ahora = DateTime.UtcNow;
            propuesta.Nombre = ValidationHelpers.SanitizeText(solicitud.Nombre, 240);
            propuesta.Descripcion = LimpiarTexto(solicitud.Descripcion);
            propuesta.Periodicidad = LimpiarTexto(solicitud.Periodicidad);
            propuesta.CorreoContacto = NormalizarCorreo(solicitud.CorreoContacto);
            propuesta.NivelCobertura = NormalizarNivel(solicitud.NivelCobertura);
            propuesta.CodigoDepartamento = LimpiarTexto(solicitud.CodigoDepartamento);
            propuesta.CodigoMunicipio = LimpiarTexto(solicitud.CodigoMunicipio);
            propuesta.FechaActualizacion = ahora;

            var practicas = await dbContext.PropuestasCambioFestivalPracticasMusicales
                .Where(item => item.PropuestaCambioFestivalId == propuesta.Id).ToListAsync(cancellationToken);
            var territorios = await dbContext.PropuestasCambioFestivalTerritoriosSonoros
                .Where(item => item.PropuestaCambioFestivalId == propuesta.Id).ToListAsync(cancellationToken);
            dbContext.PropuestasCambioFestivalPracticasMusicales.RemoveRange(practicas);
            dbContext.PropuestasCambioFestivalTerritoriosSonoros.RemoveRange(territorios);
            dbContext.PropuestasCambioFestivalPracticasMusicales.AddRange(solicitud.PracticasMusicalesIds.Distinct().Select(id => new PropuestaCambioFestivalPracticaMusicalRow
            {
                PropuestaCambioFestivalId = propuesta.Id, PracticaMusicalId = id, FechaCreacion = ahora
            }));
            dbContext.PropuestasCambioFestivalTerritoriosSonoros.AddRange(solicitud.TerritoriosSonorosIds.Distinct().Select(id => new PropuestaCambioFestivalTerritorioSonoroRow
            {
                PropuestaCambioFestivalId = propuesta.Id, TerritorioSonoroId = id, FechaCreacion = ahora
            }));
            RegistrarAuditoria(dbContext, personaId.Value, propuesta, "FestivalCambioPropuestoActualizado", ahora);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(await ADtoAsync(propuesta, dbContext, cancellationToken));
        });

        externo.MapPost("/{festivalId:int}/propuesta-cambio/enviar-a-revision", async (
            int festivalId,
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            IAntiforgery antiforgery,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            if (!await ValidarAntiforgeryAsync(antiforgery, httpContext))
                return Results.BadRequest(new { message = "El envío de la propuesta no pudo validarse. Actualiza la página e inténtalo nuevamente." });
            var personaId = ObtenerPersonaId(principal);
            if (personaId is null) return Results.Unauthorized();
            var festival = await dbContext.FestivalRecords.AsNoTracking().FirstOrDefaultAsync(item => item.Id == festivalId, cancellationToken);
            if (festival?.OrganizacionPrincipalId is not int organizacionId) return festival is null ? Results.NotFound() : Results.Forbid();
            if (!await PuedeAdministrarOrganizacionAsync(dbContext, personaId.Value, organizacionId, cancellationToken)) return Results.Forbid();
            var propuesta = await dbContext.PropuestasCambioFestival.FirstOrDefaultAsync(item => item.FestivalOrigenId == festivalId && item.Activa, cancellationToken);
            if (propuesta is null) return Results.NotFound();
            if (propuesta.Estado is not ("Borrador" or "AjustesSolicitados"))
                return Results.Conflict(new { message = "Solo una propuesta en Borrador o con ajustes solicitados puede enviarse a revisión.", estado = propuesta.Estado });
            var errores = await ValidarPropuestaParaRevisionAsync(propuesta, dbContext, cancellationToken);
            if (errores.Count > 0) return Results.ValidationProblem(errores);

            var estadoAnterior = propuesta.Estado;
            var ahora = DateTime.UtcNow;
            propuesta.Estado = "EnRevision";
            propuesta.FechaEnvioRevision = ahora;
            propuesta.FechaActualizacion = ahora;
            dbContext.HistorialesRevisionRegistros.Add(new HistorialRevisionRegistroRow
            {
                ModuloId = "propuestas-cambio-festival", RegistroId = propuesta.Id.ToString(CultureInfo.InvariantCulture),
                EstadoAnterior = estadoAnterior, EstadoNuevo = "EnRevision", Accion = "FestivalPropuestaEnviadaARevision",
                UsuarioId = personaId.Value, Fecha = ahora,
                MetadataJson = $"{{\"FestivalOrigenId\":{propuesta.FestivalOrigenId},\"VersionOrigenId\":{propuesta.VersionOrigenId},\"OrganizacionId\":{propuesta.OrganizacionId}}}"
            });
            RegistrarAuditoria(dbContext, personaId.Value, propuesta, "FestivalPropuestaEnviadaARevision", ahora);
            await CrearNotificacionAsync(dbContext, personaId.Value, propuesta, festival.Name, "FestivalPropuestaEnviadaARevision", "Propuesta enviada a revisión", "Tu propuesta de cambios para el Festival", ahora, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(await ADtoAsync(propuesta, dbContext, cancellationToken));
        });

        return group;
    }

    private static async Task<PropuestaCambioFestivalDto> ADtoAsync(PropuestaCambioFestivalRow propuesta, PnmcDbContext dbContext, CancellationToken cancellationToken)
    {
        var practicas = await dbContext.PropuestasCambioFestivalPracticasMusicales.AsNoTracking()
            .Where(item => item.PropuestaCambioFestivalId == propuesta.Id)
            .Join(dbContext.PracticasMusicales.AsNoTracking(), relacion => relacion.PracticaMusicalId, practica => practica.Id,
                (_, practica) => new { practica.Id, practica.Nombre }).OrderBy(item => item.Nombre)
            .Select(item => new CatalogoFestivalDto(item.Id, item.Nombre)).ToListAsync(cancellationToken);
        var territorios = await dbContext.PropuestasCambioFestivalTerritoriosSonoros.AsNoTracking()
            .Where(item => item.PropuestaCambioFestivalId == propuesta.Id)
            .Join(dbContext.TerritoriosSonoros.AsNoTracking(), relacion => relacion.TerritorioSonoroId, territorio => territorio.Id,
                (_, territorio) => new { territorio.Id, territorio.Nombre }).OrderBy(item => item.Nombre)
            .Select(item => new CatalogoFestivalDto(item.Id, item.Nombre)).ToListAsync(cancellationToken);
        return new PropuestaCambioFestivalDto(
            propuesta.Id.ToString(CultureInfo.InvariantCulture), propuesta.FestivalOrigenId.ToString(CultureInfo.InvariantCulture),
            propuesta.VersionOrigenId.ToString(CultureInfo.InvariantCulture), propuesta.Estado, propuesta.Nombre, propuesta.Descripcion,
            propuesta.NivelCobertura, propuesta.CodigoDepartamento, propuesta.CodigoMunicipio, propuesta.Periodicidad,
            propuesta.CorreoContacto, practicas, territorios, propuesta.FechaEnvioRevision,
            await dbContext.HistorialesRevisionRegistros.AsNoTracking().Where(item => item.ModuloId == "propuestas-cambio-festival" && item.RegistroId == propuesta.Id.ToString())
                .OrderByDescending(item => item.Fecha).Select(item => item.Comentario ?? item.MotivoRechazo).FirstOrDefaultAsync(cancellationToken));
    }

    private static async Task<Dictionary<string, string[]>> ValidarSolicitudAsync(CrearFestivalBorradorSolicitud solicitud, PnmcDbContext dbContext, CancellationToken cancellationToken)
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
            if (departamento is null || !await dbContext.DivipolaLocations.AsNoTracking().AnyAsync(item => item.DepartmentCode == departamento, cancellationToken))
            {
                errores["codigoDepartamento"] = ["El departamento indicado no existe en DIVIPOLA."];
                return errores;
            }
            if (nivel == "municipal")
            {
                var municipio = LimpiarTexto(solicitud.CodigoMunicipio);
                if (municipio is null || !await dbContext.DivipolaLocations.AsNoTracking().AnyAsync(item => item.DepartmentCode == departamento && item.MunicipalityCode == municipio, cancellationToken))
                    errores["codigoMunicipio"] = ["El municipio indicado no existe en DIVIPOLA."];
            }
        }
        var practicas = solicitud.PracticasMusicalesIds.Distinct().ToArray();
        if (practicas.Length > 0 && await dbContext.PracticasMusicales.AsNoTracking().CountAsync(item => practicas.Contains(item.Id), cancellationToken) != practicas.Length)
            errores["practicasMusicalesIds"] = ["Una o más prácticas musicales no existen en el catálogo."];
        var territorios = solicitud.TerritoriosSonorosIds.Distinct().ToArray();
        if (territorios.Length > 0 && await dbContext.TerritoriosSonoros.AsNoTracking().CountAsync(item => territorios.Contains(item.Id), cancellationToken) != territorios.Length)
            errores["territoriosSonorosIds"] = ["Uno o más territorios sonoros no existen en el catálogo."];
        return errores;
    }

    private static async Task<Dictionary<string, string[]>> ValidarPropuestaParaRevisionAsync(PropuestaCambioFestivalRow propuesta, PnmcDbContext dbContext, CancellationToken cancellationToken)
    {
        var solicitud = new CrearFestivalBorradorSolicitud
        {
            Nombre = propuesta.Nombre, Descripcion = propuesta.Descripcion, Periodicidad = propuesta.Periodicidad,
            CorreoContacto = propuesta.CorreoContacto, NivelCobertura = propuesta.NivelCobertura,
            CodigoDepartamento = propuesta.CodigoDepartamento, CodigoMunicipio = propuesta.CodigoMunicipio,
            PracticasMusicalesIds = await dbContext.PropuestasCambioFestivalPracticasMusicales.AsNoTracking().Where(item => item.PropuestaCambioFestivalId == propuesta.Id).Select(item => item.PracticaMusicalId).ToListAsync(cancellationToken),
            TerritoriosSonorosIds = await dbContext.PropuestasCambioFestivalTerritoriosSonoros.AsNoTracking().Where(item => item.PropuestaCambioFestivalId == propuesta.Id).Select(item => item.TerritorioSonoroId).ToListAsync(cancellationToken)
        };
        return await ValidarSolicitudAsync(solicitud, dbContext, cancellationToken);
    }

    private static async Task<bool> PuedeAdministrarOrganizacionAsync(PnmcDbContext dbContext, int personaId, int organizacionId, CancellationToken cancellationToken) =>
        await dbContext.UserEntities.AsNoTracking()
            .Where(item => item.UserId == personaId && item.EntityId == organizacionId && item.EntityRole == "administrador" && item.IsActive)
            .Join(dbContext.EntityProfiles.AsNoTracking().Where(item => item.IsActive), relacion => relacion.EntityId, organizacion => organizacion.Id, (_, _) => true)
            .AnyAsync(cancellationToken);

    private static void RegistrarAuditoria(PnmcDbContext dbContext, int personaId, PropuestaCambioFestivalRow propuesta, string accion, DateTime fecha) =>
        dbContext.AuditLogs.Add(new AuditLogRow
        {
            UserId = personaId,
            TableName = "PropuestasCambioFestival",
            RecordId = propuesta.Id.ToString(CultureInfo.InvariantCulture),
            Action = accion,
            NewValuesJson = $"{{\"FestivalOrigenId\":{propuesta.FestivalOrigenId},\"VersionOrigenId\":{propuesta.VersionOrigenId},\"OrganizacionId\":{propuesta.OrganizacionId},\"Estado\":\"{propuesta.Estado}\"}}",
            CreatedAt = fecha
        });

    private static async Task CrearNotificacionAsync(PnmcDbContext dbContext, int personaId, PropuestaCambioFestivalRow propuesta, string nombreFestival, string evento, string titulo, string inicioCuerpo, DateTime fecha, CancellationToken cancellationToken)
    {
        var persona = await dbContext.Users.AsNoTracking().FirstOrDefaultAsync(item => item.Id == personaId && item.IsActive, cancellationToken);
        if (persona is null) return;
        dbContext.Notifications.Add(new NotificationRow
        {
            RecipientUserId = persona.Id, RecipientEmail = persona.Email, EventType = evento, Channel = "internal", Title = titulo,
            Body = $"{inicioCuerpo} “{nombreFestival}” fue enviada a revisión institucional.", Status = "enviada",
            ModuleId = "propuestas-cambio-festival", RecordId = propuesta.Id.ToString(CultureInfo.InvariantCulture),
            MetadataJson = $"{{\"FestivalOrigenId\":{propuesta.FestivalOrigenId},\"Estado\":\"{propuesta.Estado}\"}}", CreatedAt = fecha, SentAt = fecha, Attempts = 0
        });
    }

    private static int? ObtenerPersonaId(ClaimsPrincipal principal) =>
        int.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), NumberStyles.Integer, CultureInfo.InvariantCulture, out var personaId) ? personaId : null;

    private static async Task<bool> ValidarAntiforgeryAsync(IAntiforgery antiforgery, HttpContext httpContext)
    {
        try { await antiforgery.ValidateRequestAsync(httpContext); return true; }
        catch (AntiforgeryValidationException) { return false; }
    }

    private static string NormalizarNivel(string? valor) => (valor ?? string.Empty).Trim().ToLowerInvariant();
    private static string? LimpiarTexto(string? valor) => string.IsNullOrWhiteSpace(valor) ? null : ValidationHelpers.SanitizeText(valor, 1200);
    private static string? NormalizarCorreo(string? valor) => string.IsNullOrWhiteSpace(valor) ? null : valor.Trim().ToLowerInvariant();
}
