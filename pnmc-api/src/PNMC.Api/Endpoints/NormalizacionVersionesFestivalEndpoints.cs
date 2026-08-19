using Microsoft.AspNetCore.Antiforgery;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using PNMC.Api.Security;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class NormalizacionVersionesFestivalEndpoints
{
    public static RouteGroupBuilder MapNormalizacionVersionesFestivalEndpoints(this RouteGroupBuilder group)
    {
        var institucional = group.MapGroup("/institucional/festivales").WithTags("normalizacion-versiones-festival");
        institucional.RequireAuthorization(SimusAuthentication.InstitutionalPolicy);
        institucional.MapGet("/diagnostico-normalizacion-versiones-historicas", async (PnmcDbContext db, CancellationToken ct) =>
        {
            var candidatos = await ConsultarCandidatosPublicosAsync(db, ct);
            var vigentes = await db.VersionesFestival.AsNoTracking()
                .Where(item => item.EsVigente)
                .Select(item => item.FestivalOrigenId)
                .ToListAsync(ct);
            var pendientes = candidatos.Where(item => !vigentes.Contains(item.Id)).OrderBy(item => item.Id).ToList();
            var idsPendientes = pendientes.Select(item => item.Id).ToArray();
            var conPracticas = await db.FestivalesPracticasMusicales.AsNoTracking()
                .Where(item => idsPendientes.Contains(item.FestivalId))
                .Select(item => item.FestivalId)
                .Distinct()
                .ToListAsync(ct);
            var conTerritorios = await db.FestivalesTerritoriosSonoros.AsNoTracking()
                .Where(item => idsPendientes.Contains(item.FestivalId))
                .Select(item => item.FestivalId)
                .Distinct()
                .ToListAsync(ct);
            return Results.Ok(new
            {
                totalFestivalesPublicos = candidatos.Count,
                conVersionVigente = vigentes.Count,
                pendientesNormalizacion = pendientes.Count,
                pendientes = pendientes.Select(item => new
                {
                    idFestival = item.Id,
                    nombre = item.Name,
                    estadoRegistro = item.StatusCode,
                    tienePracticasMusicales = conPracticas.Contains(item.Id),
                    tieneTerritoriosSonoros = conTerritorios.Contains(item.Id),
                    inconsistencias = ObtenerInconsistencias(item)
                })
            });
        });
        institucional.MapPost("/normalizar-versiones-historicas", async (PnmcDbContext db, IAntiforgery antiforgery, HttpContext context, CancellationToken ct) =>
        {
            try { await antiforgery.ValidateRequestAsync(context); }
            catch (AntiforgeryValidationException) { return Results.BadRequest(new { message = "La normalización no pudo validarse. Actualiza la página e inténtalo nuevamente." }); }
            var candidatos = await ConsultarCandidatosPublicosAsync(db, ct);
            var existentes = await db.VersionesFestival.AsNoTracking().Where(item => item.EsVigente).Select(item => item.FestivalOrigenId).ToListAsync(ct);
            var pendientes = candidatos.Where(item => !existentes.Contains(item.Id)).ToList();
            if (pendientes.Count == 0) return Results.Ok(new { normalizados = 0, message = "No hay Festivales públicos sin versión vigente." });
            await using var transaccion = await db.Database.BeginTransactionAsync(ct);
            var ahora = DateTime.UtcNow;
            var versiones = pendientes.Select(festival => new VersionFestivalRow
            {
                FestivalOrigenId = festival.Id, NumeroVersion = 1, EsVigente = true, Nombre = festival.Name,
                Descripcion = festival.Description, NivelCobertura = festival.CoverageLevel, CodigoDepartamento = festival.DepartmentCode,
                CodigoMunicipio = festival.MunicipalityCode, Periodicidad = festival.Periodicidad, CorreoContacto = festival.ContactEmail,
                FechaPublicacion = festival.UpdatedAt ?? festival.CreatedAt, FechaCreacion = ahora
            }).ToList();
            db.VersionesFestival.AddRange(versiones);
            await db.SaveChangesAsync(ct);
            var ids = pendientes.Select(item => item.Id).ToArray();
            var practicas = await db.FestivalesPracticasMusicales.AsNoTracking().Where(item => ids.Contains(item.FestivalId)).ToListAsync(ct);
            var territorios = await db.FestivalesTerritoriosSonoros.AsNoTracking().Where(item => ids.Contains(item.FestivalId)).ToListAsync(ct);
            var versionesPorFestival = versiones.ToDictionary(item => item.FestivalOrigenId, item => item.Id);
            db.VersionesFestivalPracticasMusicales.AddRange(practicas.Select(item => new VersionFestivalPracticaMusicalRow { VersionFestivalId = versionesPorFestival[item.FestivalId], PracticaMusicalId = item.PracticaMusicalId, FechaCreacion = ahora }));
            db.VersionesFestivalTerritoriosSonoros.AddRange(territorios.Select(item => new VersionFestivalTerritorioSonoroRow { VersionFestivalId = versionesPorFestival[item.FestivalId], TerritorioSonoroId = item.TerritorioSonoroId, FechaCreacion = ahora }));
            var personaInstitucionalId = ObtenerPersonaInstitucionalId(context.User);
            foreach (var festival in pendientes)
            {
                db.AuditLogs.Add(new AuditLogRow
                {
                    UserId = personaInstitucionalId,
                    TableName = "Festivales",
                    RecordId = festival.Id.ToString(),
                    Action = "FestivalHistoricoNormalizado",
                    PreviousValuesJson = null,
                    NewValuesJson = JsonSerializer.Serialize(new
                    {
                        versionFestivalId = versionesPorFestival[festival.Id],
                        numeroVersion = 1,
                        esVigente = true,
                        origen = "normalizacion-historica"
                    }),
                    CreatedAt = ahora
                });
            }
            await db.SaveChangesAsync(ct);
            await transaccion.CommitAsync(ct);
            return Results.Ok(new { normalizados = pendientes.Count, message = "Se crearon instantáneas técnicas de versiones públicas sin modificar estados institucionales." });
        });
        return group;
    }

    private static Task<List<FestivalRow>> ConsultarCandidatosPublicosAsync(PnmcDbContext db, CancellationToken ct) =>
        db.FestivalRecords.Where(item => item.StatusCode == null || item.StatusCode == "publicado" || item.StatusCode == "Publicado").ToListAsync(ct);

    private static int? ObtenerPersonaInstitucionalId(ClaimsPrincipal principal) =>
        int.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var personaId) ? personaId : null;

    private static IReadOnlyList<string> ObtenerInconsistencias(FestivalRow festival)
    {
        var inconsistencias = new List<string>();
        if (string.IsNullOrWhiteSpace(festival.Name)) inconsistencias.Add("Sin nombre.");
        if (string.IsNullOrWhiteSpace(festival.DepartmentCode)) inconsistencias.Add("Sin código DIVIPOLA de departamento.");
        return inconsistencias;
    }
}
