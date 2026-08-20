using System.Globalization;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.EntityFrameworkCore;
using PNMC.Api.Security;
using PNMC.Contracts;
using PNMC.Infrastructure.Common;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class SolicitudesAdministracionFestivalEndpoints
{
    private const string Modulo = "solicitudes-administracion-festival";

    public static RouteGroupBuilder MapSolicitudesAdministracionFestivalEndpoints(this RouteGroupBuilder group)
    {
        var externo = group.MapGroup("/externo").WithTags("solicitudes-administracion-festival-externas");
        externo.RequireAuthorization(SimusAuthentication.ExternalPolicy);

        externo.MapPost("/organizaciones/{organizacionId:int}/festivales/{festivalId:int}/solicitudes-administracion", CrearSolicitudAsync);
        externo.MapGet("/organizaciones/{organizacionId:int}/solicitudes-administracion-festival", ListarSolicitudesExternasAsync);
        externo.MapPost("/organizaciones/{organizacionId:int}/solicitudes-administracion-festival/{solicitudId:long}/responder-informacion", ResponderInformacionAsync);

        var institucional = group.MapGroup("/institucional/solicitudes-administracion-festival")
            .WithTags("solicitudes-administracion-festival-institucional");
        institucional.RequireAuthorization(SimusAuthentication.InstitutionalPolicy);
        institucional.MapGet("/csrf", (IAntiforgery antiforgery, HttpContext context) =>
        {
            var tokens = antiforgery.GetAndStoreTokens(context);
            return Results.Ok(new TokenAntiforgeryRespuesta(tokens.RequestToken ?? string.Empty));
        });
        institucional.MapGet(string.Empty, ListarSolicitudesInstitucionalesAsync);
        institucional.MapPost("/{solicitudId:long}/decisiones", DecidirSolicitudAsync);

        return group;
    }

    private static async Task<IResult> CrearSolicitudAsync(
        int organizacionId,
        int festivalId,
        CrearSolicitudAdministracionFestivalSolicitud solicitud,
        ClaimsPrincipal principal,
        PnmcDbContext db,
        IAntiforgery antiforgery,
        HttpContext context,
        CancellationToken ct)
    {
        if (!await ValidarAntiforgeryAsync(antiforgery, context))
            return Results.BadRequest(new { message = "La solicitud no pudo validarse. Actualiza la página e inténtalo nuevamente." });

        var personaId = ObtenerPersonaId(principal);
        if (personaId is null) return Results.Unauthorized();
        if (!await PuedeAdministrarOrganizacionAsync(db, personaId.Value, organizacionId, ct)) return Results.Forbid();

        var justificacion = ValidationHelpers.SanitizeText(solicitud.Justificacion, 1200);
        if (string.IsNullOrWhiteSpace(justificacion))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["justificacion"] = ["Explica brevemente por qué tu organización solicita administrar este Festival."] });

        var organizacion = await db.EntityProfiles.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == organizacionId && item.IsActive, ct);
        var festival = await db.FestivalRecords.FirstOrDefaultAsync(item => item.Id == festivalId, ct);
        if (organizacion is null || festival is null) return Results.NotFound();

        var evidencias = await ObtenerEvidenciasElegiblesAsync(db, organizacion, festival, ct);
        if (evidencias is null)
            return Results.Conflict(new { message = "Este Festival ya no está disponible para solicitar administración." });

        var existeActiva = await db.SolicitudesAdministracionFestival.AsNoTracking()
            .AnyAsync(item => item.FestivalId == festivalId && item.OrganizacionId == organizacionId && item.Activa, ct);
        if (existeActiva)
            return Results.Conflict(new { message = "Ya existe una solicitud activa de esta organización para el Festival." });

        var ahora = DateTime.UtcNow;
        var row = new SolicitudAdministracionFestivalRow
        {
            FestivalId = festivalId,
            OrganizacionId = organizacionId,
            PersonaSolicitanteId = personaId.Value,
            Justificacion = justificacion,
            EvidenciaAutomaticaJson = JsonSerializer.Serialize(evidencias),
            Estado = "Pendiente",
            Activa = true,
            FechaCreacion = ahora,
            FechaActualizacion = ahora
        };
        db.SolicitudesAdministracionFestival.Add(row);
        db.AuditLogs.Add(new AuditLogRow
        {
            UserId = personaId.Value,
            TableName = "SolicitudesAdministracionFestival",
            RecordId = festivalId.ToString(CultureInfo.InvariantCulture),
            Action = "SolicitudAdministracionFestivalCreada",
            NewValuesJson = $"{{\"OrganizacionId\":{organizacionId},\"Estado\":\"Pendiente\"}}",
            CreatedAt = ahora
        });
        await CrearNotificacionesInstitucionalesAsync(db, festival, organizacion, ahora, ct);

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            return Results.Conflict(new { message = "Ya existe una solicitud activa de esta organización para el Festival." });
        }

        return Results.Created($"/api/v1/externo/organizaciones/{organizacionId}/solicitudes-administracion-festival/{row.Id}",
            await CrearDtoAsync(row, db, ct));
    }

    private static async Task<IResult> ListarSolicitudesExternasAsync(
        int organizacionId, ClaimsPrincipal principal, PnmcDbContext db, CancellationToken ct)
    {
        var personaId = ObtenerPersonaId(principal);
        if (personaId is null) return Results.Unauthorized();
        if (!await PuedeAdministrarOrganizacionAsync(db, personaId.Value, organizacionId, ct)) return Results.Forbid();

        var solicitudes = await db.SolicitudesAdministracionFestival.AsNoTracking()
            .Where(item => item.OrganizacionId == organizacionId)
            .OrderByDescending(item => item.FechaActualizacion)
            .ToListAsync(ct);
        var resultado = new List<SolicitudAdministracionFestivalDto>();
        foreach (var item in solicitudes) resultado.Add(await CrearDtoAsync(item, db, ct));
        return Results.Ok(resultado);
    }

    private static async Task<IResult> ResponderInformacionAsync(
        int organizacionId, long solicitudId, ResponderInformacionSolicitudAdministracionFestivalSolicitud solicitud,
        ClaimsPrincipal principal, PnmcDbContext db, IAntiforgery antiforgery, HttpContext context, CancellationToken ct)
    {
        if (!await ValidarAntiforgeryAsync(antiforgery, context))
            return Results.BadRequest(new { message = "La respuesta no pudo validarse. Actualiza la página e inténtalo nuevamente." });
        var personaId = ObtenerPersonaId(principal);
        if (personaId is null) return Results.Unauthorized();
        if (!await PuedeAdministrarOrganizacionAsync(db, personaId.Value, organizacionId, ct)) return Results.Forbid();

        var row = await db.SolicitudesAdministracionFestival.FirstOrDefaultAsync(item => item.Id == solicitudId && item.OrganizacionId == organizacionId, ct);
        if (row is null) return Results.NotFound();
        if (row.Estado != "InformacionSolicitada" || !row.Activa)
            return Results.Conflict(new { message = "Esta solicitud no está esperando información adicional.", estado = row.Estado });

        var respuesta = ValidationHelpers.SanitizeText(solicitud.Respuesta, 1200);
        if (string.IsNullOrWhiteSpace(respuesta))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["respuesta"] = ["Describe la información adicional solicitada."] });

        var ahora = DateTime.UtcNow;
        row.RespuestaSolicitante = respuesta;
        row.Estado = "Pendiente";
        row.FechaActualizacion = ahora;
        db.AuditLogs.Add(new AuditLogRow { UserId = personaId.Value, TableName = "SolicitudesAdministracionFestival", RecordId = row.Id.ToString(CultureInfo.InvariantCulture), Action = "InformacionSolicitudAdministracionFestivalRespondida", PreviousValuesJson = "{\"Estado\":\"InformacionSolicitada\"}", NewValuesJson = "{\"Estado\":\"Pendiente\"}", CreatedAt = ahora });
        await db.SaveChangesAsync(ct);
        return Results.Ok(await CrearDtoAsync(row, db, ct));
    }

    private static async Task<IResult> ListarSolicitudesInstitucionalesAsync(
        ClaimsPrincipal principal, PnmcDbContext db, string? estado, CancellationToken ct)
    {
        if (!PuedeDecidir(principal)) return Results.Forbid();
        var query = db.SolicitudesAdministracionFestival.AsNoTracking().OrderByDescending(item => item.FechaActualizacion).AsQueryable();
        if (!string.IsNullOrWhiteSpace(estado)) query = query.Where(item => item.Estado == estado.Trim());
        var solicitudes = await query.ToListAsync(ct);
        var resultado = new List<SolicitudAdministracionFestivalDto>();
        foreach (var item in solicitudes) resultado.Add(await CrearDtoAsync(item, db, ct));
        return Results.Ok(resultado);
    }

    private static async Task<IResult> DecidirSolicitudAsync(
        long solicitudId, DecidirSolicitudAdministracionFestivalSolicitud solicitud, ClaimsPrincipal principal, PnmcDbContext db,
        IAntiforgery antiforgery, HttpContext context, CancellationToken ct)
    {
        if (!PuedeDecidir(principal)) return Results.Forbid();
        if (!await ValidarAntiforgeryAsync(antiforgery, context))
            return Results.BadRequest(new { message = "La decisión institucional no pudo validarse. Actualiza la página e inténtalo nuevamente." });
        var personaId = ObtenerPersonaId(principal);
        if (personaId is null) return Results.Unauthorized();
        var row = await db.SolicitudesAdministracionFestival.FirstOrDefaultAsync(item => item.Id == solicitudId, ct);
        if (row is null) return Results.NotFound();
        if (!row.Activa) return Results.Conflict(new { message = "Esta solicitud ya fue cerrada.", estado = row.Estado });

        var decision = (solicitud.Decision ?? string.Empty).Trim().ToLowerInvariant();
        var comentario = ValidationHelpers.SanitizeText(solicitud.Comentario, 1200);
        if (decision is not ("aprobar" or "rechazar" or "solicitar_informacion"))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["decision"] = ["La decisión debe ser aprobar, rechazar o solicitar_informacion."] });
        if (decision == "solicitar_informacion" && string.IsNullOrWhiteSpace(comentario))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["comentario"] = ["Explica qué información adicional requiere SIMUS."] });

        var festival = await db.FestivalRecords.FirstOrDefaultAsync(item => item.Id == row.FestivalId, ct);
        if (festival is null) return Results.Conflict(new { message = "El Festival asociado ya no está disponible." });
        var ahora = DateTime.UtcNow;
        var estadoAnterior = row.Estado;
        string evento;
        switch (decision)
        {
            case "aprobar":
                if (festival.StatusCode != "Publicado" || festival.OrganizacionPrincipalId is not null)
                    return Results.Conflict(new { message = "El Festival ya no es elegible para vinculación histórica.", estadoFestival = festival.StatusCode });
                festival.OrganizacionPrincipalId = row.OrganizacionId;
                festival.UpdatedAt = ahora;
                row.Estado = "Aprobada";
                row.Activa = false;
                evento = "SolicitudAdministracionFestivalAprobada";
                db.AuditLogs.Add(new AuditLogRow { UserId = personaId.Value, TableName = "Festivales", RecordId = festival.Id.ToString(CultureInfo.InvariantCulture), Action = "FestivalHistoricoVinculadoAOrganizacion", PreviousValuesJson = "{\"OrganizacionPrincipalId\":null}", NewValuesJson = $"{{\"OrganizacionPrincipalId\":{row.OrganizacionId}}}", CreatedAt = ahora });
                break;
            case "rechazar":
                row.Estado = "Rechazada";
                row.Activa = false;
                evento = "SolicitudAdministracionFestivalRechazada";
                break;
            default:
                row.Estado = "InformacionSolicitada";
                evento = "InformacionSolicitudAdministracionFestivalSolicitada";
                break;
        }

        row.PersonaDecisoraId = personaId.Value;
        row.ComentarioDecision = string.IsNullOrWhiteSpace(comentario) ? null : comentario;
        row.FechaActualizacion = ahora;
        row.FechaDecision = decision == "solicitar_informacion" ? null : ahora;
        db.AuditLogs.Add(new AuditLogRow { UserId = personaId.Value, TableName = "SolicitudesAdministracionFestival", RecordId = row.Id.ToString(CultureInfo.InvariantCulture), Action = evento, PreviousValuesJson = $"{{\"Estado\":\"{estadoAnterior}\"}}", NewValuesJson = $"{{\"Estado\":\"{row.Estado}\",\"OrganizacionId\":{row.OrganizacionId}}}", CreatedAt = ahora });
        await CrearNotificacionSolicitanteAsync(db, row, festival, evento, ahora, ct);
        await db.SaveChangesAsync(ct);
        return Results.Ok(await CrearDtoAsync(row, db, ct));
    }

    private static async Task<List<string>?> ObtenerEvidenciasElegiblesAsync(PnmcDbContext db, EntityProfileRow organizacion, FestivalRow festival, CancellationToken ct)
    {
        if (festival.StatusCode != "Publicado" || festival.OrganizacionPrincipalId is not null || string.IsNullOrWhiteSpace(festival.Name)) return null;
        var nombreCoincide = NormalizarNombre(organizacion.Name) == NormalizarNombre(festival.OrganizerDisplayName);
        var municipioCoincide = !string.IsNullOrWhiteSpace(organizacion.DepartmentCode) && !string.IsNullOrWhiteSpace(organizacion.MunicipalityCode)
            && organizacion.DepartmentCode == festival.DepartmentCode && organizacion.MunicipalityCode == festival.MunicipalityCode;
        var departamentoCoincide = !string.IsNullOrWhiteSpace(organizacion.DepartmentCode) && organizacion.DepartmentCode == festival.DepartmentCode;
        var fuenteHistorica = await db.EntitySourceRecords.AsNoTracking().AnyAsync(item => item.EntityId == organizacion.Id && item.SourceTable == "Festivales" && item.SourceRecordId == festival.Id, ct);
        if (!nombreCoincide && !((municipioCoincide || departamentoCoincide) && fuenteHistorica)) return null;

        var evidencias = new List<string>();
        if (nombreCoincide) evidencias.Add("El organizador histórico coincide con el nombre de tu organización.");
        if (municipioCoincide) evidencias.Add("La organización y el Festival están registrados en el mismo municipio.");
        else if (departamentoCoincide) evidencias.Add("La organización y el Festival están registrados en el mismo departamento.");
        if (fuenteHistorica) evidencias.Add("Existe una referencia histórica de esta organización para el Festival.");
        return evidencias;
    }

    private static async Task<SolicitudAdministracionFestivalDto> CrearDtoAsync(SolicitudAdministracionFestivalRow row, PnmcDbContext db, CancellationToken ct)
    {
        var festival = await db.FestivalRecords.AsNoTracking().Where(item => item.Id == row.FestivalId).Select(item => item.Name).FirstOrDefaultAsync(ct) ?? "Festival no disponible";
        var organizacion = await db.EntityProfiles.AsNoTracking().Where(item => item.Id == row.OrganizacionId).Select(item => item.Name).FirstOrDefaultAsync(ct) ?? "Organización no disponible";
        var persona = await db.Users.AsNoTracking().Where(item => item.Id == row.PersonaSolicitanteId).Select(item => item.FullName).FirstOrDefaultAsync(ct) ?? "Persona no disponible";
        var evidencias = JsonSerializer.Deserialize<List<string>>(row.EvidenciaAutomaticaJson) ?? [];
        return new SolicitudAdministracionFestivalDto(row.Id.ToString(CultureInfo.InvariantCulture), row.FestivalId.ToString(CultureInfo.InvariantCulture), festival,
            row.OrganizacionId.ToString(CultureInfo.InvariantCulture), organizacion, row.PersonaSolicitanteId.ToString(CultureInfo.InvariantCulture), persona,
            row.Justificacion, evidencias, row.Estado, row.RespuestaSolicitante, row.ComentarioDecision, row.FechaCreacion, row.FechaActualizacion, row.FechaDecision);
    }

    private static async Task CrearNotificacionesInstitucionalesAsync(PnmcDbContext db, FestivalRow festival, EntityProfileRow organizacion, DateTime ahora, CancellationToken ct)
    {
        var destinatarios = await db.Users.AsNoTracking().Join(db.Roles.AsNoTracking(), usuario => usuario.RoleId, rol => rol.Id, (usuario, rol) => new { usuario, rol.Name })
            .Where(item => item.usuario.IsActive && (item.Name == "webmaster" || item.Name == "gestor_interno")).Select(item => item.usuario).ToListAsync(ct);
        foreach (var destinatario in destinatarios)
            db.Notifications.Add(new NotificationRow { RecipientUserId = destinatario.Id, RecipientEmail = destinatario.Email, EventType = "SolicitudAdministracionFestivalRecibida", Channel = "internal", Title = "Nueva solicitud de administración", Body = $"{organizacion.Name} solicitó administrar el Festival “{festival.Name}”.", Status = "enviada", ModuleId = Modulo, RecordId = festival.Id.ToString(CultureInfo.InvariantCulture), CreatedAt = ahora, SentAt = ahora });
    }

    private static async Task CrearNotificacionSolicitanteAsync(PnmcDbContext db, SolicitudAdministracionFestivalRow solicitud, FestivalRow festival, string evento, DateTime ahora, CancellationToken ct)
    {
        var destinatario = await db.Users.AsNoTracking().FirstOrDefaultAsync(item => item.Id == solicitud.PersonaSolicitanteId && item.IsActive, ct);
        if (destinatario is null) return;
        var (titulo, cuerpo) = evento switch
        {
            "SolicitudAdministracionFestivalAprobada" => ("Solicitud de administración aprobada", $"Tu organización ahora puede administrar el Festival “{festival.Name}”."),
            "SolicitudAdministracionFestivalRechazada" => ("Solicitud de administración rechazada", $"SIMUS rechazó la solicitud para administrar el Festival “{festival.Name}”."),
            _ => ("SIMUS solicita información adicional", $"SIMUS requiere información adicional sobre la solicitud para administrar el Festival “{festival.Name}”.")
        };
        db.Notifications.Add(new NotificationRow { RecipientUserId = destinatario.Id, RecipientEmail = destinatario.Email, EventType = evento, Channel = "internal", Title = titulo, Body = cuerpo, Status = "enviada", ModuleId = Modulo, RecordId = solicitud.Id.ToString(CultureInfo.InvariantCulture), CreatedAt = ahora, SentAt = ahora });
    }

    private static async Task<bool> PuedeAdministrarOrganizacionAsync(PnmcDbContext db, int personaId, int organizacionId, CancellationToken ct) =>
        await db.UserEntities.AsNoTracking().AnyAsync(item => item.UserId == personaId && item.EntityId == organizacionId && item.EntityRole == "administrador" && item.IsActive, ct);

    private static bool PuedeDecidir(ClaimsPrincipal principal) => principal.IsInRole("webmaster") || principal.IsInRole("gestor_interno");
    private static int? ObtenerPersonaId(ClaimsPrincipal principal) => int.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
    private static Task<bool> ValidarAntiforgeryAsync(IAntiforgery antiforgery, HttpContext context) => antiforgery.IsRequestValidAsync(context);

    private static string NormalizarNombre(string? value)
    {
        var normalized = (value ?? string.Empty).Trim().ToLowerInvariant().Normalize(System.Text.NormalizationForm.FormD);
        var builder = new System.Text.StringBuilder(normalized.Length);
        foreach (var character in normalized)
            if (System.Globalization.CharUnicodeInfo.GetUnicodeCategory(character) != System.Globalization.UnicodeCategory.NonSpacingMark && (char.IsLetterOrDigit(character) || char.IsWhiteSpace(character))) builder.Append(character);
        return string.Join(' ', builder.ToString().Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }
}
