using PNMC.Contracts;
using PNMC.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace PNMC.Api.Endpoints;

public static class AnaliticaFestivalesPublicosEndpoints
{
    public static RouteGroupBuilder MapAnaliticaFestivalesPublicosEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/publico/analitica/festivales/resumen", async (PnmcDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var festivales = await LecturaFestivalesPublicados.ConsultarAsync(dbContext, cancellationToken);
            var ubicaciones = await dbContext.DivipolaLocations.AsNoTracking().ToListAsync(cancellationToken);
            var departamentos = ubicaciones.GroupBy(item => item.DepartmentCode)
                .ToDictionary(item => item.Key, item => item.First().DepartmentName);
            var municipios = ubicaciones.GroupBy(item => item.MunicipalityCode)
                .ToDictionary(item => item.Key, item => item.First().MunicipalityName);
            IReadOnlyList<DistribucionAnaliticaFestivalDto> Distribuir(IEnumerable<string?> valores) => valores.Where(item => !string.IsNullOrWhiteSpace(item))
                .GroupBy(item => item!.Trim()).Select(item => new DistribucionAnaliticaFestivalDto(item.Key, item.Count())).OrderByDescending(item => item.Total).ThenBy(item => item.Nombre).ToList();
            return Results.Ok(new ResumenAnaliticoFestivalesDto(
                festivales.Count,
                Distribuir(festivales.Select(item => departamentos.TryGetValue(item.CodigoDepartamento ?? string.Empty, out var nombre) ? nombre : item.CodigoDepartamento)),
                Distribuir(festivales.Select(item => municipios.TryGetValue(item.CodigoMunicipio ?? string.Empty, out var nombre) ? nombre : item.CodigoMunicipio)),
                Distribuir(festivales.SelectMany(item => item.PracticasMusicales.Select(practica => practica.Nombre))),
                Distribuir(festivales.SelectMany(item => item.TerritoriosSonoros.Select(territorio => territorio.Nombre))),
                Distribuir(festivales.Select(item => item.Periodicidad))));
        }).WithTags("analitica-festivales");
        return group;
    }
}
