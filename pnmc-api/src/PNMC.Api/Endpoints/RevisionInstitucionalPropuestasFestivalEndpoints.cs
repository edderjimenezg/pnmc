using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.EntityFrameworkCore;
using PNMC.Api.Security;
using PNMC.Contracts;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class RevisionInstitucionalPropuestasFestivalEndpoints
{
    private const string Modulo = "propuestas-cambio-festival";

    public static RouteGroupBuilder MapRevisionInstitucionalPropuestasFestivalEndpoints(this RouteGroupBuilder group)
    {
        var institucional = group.MapGroup("/institucional/propuestas-cambio-festival").WithTags("revision-institucional-propuestas-festival");
        institucional.RequireAuthorization(SimusAuthentication.InstitutionalPolicy);

        institucional.MapGet("/csrf", (IAntiforgery antiforgery, HttpContext httpContext) =>
        {
            var tokens = antiforgery.GetAndStoreTokens(httpContext);
            return Results.Ok(new TokenAntiforgeryRespuesta(tokens.RequestToken ?? string.Empty));
        });

        institucional.MapGet("/en-revision", async (PnmcDbContext db, CancellationToken ct) =>
        {
            var propuestas = await db.PropuestasCambioFestival.AsNoTracking().Where(item => item.Estado == "EnRevision")
                .OrderBy(item => item.FechaEnvioRevision ?? item.FechaActualizacion).ToListAsync(ct);
            var festivales = await db.FestivalRecords.AsNoTracking().Where(item => propuestas.Select(p => p.FestivalOrigenId).Contains(item.Id))
                .ToDictionaryAsync(item => item.Id, item => item.Name, ct);
            var organizaciones = await db.EntityProfiles.AsNoTracking().Where(item => propuestas.Select(p => p.OrganizacionId).Contains(item.Id))
                .ToDictionaryAsync(item => item.Id, item => item.Name, ct);
            return Results.Ok(propuestas.Select(item => new PropuestaCambioFestivalRevisionDto(
                item.Id.ToString(CultureInfo.InvariantCulture), item.FestivalOrigenId.ToString(CultureInfo.InvariantCulture),
                festivales.GetValueOrDefault(item.FestivalOrigenId, "Festival no disponible"), organizaciones.GetValueOrDefault(item.OrganizacionId, "Organización no disponible"),
                item.Estado, item.FechaEnvioRevision)));
        });

        institucional.MapGet("/{propuestaId:int}", async (int propuestaId, PnmcDbContext db, CancellationToken ct) =>
        {
            var propuesta = await db.PropuestasCambioFestival.AsNoTracking().FirstOrDefaultAsync(item => item.Id == propuestaId, ct);
            if (propuesta is null) return Results.NotFound();
            var version = await db.VersionesFestival.AsNoTracking().FirstOrDefaultAsync(item => item.Id == propuesta.VersionOrigenId, ct);
            if (version is null) return Results.Conflict(new { message = "La versión de origen de la propuesta no está disponible." });
            var historial = await db.HistorialesRevisionRegistros.AsNoTracking().Where(item => item.ModuloId == Modulo && item.RegistroId == propuesta.Id.ToString())
                .OrderByDescending(item => item.Fecha).Select(item => new { item.EstadoAnterior, item.EstadoNuevo, item.Accion, item.Comentario, item.MotivoRechazo, item.Fecha }).ToListAsync(ct);
            return Results.Ok(new
            {
                propuesta = await CrearDetallePropuestaAsync(propuesta, db, ct),
                versionVigente = await CrearDetalleVersionAsync(version, db, ct),
                historial
            });
        });

        institucional.MapGet("/festivales/{festivalId:int}/versiones", async (int festivalId, PnmcDbContext db, CancellationToken ct) =>
        {
            var versiones = await db.VersionesFestival.AsNoTracking().Where(item => item.FestivalOrigenId == festivalId).OrderByDescending(item => item.NumeroVersion).ToListAsync(ct);
            return Results.Ok(versiones.Select(item => new VersionFestivalInstitucionalDto(item.Id.ToString(CultureInfo.InvariantCulture), item.NumeroVersion, item.EsVigente, item.Nombre, item.FechaPublicacion)));
        });

        institucional.MapPost("/{propuestaId:int}/decisiones", async (
            int propuestaId, DecisionRevisionFestivalSolicitud solicitud, ClaimsPrincipal principal, PnmcDbContext db,
            IAntiforgery antiforgery, HttpContext httpContext, CancellationToken ct) =>
        {
            if (!await ValidarAntiforgeryAsync(antiforgery, httpContext)) return Results.BadRequest(new { message = "La decisión institucional no pudo validarse. Actualiza la página e inténtalo nuevamente." });
            var personaId = ObtenerPersonaId(principal);
            if (personaId is null) return Results.Unauthorized();
            var propuesta = await db.PropuestasCambioFestival.FirstOrDefaultAsync(item => item.Id == propuestaId, ct);
            if (propuesta is null) return Results.NotFound();
            if (propuesta.Estado != "EnRevision") return Results.Conflict(new { message = "Solo una propuesta en revisión puede recibir una decisión institucional.", estado = propuesta.Estado });
            var decision = ResolverDecision(solicitud);
            if (decision.Errores.Count > 0) return Results.ValidationProblem(decision.Errores);
            var festival = await db.FestivalRecords.FirstOrDefaultAsync(item => item.Id == propuesta.FestivalOrigenId, ct);
            if (festival is null) return Results.Conflict(new { message = "El Festival de la propuesta no está disponible." });
            var ahora = DateTime.UtcNow;

            await using var transaccion = await db.Database.BeginTransactionAsync(ct);
            if (decision.EstadoNuevo == "Publicada")
            {
                var versionOrigen = await db.VersionesFestival.FirstOrDefaultAsync(item => item.Id == propuesta.VersionOrigenId, ct);
                if (versionOrigen is null || !versionOrigen.EsVigente)
                    return Results.Conflict(new { message = "La propuesta se basa en una versión que ya no está vigente. Crea una nueva propuesta desde la versión pública actual." });
                var nuevaVersion = new VersionFestivalRow
                {
                    FestivalOrigenId = propuesta.FestivalOrigenId, NumeroVersion = versionOrigen.NumeroVersion + 1, EsVigente = true,
                    Nombre = propuesta.Nombre, Descripcion = propuesta.Descripcion, NivelCobertura = propuesta.NivelCobertura,
                    CodigoDepartamento = propuesta.CodigoDepartamento, CodigoMunicipio = propuesta.CodigoMunicipio,
                    Periodicidad = propuesta.Periodicidad, CorreoContacto = propuesta.CorreoContacto,
                    FechaPublicacion = ahora, FechaCreacion = ahora
                };
                versionOrigen.EsVigente = false;
                db.VersionesFestival.Add(nuevaVersion);
                try
                {
                    await db.SaveChangesAsync(ct);
                }
                catch (DbUpdateException)
                {
                    return Results.Conflict(new { message = "La propuesta no puede publicarse porque la versión vigente cambió. Revise la propuesta antes de intentarlo nuevamente." });
                }
                var practicas = await db.PropuestasCambioFestivalPracticasMusicales.AsNoTracking().Where(item => item.PropuestaCambioFestivalId == propuesta.Id).Select(item => item.PracticaMusicalId).ToListAsync(ct);
                var territorios = await db.PropuestasCambioFestivalTerritoriosSonoros.AsNoTracking().Where(item => item.PropuestaCambioFestivalId == propuesta.Id).Select(item => item.TerritorioSonoroId).ToListAsync(ct);
                db.VersionesFestivalPracticasMusicales.AddRange(practicas.Select(id => new VersionFestivalPracticaMusicalRow { VersionFestivalId = nuevaVersion.Id, PracticaMusicalId = id, FechaCreacion = ahora }));
                db.VersionesFestivalTerritoriosSonoros.AddRange(territorios.Select(id => new VersionFestivalTerritorioSonoroRow { VersionFestivalId = nuevaVersion.Id, TerritorioSonoroId = id, FechaCreacion = ahora }));
                propuesta.VersionNuevaId = nuevaVersion.Id;
            }

            propuesta.Estado = decision.EstadoNuevo!;
            propuesta.Activa = decision.EstadoNuevo == "AjustesSolicitados";
            propuesta.FechaActualizacion = ahora;
            db.HistorialesRevisionRegistros.Add(new HistorialRevisionRegistroRow
            {
                ModuloId = Modulo, RegistroId = propuesta.Id.ToString(CultureInfo.InvariantCulture), EstadoAnterior = "EnRevision", EstadoNuevo = decision.EstadoNuevo!,
                Accion = decision.Evento!, Comentario = decision.Observacion, MotivoRechazo = decision.MotivoRechazo, UsuarioId = personaId.Value, Fecha = ahora,
                MetadataJson = $"{{\"FestivalOrigenId\":{propuesta.FestivalOrigenId},\"VersionOrigenId\":{propuesta.VersionOrigenId},\"VersionNuevaId\":{(propuesta.VersionNuevaId?.ToString(CultureInfo.InvariantCulture) ?? "null")}}}"
            });
            db.AuditLogs.Add(new AuditLogRow
            {
                UserId = personaId.Value, TableName = "PropuestasCambioFestival", RecordId = propuesta.Id.ToString(CultureInfo.InvariantCulture), Action = decision.Evento!,
                PreviousValuesJson = "{\"Estado\":\"EnRevision\"}", NewValuesJson = $"{{\"Estado\":\"{decision.EstadoNuevo}\",\"FestivalOrigenId\":{propuesta.FestivalOrigenId}}}", CreatedAt = ahora
            });
            await CrearNotificacionDecisionAsync(db, propuesta, festival.Name, decision, ahora, ct);
            await db.SaveChangesAsync(ct);
            await transaccion.CommitAsync(ct);
            return Results.Ok(new { id = propuesta.Id, estado = propuesta.Estado, versionNuevaId = propuesta.VersionNuevaId, observacion = decision.Observacion ?? decision.MotivoRechazo });
        });
        return group;
    }

    private static async Task<object> CrearDetallePropuestaAsync(PropuestaCambioFestivalRow p, PnmcDbContext db, CancellationToken ct) => new { p.Id, p.FestivalOrigenId, p.VersionOrigenId, p.VersionNuevaId, p.Estado, p.Nombre, p.Descripcion, p.NivelCobertura, p.CodigoDepartamento, p.CodigoMunicipio, p.Periodicidad, p.CorreoContacto, p.FechaEnvioRevision, practicasMusicales = await CatalogosPropuestaAsync(db.PropuestasCambioFestivalPracticasMusicales.AsNoTracking().Where(x => x.PropuestaCambioFestivalId == p.Id).Select(x => x.PracticaMusicalId), db.PracticasMusicales, ct), territoriosSonoros = await CatalogosPropuestaAsync(db.PropuestasCambioFestivalTerritoriosSonoros.AsNoTracking().Where(x => x.PropuestaCambioFestivalId == p.Id).Select(x => x.TerritorioSonoroId), db.TerritoriosSonoros, ct) };
    private static async Task<object> CrearDetalleVersionAsync(VersionFestivalRow v, PnmcDbContext db, CancellationToken ct) => new { v.Id, v.NumeroVersion, v.EsVigente, v.Nombre, v.Descripcion, v.NivelCobertura, v.CodigoDepartamento, v.CodigoMunicipio, v.Periodicidad, v.CorreoContacto, v.FechaPublicacion, practicasMusicales = await CatalogosPropuestaAsync(db.VersionesFestivalPracticasMusicales.AsNoTracking().Where(x => x.VersionFestivalId == v.Id).Select(x => x.PracticaMusicalId), db.PracticasMusicales, ct), territoriosSonoros = await CatalogosPropuestaAsync(db.VersionesFestivalTerritoriosSonoros.AsNoTracking().Where(x => x.VersionFestivalId == v.Id).Select(x => x.TerritorioSonoroId), db.TerritoriosSonoros, ct) };
    private static async Task<List<CatalogoFestivalDto>> CatalogosPropuestaAsync(IQueryable<int> ids, DbSet<PracticaMusicalRow> catalogo, CancellationToken ct) => await catalogo.AsNoTracking().Where(item => ids.Contains(item.Id)).OrderBy(item => item.Nombre).Select(item => new CatalogoFestivalDto(item.Id, item.Nombre)).ToListAsync(ct);
    private static async Task<List<CatalogoFestivalDto>> CatalogosPropuestaAsync(IQueryable<int> ids, DbSet<TerritorioSonoroRow> catalogo, CancellationToken ct) => await catalogo.AsNoTracking().Where(item => ids.Contains(item.Id)).OrderBy(item => item.Nombre).Select(item => new CatalogoFestivalDto(item.Id, item.Nombre)).ToListAsync(ct);

    private static (string? EstadoNuevo, string? Evento, string? Observacion, string? MotivoRechazo, Dictionary<string, string[]> Errores) ResolverDecision(DecisionRevisionFestivalSolicitud s)
    {
        var accion = s.Accion?.Trim(); var observacion = Limpiar(s.Observacion); var motivo = Limpiar(s.MotivoRechazo);
        return accion switch
        {
            "SolicitarAjustes" when string.IsNullOrWhiteSpace(observacion) => (null, null, null, null, new() { ["observacion"] = ["La observación es obligatoria para solicitar ajustes."] }),
            "SolicitarAjustes" => ("AjustesSolicitados", "FestivalPropuestaAjustesSolicitados", observacion, null, new()),
            "Rechazar" when string.IsNullOrWhiteSpace(motivo) => (null, null, null, null, new() { ["motivoRechazo"] = ["El motivo es obligatorio para rechazar la propuesta."] }),
            "Rechazar" => ("Rechazada", "FestivalPropuestaRechazada", null, motivo, new()),
            "Publicar" => ("Publicada", "FestivalPropuestaPublicada", null, null, new()),
            _ => (null, null, null, null, new() { ["accion"] = ["La acción institucional no es válida."] })
        };
    }
    private static async Task CrearNotificacionDecisionAsync(PnmcDbContext db, PropuestaCambioFestivalRow p, string festival, (string? EstadoNuevo, string? Evento, string? Observacion, string? MotivoRechazo, Dictionary<string, string[]> Errores) d, DateTime fecha, CancellationToken ct)
    {
        var persona = await db.Users.AsNoTracking().FirstOrDefaultAsync(item => item.Id == p.PersonaProponenteId && item.IsActive, ct); if (persona is null) return;
        var texto = d.EstadoNuevo switch { "AjustesSolicitados" => $"SIMUS solicitó ajustes para tu propuesta sobre “{festival}”. {d.Observacion}", "Rechazada" => $"SIMUS rechazó tu propuesta sobre “{festival}”. Motivo: {d.MotivoRechazo}", _ => $"Tu propuesta de cambios para “{festival}” fue publicada como una nueva versión." };
        db.Notifications.Add(new NotificationRow { RecipientUserId = persona.Id, RecipientEmail = persona.Email, EventType = d.Evento!, Channel = "internal", Title = d.EstadoNuevo == "Publicada" ? "Propuesta publicada" : "Actualización de propuesta", Body = texto, Status = "enviada", ModuleId = Modulo, RecordId = p.Id.ToString(CultureInfo.InvariantCulture), MetadataJson = $"{{\"FestivalOrigenId\":{p.FestivalOrigenId},\"Estado\":\"{d.EstadoNuevo}\"}}", CreatedAt = fecha, SentAt = fecha, Attempts = 0 });
    }
    private static int? ObtenerPersonaId(ClaimsPrincipal p) => int.TryParse(p.FindFirstValue(ClaimTypes.NameIdentifier), NumberStyles.Integer, CultureInfo.InvariantCulture, out var id) ? id : null;
    private static async Task<bool> ValidarAntiforgeryAsync(IAntiforgery a, HttpContext c) { try { await a.ValidateRequestAsync(c); return true; } catch (AntiforgeryValidationException) { return false; } }
    private static string? Limpiar(string? texto) => string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();
}
