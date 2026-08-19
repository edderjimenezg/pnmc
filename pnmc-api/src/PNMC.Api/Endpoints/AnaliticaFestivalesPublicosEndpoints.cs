using PNMC.Contracts;
using PNMC.Infrastructure.Data;

namespace PNMC.Api.Endpoints;

public static class AnaliticaFestivalesPublicosEndpoints
{
    public static RouteGroupBuilder MapAnaliticaFestivalesPublicosEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/publico/analitica/festivales/resumen", async (PnmcDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var festivales = await LecturaFestivalesPublicados.ConsultarAsync(dbContext, cancellationToken);
            IReadOnlyList<DistribucionAnaliticaFestivalDto> Distribuir(IEnumerable<string?> valores) => valores.Where(item => !string.IsNullOrWhiteSpace(item))
                .GroupBy(item => item!.Trim()).Select(item => new DistribucionAnaliticaFestivalDto(item.Key, item.Count())).OrderByDescending(item => item.Total).ThenBy(item => item.Nombre).ToList();
            return Results.Ok(new ResumenAnaliticoFestivalesDto(
                festivales.Count,
                Distribuir(festivales.Select(item => item.CodigoDepartamento)),
                Distribuir(festivales.Select(item => item.CodigoMunicipio)),
                Distribuir(festivales.SelectMany(item => item.PracticasMusicales.Select(practica => practica.Nombre))),
                Distribuir(festivales.SelectMany(item => item.TerritoriosSonoros.Select(territorio => territorio.Nombre))),
                Distribuir(festivales.Select(item => item.Periodicidad))));
        }).WithTags("analitica-festivales");
        return group;
    }
}
