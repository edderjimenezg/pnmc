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

        publico.MapGet("", async (
            PnmcDbContext dbContext, int? limit, int? offset, string? busqueda,
            string? departamento, string? municipio, int? practicaMusicalId,
            int? territorioSonoroId, string? periodicidad, string? nivelCobertura,
            CancellationToken cancellationToken) =>
        {
            var festivales = await LecturaFestivalesPublicados.ConsultarAsync(dbContext, cancellationToken);
            var resultados = await CrearDtosAsync(festivales.OrderBy(item => item.Nombre).ToList(), dbContext, cancellationToken);
            return Results.Ok(Paginar(AplicarFiltros(resultados, busqueda, departamento, municipio, practicaMusicalId, territorioSonoroId, periodicidad, nivelCobertura), limit, offset));
        });

        publico.MapGet("/filtros", async (PnmcDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var festivales = await LecturaFestivalesPublicados.ConsultarAsync(dbContext, cancellationToken);
            return Results.Ok(CrearFiltros(await CrearDtosAsync(festivales, dbContext, cancellationToken)));
        });

        publico.MapGet("/{festivalId:int}", async (int festivalId, PnmcDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var festival = (await LecturaFestivalesPublicados.ConsultarAsync(dbContext, cancellationToken))
                .FirstOrDefault(item => item.Festival.Id == festivalId);
            if (festival is null) return Results.NotFound();

            var resultado = await CrearDtosAsync([festival], dbContext, cancellationToken);
            return Results.Ok(resultado[0]);
        });

        return group;
    }

    private static async Task<List<FestivalPublicoDto>> CrearDtosAsync(
        IReadOnlyList<FestivalPublicadoVigenteLectura> festivales,
        PnmcDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var organizacionesIds = festivales.Where(item => item.Festival.OrganizacionPrincipalId.HasValue)
            .Select(item => item.Festival.OrganizacionPrincipalId!.Value).Distinct().ToArray();
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
        return festivales.Select(festival =>
        {
            return new FestivalPublicoDto(
            festival.Festival.Id.ToString(CultureInfo.InvariantCulture), festival.Nombre, Limpiar(festival.Descripcion),
            festival.Festival.OrganizacionPrincipalId is int organizacionId && organizaciones.TryGetValue(organizacionId, out var organizacion)
                ? organizacion : Limpiar(festival.Festival.OrganizerDisplayName),
            new TerritorioPrincipalPublicoDto(
                ResolverNombre(festival.CodigoDepartamento, departamentos), ResolverNombre(festival.CodigoMunicipio, municipios), festival.NivelCobertura),
            Limpiar(festival.Periodicidad), festival.PracticasMusicales, festival.TerritoriosSonoros, Limpiar(festival.CorreoContacto));
        }).ToList();
    }

    private static string? ResolverNombre(string? codigo, IReadOnlyDictionary<string, string> valores) =>
        string.IsNullOrWhiteSpace(codigo) ? null : valores.TryGetValue(codigo, out var nombre) ? nombre : codigo;

    private static string? Limpiar(string? valor) => string.IsNullOrWhiteSpace(valor) ? null : valor;

    private static List<FestivalPublicoDto> AplicarFiltros(
        IEnumerable<FestivalPublicoDto> festivales,
        string? busqueda,
        string? departamento,
        string? municipio,
        int? practicaMusicalId,
        int? territorioSonoroId,
        string? periodicidad,
        string? nivelCobertura)
    {
        var consulta = festivales;
        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var termino = busqueda.Trim();
            consulta = consulta.Where(festival => string.Join(' ', new[]
            {
                festival.Nombre, festival.OrganizacionResponsable, festival.TerritorioPrincipal.Departamento,
                festival.TerritorioPrincipal.Municipio, festival.Periodicidad,
                string.Join(' ', festival.PracticasMusicales.Select(item => item.Nombre)),
                string.Join(' ', festival.TerritoriosSonoros.Select(item => item.Nombre))
            }.Where(item => !string.IsNullOrWhiteSpace(item))).Contains(termino, StringComparison.OrdinalIgnoreCase));
        }
        if (!string.IsNullOrWhiteSpace(departamento)) consulta = consulta.Where(item => string.Equals(item.TerritorioPrincipal.Departamento, departamento, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(municipio)) consulta = consulta.Where(item => string.Equals(item.TerritorioPrincipal.Municipio, municipio, StringComparison.OrdinalIgnoreCase));
        if (practicaMusicalId.HasValue) consulta = consulta.Where(item => item.PracticasMusicales.Any(practica => practica.Id == practicaMusicalId.Value));
        if (territorioSonoroId.HasValue) consulta = consulta.Where(item => item.TerritoriosSonoros.Any(territorio => territorio.Id == territorioSonoroId.Value));
        if (!string.IsNullOrWhiteSpace(periodicidad)) consulta = consulta.Where(item => string.Equals(item.Periodicidad, periodicidad, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(nivelCobertura)) consulta = consulta.Where(item => string.Equals(item.TerritorioPrincipal.NivelCobertura, nivelCobertura, StringComparison.OrdinalIgnoreCase));
        return consulta.OrderBy(item => item.Nombre, StringComparer.CurrentCultureIgnoreCase).ToList();
    }

    private static FiltrosFestivalesPublicosDto CrearFiltros(IEnumerable<FestivalPublicoDto> festivales)
    {
        var items = festivales.ToList();
        return new FiltrosFestivalesPublicosDto(
            items.Select(item => item.TerritorioPrincipal.Departamento).Where(item => !string.IsNullOrWhiteSpace(item)).Cast<string>().Distinct().Order().ToList(),
            items.Where(item => !string.IsNullOrWhiteSpace(item.TerritorioPrincipal.Departamento) && !string.IsNullOrWhiteSpace(item.TerritorioPrincipal.Municipio))
                .Select(item => new MunicipioFestivalPublicoDto(item.TerritorioPrincipal.Departamento!, item.TerritorioPrincipal.Municipio!)).Distinct().OrderBy(item => item.Departamento).ThenBy(item => item.Municipio).ToList(),
            items.SelectMany(item => item.PracticasMusicales).DistinctBy(item => item.Id).OrderBy(item => item.Nombre).ToList(),
            items.SelectMany(item => item.TerritoriosSonoros).DistinctBy(item => item.Id).OrderBy(item => item.Nombre).ToList(),
            items.Select(item => item.Periodicidad).Where(item => !string.IsNullOrWhiteSpace(item)).Cast<string>().Distinct().Order().ToList(),
            items.Select(item => item.TerritorioPrincipal.NivelCobertura).Where(item => !string.IsNullOrWhiteSpace(item)).Distinct().Order().ToList());
    }

    private static PagedResponse<T> Paginar<T>(IReadOnlyList<T> items, int? limit, int? offset)
    {
        var limite = Math.Clamp(limit ?? 100, 1, 500);
        var desde = Math.Max(offset ?? 0, 0);
        return new PagedResponse<T>(items.Skip(desde).Take(limite).ToList(), limite, desde, items.Count);
    }
}
