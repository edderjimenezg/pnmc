using Microsoft.EntityFrameworkCore;
using PNMC.Contracts;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public sealed record FestivalPublicadoVigenteLectura(
    FestivalRow Festival,
    VersionFestivalRow? Version,
    string Nombre,
    string? Descripcion,
    string NivelCobertura,
    string? CodigoDepartamento,
    string? CodigoMunicipio,
    string? Periodicidad,
    string? CorreoContacto,
    IReadOnlyList<CatalogoFestivalDto> PracticasMusicales,
    IReadOnlyList<CatalogoFestivalDto> TerritoriosSonoros,
    bool EsHistoricoSinVersion);

public static class LecturaFestivalesPublicados
{
    public static async Task<List<FestivalPublicadoVigenteLectura>> ConsultarAsync(PnmcDbContext dbContext, CancellationToken cancellationToken)
    {
        var festivales = await dbContext.FestivalRecords.AsNoTracking()
            .Where(item => item.StatusCode == null || item.StatusCode == "publicado" || item.StatusCode == "Publicado")
            .ToListAsync(cancellationToken);
        var ids = festivales.Select(item => item.Id).ToArray();
        var versiones = ids.Length == 0 ? [] : await dbContext.VersionesFestival.AsNoTracking()
            .Where(item => ids.Contains(item.FestivalOrigenId) && item.EsVigente)
            .ToDictionaryAsync(item => item.FestivalOrigenId, cancellationToken);
        var idsVersiones = versiones.Values.Select(item => item.Id).ToArray();
        var practicasVersionadas = idsVersiones.Length == 0 ? [] : await dbContext.VersionesFestivalPracticasMusicales.AsNoTracking()
            .Where(item => idsVersiones.Contains(item.VersionFestivalId))
            .Join(dbContext.PracticasMusicales.AsNoTracking(), relacion => relacion.PracticaMusicalId, practica => practica.Id,
                (relacion, practica) => new { relacion.VersionFestivalId, practica.Id, practica.Nombre }).ToListAsync(cancellationToken);
        var territoriosVersionados = idsVersiones.Length == 0 ? [] : await dbContext.VersionesFestivalTerritoriosSonoros.AsNoTracking()
            .Where(item => idsVersiones.Contains(item.VersionFestivalId))
            .Join(dbContext.TerritoriosSonoros.AsNoTracking(), relacion => relacion.TerritorioSonoroId, territorio => territorio.Id,
                (relacion, territorio) => new { relacion.VersionFestivalId, territorio.Id, territorio.Nombre }).ToListAsync(cancellationToken);
        var idsHistoricos = festivales.Where(item => !versiones.ContainsKey(item.Id)).Select(item => item.Id).ToArray();
        var practicasHistoricas = idsHistoricos.Length == 0 ? [] : await dbContext.FestivalesPracticasMusicales.AsNoTracking()
            .Where(item => idsHistoricos.Contains(item.FestivalId))
            .Join(dbContext.PracticasMusicales.AsNoTracking(), relacion => relacion.PracticaMusicalId, practica => practica.Id,
                (relacion, practica) => new { relacion.FestivalId, practica.Id, practica.Nombre }).ToListAsync(cancellationToken);
        var territoriosHistoricos = idsHistoricos.Length == 0 ? [] : await dbContext.FestivalesTerritoriosSonoros.AsNoTracking()
            .Where(item => idsHistoricos.Contains(item.FestivalId))
            .Join(dbContext.TerritoriosSonoros.AsNoTracking(), relacion => relacion.TerritorioSonoroId, territorio => territorio.Id,
                (relacion, territorio) => new { relacion.FestivalId, territorio.Id, territorio.Nombre }).ToListAsync(cancellationToken);

        return festivales.Select(festival =>
        {
            versiones.TryGetValue(festival.Id, out var version);
            var practicas = version is null
                ? practicasHistoricas.Where(item => item.FestivalId == festival.Id).Select(item => new CatalogoFestivalDto(item.Id, item.Nombre))
                : practicasVersionadas.Where(item => item.VersionFestivalId == version.Id).Select(item => new CatalogoFestivalDto(item.Id, item.Nombre));
            var territorios = version is null
                ? territoriosHistoricos.Where(item => item.FestivalId == festival.Id).Select(item => new CatalogoFestivalDto(item.Id, item.Nombre))
                : territoriosVersionados.Where(item => item.VersionFestivalId == version.Id).Select(item => new CatalogoFestivalDto(item.Id, item.Nombre));
            return new FestivalPublicadoVigenteLectura(
                festival, version, version?.Nombre ?? festival.Name, version?.Descripcion ?? festival.Description,
                version?.NivelCobertura ?? festival.CoverageLevel, version?.CodigoDepartamento ?? festival.DepartmentCode,
                version?.CodigoMunicipio ?? festival.MunicipalityCode, version?.Periodicidad ?? festival.Periodicidad,
                version?.CorreoContacto ?? festival.ContactEmail, practicas.OrderBy(item => item.Nombre).ToList(), territorios.OrderBy(item => item.Nombre).ToList(), version is null);
        }).ToList();
    }
}
