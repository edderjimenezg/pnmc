using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.EntityFrameworkCore;
using PNMC.Api.Security;
using PNMC.Contracts;
using PNMC.Infrastructure.Common;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class RevisionInstitucionalFestivalesEndpoints
{
    public static RouteGroupBuilder MapRevisionInstitucionalFestivalesEndpoints(this RouteGroupBuilder group)
    {
        var institucional = group.MapGroup("/institucional/festivales").WithTags("revision-institucional-festivales");
        institucional.RequireAuthorization(SimusAuthentication.InstitutionalPolicy);

        institucional.MapGet("/csrf", (IAntiforgery antiforgery, HttpContext httpContext) =>
        {
            var tokens = antiforgery.GetAndStoreTokens(httpContext);
            return Results.Ok(new TokenAntiforgeryRespuesta(tokens.RequestToken ?? string.Empty));
        });

        institucional.MapGet("/en-revision", async (PnmcDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var festivales = await dbContext.FestivalRecords.AsNoTracking()
                .Where(item => item.StatusCode == "EnRevision")
                .OrderBy(item => item.UpdatedAt ?? item.CreatedAt)
                .ToListAsync(cancellationToken);
            var organizaciones = await dbContext.EntityProfiles.AsNoTracking()
                .Where(item => item.IsActive)
                .ToDictionaryAsync(item => item.Id, item => item.Name, cancellationToken);
            var ids = festivales.Select(item => item.Id.ToString(CultureInfo.InvariantCulture)).ToArray();
            var envios = await dbContext.HistorialesRevisionRegistros.AsNoTracking()
                .Where(item => item.ModuloId == "festivales" && ids.Contains(item.RegistroId) && item.Accion == "FestivalEnviadoARevision")
                .GroupBy(item => item.RegistroId)
                .Select(group => new { RegistroId = group.Key, Fecha = group.Max(item => item.Fecha) })
                .ToDictionaryAsync(item => item.RegistroId, item => item.Fecha, cancellationToken);

            var respuesta = festivales.Select(item => new FestivalRevisionInstitucionalDto(
                item.Id.ToString(CultureInfo.InvariantCulture),
                item.Name,
                item.OrganizacionPrincipalId is int organizacionId && organizaciones.TryGetValue(organizacionId, out var nombre)
                    ? nombre : "Organización no disponible",
                item.CoverageLevel,
                string.IsNullOrWhiteSpace(item.DepartmentCode) ? null : item.DepartmentCode,
                item.MunicipalityCode,
                envios.TryGetValue(item.Id.ToString(CultureInfo.InvariantCulture), out var fecha) ? fecha : item.UpdatedAt ?? item.CreatedAt));
            return Results.Ok(respuesta);
        });

        institucional.MapGet("/{festivalId:int}", async (int festivalId, PnmcDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var festival = await dbContext.FestivalRecords.AsNoTracking().FirstOrDefaultAsync(item => item.Id == festivalId, cancellationToken);
            if (festival is null) return Results.NotFound();
            var organizacion = festival.OrganizacionPrincipalId is int organizacionId
                ? await dbContext.EntityProfiles.AsNoTracking().Where(item => item.Id == organizacionId).Select(item => item.Name).FirstOrDefaultAsync(cancellationToken)
                : null;
            var historial = await dbContext.HistorialesRevisionRegistros.AsNoTracking()
                .Where(item => item.ModuloId == "festivales" && item.RegistroId == festivalId.ToString())
                .OrderByDescending(item => item.Fecha)
                .Select(item => new { item.EstadoAnterior, item.EstadoNuevo, item.Accion, item.Comentario, item.MotivoRechazo, item.Fecha })
                .ToListAsync(cancellationToken);
            return Results.Ok(new
            {
                id = festival.Id.ToString(CultureInfo.InvariantCulture),
                nombre = festival.Name,
                descripcion = festival.Description,
                estado = festival.StatusCode,
                organizacionPrincipalNombre = organizacion,
                nivelCobertura = festival.CoverageLevel,
                codigoDepartamento = festival.DepartmentCode,
                codigoMunicipio = festival.MunicipalityCode,
                periodicidad = festival.Periodicidad,
                correoContacto = festival.ContactEmail,
                historial
            });
        });

        institucional.MapPost("/{festivalId:int}/decisiones", async (
            int festivalId,
            DecisionRevisionFestivalSolicitud solicitud,
            ClaimsPrincipal principal,
            PnmcDbContext dbContext,
            IAntiforgery antiforgery,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            if (!await ValidarAntiforgeryAsync(antiforgery, httpContext))
            {
                return Results.BadRequest(new { message = "La decisión institucional no pudo validarse. Actualiza la página e inténtalo nuevamente." });
            }

            var personaInstitucionalId = ObtenerPersonaId(principal);
            if (personaInstitucionalId is null) return Results.Unauthorized();
            var festival = await dbContext.FestivalRecords.FirstOrDefaultAsync(item => item.Id == festivalId, cancellationToken);
            if (festival is null) return Results.NotFound();
            if (festival.StatusCode != "EnRevision")
            {
                return Results.Conflict(new { message = "Solo un Festival en revisión puede recibir una decisión institucional.", estado = festival.StatusCode });
            }

            var decision = ResolverDecision(solicitud);
            if (decision.Errores.Count > 0) return Results.ValidationProblem(decision.Errores);

            var ahora = DateTime.UtcNow;
            festival.StatusCode = decision.EstadoNuevo!;
            festival.UpdatedAt = ahora;
            dbContext.HistorialesRevisionRegistros.Add(new HistorialRevisionRegistroRow
            {
                ModuloId = "festivales",
                RegistroId = festival.Id.ToString(CultureInfo.InvariantCulture),
                EstadoAnterior = "EnRevision",
                EstadoNuevo = decision.EstadoNuevo!,
                Accion = decision.Evento!,
                Comentario = decision.Observacion,
                MotivoRechazo = decision.MotivoRechazo,
                UsuarioId = personaInstitucionalId.Value,
                Fecha = ahora,
                MetadataJson = $"{{\"OrganizacionPrincipalId\":{festival.OrganizacionPrincipalId}}}"
            });
            dbContext.AuditLogs.Add(new AuditLogRow
            {
                UserId = personaInstitucionalId.Value,
                TableName = "Festivales",
                RecordId = festival.Id.ToString(CultureInfo.InvariantCulture),
                Action = decision.Evento!,
                PreviousValuesJson = "{\"Estado\":\"EnRevision\"}",
                NewValuesJson = $"{{\"Estado\":\"{decision.EstadoNuevo}\",\"OrganizacionPrincipalId\":{festival.OrganizacionPrincipalId}}}",
                CreatedAt = ahora
            });
            await CrearNotificacionDecisionAsync(dbContext, festival, decision, ahora, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new { id = festival.Id, estado = festival.StatusCode, observacion = decision.Observacion ?? decision.MotivoRechazo });
        });

        return group;
    }

    private static (string? EstadoNuevo, string? Evento, string? Observacion, string? MotivoRechazo, Dictionary<string, string[]> Errores) ResolverDecision(DecisionRevisionFestivalSolicitud solicitud)
    {
        var errores = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);
        var accion = solicitud.Accion?.Trim();
        var observacion = LimpiarTexto(solicitud.Observacion);
        var motivoRechazo = LimpiarTexto(solicitud.MotivoRechazo);
        return accion switch
        {
            "SolicitarAjustes" when string.IsNullOrWhiteSpace(observacion) => (null, null, null, null,
                new Dictionary<string, string[]> { ["observacion"] = ["La observación es obligatoria para solicitar ajustes."] }),
            "SolicitarAjustes" => ("AjustesSolicitados", "FestivalAjustesSolicitados", observacion, null, errores),
            "Rechazar" when string.IsNullOrWhiteSpace(motivoRechazo) => (null, null, null, null,
                new Dictionary<string, string[]> { ["motivoRechazo"] = ["El motivo es obligatorio para rechazar el Festival."] }),
            "Rechazar" => ("Rechazado", "FestivalRechazado", null, motivoRechazo, errores),
            "Publicar" => ("Publicado", "FestivalPublicado", null, null, errores),
            _ => (null, null, null, null, new Dictionary<string, string[]> { ["accion"] = ["La acción institucional no es válida."] })
        };
    }

    private static async Task CrearNotificacionDecisionAsync(
        PnmcDbContext dbContext,
        FestivalRow festival,
        (string? EstadoNuevo, string? Evento, string? Observacion, string? MotivoRechazo, Dictionary<string, string[]> Errores) decision,
        DateTime fecha,
        CancellationToken cancellationToken)
    {
        var registroId = festival.Id.ToString(CultureInfo.InvariantCulture);
        var personaRemitenteId = await dbContext.AuditLogs.AsNoTracking()
            .Where(item => item.TableName == "Festivales" && item.RecordId == registroId && item.Action == "FestivalEnviadoARevision" && item.UserId != null)
            .OrderByDescending(item => item.CreatedAt)
            .Select(item => item.UserId)
            .FirstOrDefaultAsync(cancellationToken);
        if (personaRemitenteId is null) return;

        var persona = await dbContext.Users.AsNoTracking().FirstOrDefaultAsync(item => item.Id == personaRemitenteId.Value && item.IsActive, cancellationToken);
        if (persona is null) return;

        var (titulo, cuerpo) = decision.EstadoNuevo switch
        {
            "AjustesSolicitados" => ("Festival con ajustes solicitados", $"SIMUS solicitó ajustes para tu Festival “{festival.Name}”. {decision.Observacion}"),
            "Rechazado" => ("Festival rechazado", $"SIMUS rechazó tu Festival “{festival.Name}”. Motivo: {decision.MotivoRechazo}"),
            "Publicado" => ("Festival publicado", $"Tu Festival “{festival.Name}” fue publicado en SIMUS."),
            _ => ("Actualización de Festival", $"Tu Festival “{festival.Name}” cambió de estado.")
        };
        dbContext.Notifications.Add(new NotificationRow
        {
            RecipientUserId = persona.Id,
            RecipientEmail = persona.Email,
            EventType = decision.Evento!,
            Channel = "internal",
            Title = titulo,
            Body = cuerpo,
            Status = "enviada",
            ModuleId = "festivales",
            RecordId = registroId,
            MetadataJson = $"{{\"Estado\":\"{decision.EstadoNuevo}\"}}",
            CreatedAt = fecha,
            SentAt = fecha,
            Attempts = 0
        });
    }

    private static int? ObtenerPersonaId(ClaimsPrincipal principal) =>
        int.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), NumberStyles.Integer, CultureInfo.InvariantCulture, out var personaId)
            ? personaId : null;

    private static async Task<bool> ValidarAntiforgeryAsync(IAntiforgery antiforgery, HttpContext httpContext)
    {
        try { await antiforgery.ValidateRequestAsync(httpContext); return true; }
        catch (AntiforgeryValidationException) { return false; }
    }

    private static string? LimpiarTexto(string? valor) => string.IsNullOrWhiteSpace(valor) ? null : ValidationHelpers.SanitizeText(valor, 1200);
}
