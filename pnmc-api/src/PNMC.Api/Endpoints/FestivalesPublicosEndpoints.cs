using System.Globalization;
using Microsoft.EntityFrameworkCore;
using PNMC.Contracts;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class FestivalesPublicosEndpoints
{
    public static RouteGroupBuilder MapFestivalesPublicosEndpoints(this RouteGroupBuilder group)
    {
        var publico = group.MapGroup("/publico/festivales").WithTags("festivales-publicos");

        publico.MapGet("", async (PnmcDbContext dbContext, int? limit, int? offset, CancellationToken cancellationToken) =>
        {
            var festivales = await ConsultarFestivalesPublicos(dbContext)
                .OrderBy(item => item.Name)
                .ToListAsync(cancellationToken);
            var resultados = await CrearDtosAsync(festivales, dbContext, cancellationToken);
            return Results.Ok(Paginar(resultados, limit, offset));
        });

        publico.MapGet("/{festivalId:int}", async (int festivalId, PnmcDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var festival = await ConsultarFestivalesPublicos(dbContext)
                .FirstOrDefaultAsync(item => item.Id == festivalId, cancellationToken);
            if (festival is null) return Results.NotFound();

            var resultado = await CrearDtosAsync([festival], dbContext, cancellationToken);
            return Results.Ok(resultado[0]);
        });

        return group;
    }

    private static IQueryable<FestivalRow> ConsultarFestivalesPublicos(PnmcDbContext dbContext) =>
        dbContext.FestivalRecords.AsNoTracking().Where(item =>
            item.StatusCode == null ||
            (item.StatusCode != "Borrador" && item.StatusCode != "EnRevision" && item.StatusCode != "AjustesSolicitados" && item.StatusCode != "Rechazado"));

    private static async Task<List<FestivalPublicoDto>> CrearDtosAsync(
        IReadOnlyList<FestivalRow> festivales,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var ids = festivales.Select(item => item.Id).ToArray();
        var organizacionesIds = festivales.Where(item => item.OrganizacionPrincipalId.HasValue)
            .Select(item => item.OrganizacionPrincipalId!.Value).Distinct().ToArray();
        var organizaciones = organizacionesIds.Length == 0
            ? new Dictionary<int, string>()
            : await dbContext.EntityProfiles.AsNoTracking()
                .Where(item => organizacionesIds.Contains(item.Id))
                .ToDictionaryAsync(item => item.Id, item => item.Name, cancellationToken);
        var departamentos = await dbContext.DivipolaLocations.AsNoTracking()
            .GroupBy(item => item.DepartmentCode)
            .Select(group => new { Codigo = group.Key, Nombre = group.First().DepartmentName })
            .ToDictionaryAsync(item => item.Codigo, item => item.Nombre, cancellationToken);
        var municipios = await dbContext.DivipolaLocations.AsNoTracking()
            .ToDictionaryAsync(item => item.MunicipalityCode, item => item.MunicipalityName, cancellationToken);
        var versiones = await dbContext.VersionesFestival.AsNoTracking()
            .Where(item => ids.Contains(item.FestivalOrigenId) && item.EsVigente)
            .ToDictionaryAsync(item => item.FestivalOrigenId, cancellationToken);
        var idsVersiones = versiones.Values.Select(item => item.Id).ToArray();
        var practicasVigentes = await dbContext.FestivalesPracticasMusicales.AsNoTracking()
            .Where(item => ids.Contains(item.FestivalId))
            .Join(dbContext.PracticasMusicales.AsNoTracking(), relacion => relacion.PracticaMusicalId, practica => practica.Id,
                (relacion, practica) => new { relacion.FestivalId, practica.Id, practica.Nombre })
            .ToListAsync(cancellationToken);
        var territoriosVigentes = await dbContext.FestivalesTerritoriosSonoros.AsNoTracking()
            .Where(item => ids.Contains(item.FestivalId))
            .Join(dbContext.TerritoriosSonoros.AsNoTracking(), relacion => relacion.TerritorioSonoroId, territorio => territorio.Id,
                (relacion, territorio) => new { relacion.FestivalId, territorio.Id, territorio.Nombre })
            .ToListAsync(cancellationToken);
        var practicasVersionadas = idsVersiones.Length == 0 ? [] : await dbContext.VersionesFestivalPracticasMusicales.AsNoTracking()
            .Where(item => idsVersiones.Contains(item.VersionFestivalId))
            .Join(dbContext.PracticasMusicales.AsNoTracking(), relacion => relacion.PracticaMusicalId, practica => practica.Id,
                (relacion, practica) => new { relacion.VersionFestivalId, practica.Id, practica.Nombre })
            .ToListAsync(cancellationToken);
        var territoriosVersionados = idsVersiones.Length == 0 ? [] : await dbContext.VersionesFestivalTerritoriosSonoros.AsNoTracking()
            .Where(item => idsVersiones.Contains(item.VersionFestivalId))
            .Join(dbContext.TerritoriosSonoros.AsNoTracking(), relacion => relacion.TerritorioSonoroId, territorio => territorio.Id,
                (relacion, territorio) => new { relacion.VersionFestivalId, territorio.Id, territorio.Nombre })
            .ToListAsync(cancellationToken);

        return festivales.Select(festival =>
        {
            versiones.TryGetValue(festival.Id, out var version);
            IEnumerable<CatalogoFestivalDto> practicas = version is null
                ? practicasVigentes.Where(item => item.FestivalId == festival.Id).Select(item => new CatalogoFestivalDto(item.Id, item.Nombre))
                : practicasVersionadas.Where(item => item.VersionFestivalId == version.Id).Select(item => new CatalogoFestivalDto(item.Id, item.Nombre));
            IEnumerable<CatalogoFestivalDto> territorios = version is null
                ? territoriosVigentes.Where(item => item.FestivalId == festival.Id).Select(item => new CatalogoFestivalDto(item.Id, item.Nombre))
                : territoriosVersionados.Where(item => item.VersionFestivalId == version.Id).Select(item => new CatalogoFestivalDto(item.Id, item.Nombre));
            return new FestivalPublicoDto(
            festival.Id.ToString(CultureInfo.InvariantCulture),
            version?.Nombre ?? festival.Name,
            Limpiar(version?.Descripcion ?? festival.Description),
            festival.OrganizacionPrincipalId is int organizacionId && organizaciones.TryGetValue(organizacionId, out var organizacion)
                ? organizacion : Limpiar(festival.OrganizerDisplayName),
            new TerritorioPrincipalPublicoDto(
                ResolverNombre(version?.CodigoDepartamento ?? festival.DepartmentCode, departamentos),
                ResolverNombre(version?.CodigoMunicipio ?? festival.MunicipalityCode, municipios),
                version?.NivelCobertura ?? festival.CoverageLevel),
            Limpiar(version?.Periodicidad ?? festival.Periodicidad),
            practicas.OrderBy(item => item.Nombre).ToList(),
            territorios.OrderBy(item => item.Nombre).ToList(),
            Limpiar(version?.CorreoContacto ?? festival.ContactEmail));
        }).ToList();
    }

    private static string? ResolverNombre(string? codigo, IReadOnlyDictionary<string, string> valores) =>
        string.IsNullOrWhiteSpace(codigo) ? null : valores.TryGetValue(codigo, out var nombre) ? nombre : codigo;

    private static string? Limpiar(string? valor) => string.IsNullOrWhiteSpace(valor) ? null : valor;

    private static PagedResponse<T> Paginar<T>(IReadOnlyList<T> items, int? limit, int? offset)
    {
        var limite = Math.Clamp(limit ?? 100, 1, 500);
        var desde = Math.Max(offset ?? 0, 0);
        return new PagedResponse<T>(items.Skip(desde).Take(limite).ToList(), limite, desde, items.Count);
    }
}
