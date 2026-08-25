/*
    SIMUS - Muestra piloto demostrativa del Ecosistema Musical.

    Uso exclusivo: desarrollo/local. Es aditiva e idempotente.
    No elimina, modifica ni amplía catálogos maestros.
    Para retirar únicamente esta muestra usar V20260824_03__reversion_muestra_piloto_ecosistema_demo.sql.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;

BEGIN TRANSACTION;

DECLARE @CodigoSemilla nvarchar(120) = N'ecosistema-demo-piloto-20260824';
DECLARE @Ahora datetime2(0) = SYSUTCDATETIME();
DECLARE @UsuarioSistema int = (SELECT TOP (1) IdUsuario FROM dbo.Usuarios WHERE CorreoElectronico = N'sistema@pnmc.local' ORDER BY IdUsuario);
DECLARE @EstadoPublicado nvarchar(80) = N'publicado';
DECLARE @IdEstadoPublicado int = (SELECT TOP (1) IdEstadoContenido FROM dbo.EstadosContenido WHERE CodigoEstado = @EstadoPublicado);
DECLARE @CategoriaAgenda int = (SELECT TOP (1) IdCategoria FROM dbo.Categorias WHERE CodigoModulo = N'agenda' ORDER BY OrdenVisualizacion);
DECLARE @CategoriaNoticias int = (SELECT TOP (1) IdCategoria FROM dbo.Categorias WHERE CodigoModulo = N'noticias' ORDER BY OrdenVisualizacion);

IF @UsuarioSistema IS NULL OR @IdEstadoPublicado IS NULL OR @CategoriaAgenda IS NULL OR @CategoriaNoticias IS NULL
    THROW 52800, 'La muestra demo necesita usuario de sistema, estado publicado y categorías de agenda/noticias.', 1;

IF OBJECT_ID(N'dbo.SemillasDatosDemo', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SemillasDatosDemo
    (
        CodigoSemilla nvarchar(120) NOT NULL,
        TablaOrigen nvarchar(120) NOT NULL,
        IdRegistro int NOT NULL,
        FechaRegistro datetime2(0) NOT NULL CONSTRAINT DF_SemillasDatosDemo_FechaRegistro DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_SemillasDatosDemo PRIMARY KEY (CodigoSemilla, TablaOrigen, IdRegistro)
    );
END;

DECLARE @Organizaciones TABLE
(
    Codigo nvarchar(40) NOT NULL PRIMARY KEY,
    Nombre nvarchar(240) NOT NULL,
    TipoEntidad nvarchar(80) NOT NULL,
    CodigoDepartamento char(2) NOT NULL,
    CodigoMunicipio char(5) NOT NULL,
    SitioWeb nvarchar(500) NULL,
    IdEntidad int NULL
);

INSERT INTO @Organizaciones (Codigo, Nombre, TipoEntidad, CodigoDepartamento, CodigoMunicipio, SitioWeb)
VALUES
    (N'FMC', N'Fundación Musical de Colombia', N'organizacion', '73', '73001', NULL),
    (N'ALCALI', N'Alcaldía Distrital de Santiago de Cali', N'organizacion', '76', '76001', N'https://www.cali.gov.co'),
    (N'FUNVALL', N'Fundación Festival de la Leyenda Vallenata', N'organizacion', '20', '20001', N'https://festivalvallenato.com'),
    (N'FUNMUSICA', N'Fundación Pro Música Nacional de Ginebra - FUNMÚSICA', N'organizacion', '76', '76306', N'https://funmusica.org'),
    (N'CCB', N'Cámara de Comercio de Bogotá', N'organizacion', '11', '11001', N'https://www.ccb.org.co'),
    (N'REDLAT', N'Redlat Colombia', N'organizacion', '05', '05001', N'https://circulart.org'),
    (N'SCCMED', N'Secretaría de Cultura Ciudadana de Medellín', N'organizacion', '05', '05001', N'https://www.medellin.gov.co');

INSERT INTO dbo.Entidades
    (TipoEntidad, Nombre, Descripcion, SitioWeb, NivelCobertura, CodigoDepartamento, CodigoMunicipio, EstadoRegistro, Activo, IdUsuarioCreador, FechaCreacion, FechaActualizacion, FechaPublicacion)
SELECT o.TipoEntidad, o.Nombre,
       N'Registro demostrativo local basado en una referencia pública. No constituye un directorio institucional ni acredita administración real en SIMUS.',
       o.SitioWeb, N'municipal', o.CodigoDepartamento, o.CodigoMunicipio, N'publicado', 1, @UsuarioSistema, @Ahora, @Ahora, @Ahora
FROM @Organizaciones o
WHERE NOT EXISTS (SELECT 1 FROM dbo.Entidades e WHERE e.Nombre = o.Nombre);

UPDATE o SET IdEntidad = e.IdEntidad
FROM @Organizaciones o
INNER JOIN dbo.Entidades e ON e.Nombre = o.Nombre;

DECLARE @Festivales TABLE
(
    Codigo nvarchar(40) NOT NULL PRIMARY KEY,
    Nombre nvarchar(240) NOT NULL,
    CodigoOrganizacion nvarchar(40) NOT NULL,
    CodigoDepartamento char(2) NOT NULL,
    CodigoMunicipio char(5) NOT NULL,
    Periodicidad nvarchar(80) NOT NULL,
    Descripcion nvarchar(1200) NOT NULL,
    IdFestival int NULL,
    IdVersionFestival int NULL
);

INSERT INTO @Festivales (Codigo, Nombre, CodigoOrganizacion, CodigoDepartamento, CodigoMunicipio, Periodicidad, Descripcion)
VALUES
    (N'MUSICA-IBAGUE', N'Festival Nacional de la Música Colombiana', N'FMC', '73', '73001', N'Anual', N'Registro demostrativo inspirado en el encuentro ibaguereño dedicado a la música colombiana. La descripción es original para pruebas de lectura pública.'),
    (N'FOLCLOR-IBAGUE', N'Festival Folclórico Colombiano', N'ALCALI', '73', '73001', N'Anual', N'Registro demostrativo de un encuentro de circulación y memoria folclórica en Ibagué. La clasificación SIMUS es de prueba.'),
    (N'PETRONIO-CALI', N'Festival de Música del Pacífico Petronio Álvarez', N'ALCALI', '76', '76001', N'Anual', N'Registro demostrativo inspirado en un festival público de Santiago de Cali que visibiliza músicas y tradiciones del Pacífico colombiano.'),
    (N'VALLENATO', N'Festival de la Leyenda Vallenata', N'FUNVALL', '20', '20001', N'Anual', N'Registro demostrativo inspirado en el encuentro vallenato de Valledupar. Los campos SIMUS no son una ficha oficial del festival.'),
    (N'MONO-NUNEZ', N'Festival de Música Andina Colombiana Mono Núñez', N'FUNMUSICA', '76', '76306', N'Anual', N'Registro demostrativo inspirado en el certamen anual de música andina de Ginebra, Valle del Cauca.');

INSERT INTO dbo.Festivales
    (NombreFestival, NumeroVersiones, Descripcion, Organizador, TieneVersionVigenteAnoActual, NivelCobertura, CodigoDepartamento, CodigoMunicipio, Activo, EstadoRegistro, FechaCreacion, FechaActualizacion, OrganizacionPrincipalId, Periodicidad)
SELECT f.Nombre, 1, f.Descripcion, o.Nombre, 1, N'municipal', f.CodigoDepartamento, f.CodigoMunicipio, 1, N'Publicado', @Ahora, @Ahora, o.IdEntidad, f.Periodicidad
FROM @Festivales f
INNER JOIN @Organizaciones o ON o.Codigo = f.CodigoOrganizacion
WHERE NOT EXISTS (SELECT 1 FROM dbo.Festivales destino WHERE destino.NombreFestival = f.Nombre);

UPDATE f SET IdFestival = destino.IdFestival
FROM @Festivales f
INNER JOIN dbo.Festivales destino ON destino.NombreFestival = f.Nombre;

INSERT INTO dbo.VersionesFestival
    (FestivalOrigenId, NumeroVersion, EsVigente, Nombre, Descripcion, NivelCobertura, CodigoDepartamento, CodigoMunicipio, Periodicidad, FechaPublicacion, FechaCreacion)
SELECT f.IdFestival, 1, 1, f.Nombre, f.Descripcion, N'municipal', f.CodigoDepartamento, f.CodigoMunicipio, f.Periodicidad, @Ahora, @Ahora
FROM @Festivales f
WHERE NOT EXISTS (SELECT 1 FROM dbo.VersionesFestival v WHERE v.FestivalOrigenId = f.IdFestival AND v.EsVigente = 1);

UPDATE f SET IdVersionFestival = v.IdVersionFestival
FROM @Festivales f
INNER JOIN dbo.VersionesFestival v ON v.FestivalOrigenId = f.IdFestival AND v.EsVigente = 1;

DECLARE @Escuelas TABLE
(
    Codigo nvarchar(40) NOT NULL PRIMARY KEY,
    Nombre nvarchar(240) NOT NULL,
    CodigoDepartamento char(2) NOT NULL,
    CodigoMunicipio char(5) NOT NULL,
    IdEscuela int NULL
);

INSERT INTO @Escuelas (Codigo, Nombre, CodigoDepartamento, CodigoMunicipio)
VALUES
    (N'MORAVIA', N'Escuela de Música Moravia', '05', '05001'),
    (N'SAN-JAVIER', N'Escuela de Música San Javier', '05', '05001'),
    (N'SANTA-ELENA', N'Escuela de Música Santa Elena', '05', '05001'),
    (N'ARANJUEZ', N'Escuela de Música Aranjuez', '05', '05001'),
    (N'BELEN', N'Escuela de Música Belén Parque Biblioteca', '05', '05001');

INSERT INTO dbo.EscuelasMusica
    (NombreEscuela, CategoriaEscuela, TipoEscuela, EntidadResponsable, NivelCobertura, CodigoDepartamento, CodigoMunicipio, ProcesosFormativos, PracticasMusicales, EscuelaActiva, Activo, EstadoRegistro, FechaCreacion, FechaActualizacion)
SELECT e.Nombre, N'Escuela de música', N'Proceso de formación', N'Secretaría de Cultura Ciudadana de Medellín', N'municipal', e.CodigoDepartamento, e.CodigoMunicipio,
       N'Registro demostrativo de formación musical para navegación y filtros.', N'Clasificación demostrativa mediante catálogos SIMUS.', 1, 1, N'publicado', @Ahora, @Ahora
FROM @Escuelas e
WHERE NOT EXISTS (SELECT 1 FROM dbo.EscuelasMusica destino WHERE destino.NombreEscuela = e.Nombre);

UPDATE e SET IdEscuela = destino.IdEscuelaMusica
FROM @Escuelas e
INNER JOIN dbo.EscuelasMusica destino ON destino.NombreEscuela = e.Nombre;

DECLARE @Mercados TABLE
(
    Codigo nvarchar(40) NOT NULL PRIMARY KEY,
    Nombre nvarchar(240) NOT NULL,
    CodigoOrganizacion nvarchar(40) NOT NULL,
    CodigoDepartamento char(2) NOT NULL,
    CodigoMunicipio char(5) NOT NULL,
    Descripcion nvarchar(1200) NOT NULL,
    IdMercado int NULL
);

INSERT INTO @Mercados (Codigo, Nombre, CodigoOrganizacion, CodigoDepartamento, CodigoMunicipio, Descripcion)
VALUES
    (N'BOMM', N'Bogotá Music Market - BOmm', N'CCB', '11', '11001', N'Registro demostrativo de una plataforma de circulación y negocios musicales en Bogotá.'),
    (N'CIRCULART', N'Circulart', N'REDLAT', '05', '05001', N'Registro demostrativo de una plataforma iberoamericana de promoción, conversaciones y encuentros profesionales.'),
    (N'MMP', N'Mercado Musical del Pacífico', N'ALCALI', '76', '76001', N'Registro demostrativo de una plataforma de conexión, formación y circulación de músicas hechas en Colombia.');

INSERT INTO dbo.MercadosMusicales
    (NombreMercado, NumeroEdiciones, Periodicidad, Descripcion, EntidadResponsable, Alcance, Modalidad, NivelCobertura, CodigoDepartamento, CodigoMunicipio, Activo, EstadoRegistro, FechaCreacion, FechaActualizacion)
SELECT m.Nombre, NULL, N'Anual', m.Descripcion, o.Nombre, N'Nacional', N'Mercado musical', N'municipal', m.CodigoDepartamento, m.CodigoMunicipio, 1, N'publicado', @Ahora, @Ahora
FROM @Mercados m
INNER JOIN @Organizaciones o ON o.Codigo = m.CodigoOrganizacion
WHERE NOT EXISTS (SELECT 1 FROM dbo.MercadosMusicales destino WHERE destino.NombreMercado = m.Nombre);

UPDATE m SET IdMercado = destino.IdMercadoMusical
FROM @Mercados m
INNER JOIN dbo.MercadosMusicales destino ON destino.NombreMercado = m.Nombre;

DECLARE @Registros TABLE
(
    Tipo nvarchar(40) NOT NULL,
    IdOrigen int NOT NULL,
    CodigoDepartamento char(2) NOT NULL,
    CodigoMunicipio char(5) NOT NULL,
    Nombre nvarchar(240) NOT NULL,
    IdRegistroEcosistema int NULL,
    PRIMARY KEY (Tipo, IdOrigen)
);

INSERT INTO @Registros (Tipo, IdOrigen, CodigoDepartamento, CodigoMunicipio, Nombre)
SELECT N'festival', IdFestival, CodigoDepartamento, CodigoMunicipio, Nombre FROM @Festivales
UNION ALL SELECT N'escuela_musica', IdEscuela, CodigoDepartamento, CodigoMunicipio, Nombre FROM @Escuelas
UNION ALL SELECT N'mercado_musical', IdMercado, CodigoDepartamento, CodigoMunicipio, Nombre FROM @Mercados;

INSERT INTO dbo.RegistrosEcosistema
    (IdTipoRegistroEcosistema, IdRegistroOrigen, NombreRegistro, CodigoDepartamento, CodigoMunicipio, Latitud, Longitud)
SELECT t.IdTipoRegistroEcosistema, r.IdOrigen, r.Nombre, r.CodigoDepartamento, r.CodigoMunicipio, d.Latitud, d.Longitud
FROM @Registros r
INNER JOIN dbo.TiposRegistroEcosistema t ON t.CodigoTipoRegistro = r.Tipo
LEFT JOIN dbo.Divipola d ON d.CodigoDepartamento = r.CodigoDepartamento AND d.CodigoMunicipio = r.CodigoMunicipio
WHERE NOT EXISTS
(
    SELECT 1 FROM dbo.RegistrosEcosistema destino
    WHERE destino.IdTipoRegistroEcosistema = t.IdTipoRegistroEcosistema AND destino.IdRegistroOrigen = r.IdOrigen
);

UPDATE r SET IdRegistroEcosistema = destino.IdRegistroEcosistema
FROM @Registros r
INNER JOIN dbo.TiposRegistroEcosistema t ON t.CodigoTipoRegistro = r.Tipo
INNER JOIN dbo.RegistrosEcosistema destino ON destino.IdTipoRegistroEcosistema = t.IdTipoRegistroEcosistema AND destino.IdRegistroOrigen = r.IdOrigen;

DECLARE @Clasificaciones TABLE
(
    Tipo nvarchar(40) NOT NULL,
    IdOrigen int NOT NULL,
    TipoCatalogo nvarchar(20) NOT NULL,
    SlugCatalogo nvarchar(160) NOT NULL,
    PRIMARY KEY (Tipo, IdOrigen, TipoCatalogo, SlugCatalogo)
);

INSERT INTO @Clasificaciones (Tipo, IdOrigen, TipoCatalogo, SlugCatalogo)
SELECT N'festival', f.IdFestival, N'practica', N'musicas-populares-tradicionales-regionales-y-patrimoniales' FROM @Festivales f WHERE f.Codigo IN (N'MUSICA-IBAGUE', N'FOLCLOR-IBAGUE', N'VALLENATO', N'MONO-NUNEZ')
UNION ALL SELECT N'festival', f.IdFestival, N'practica', N'musicas-de-comunidades-negras-afrocolombianas-raizales-y-palenqueras' FROM @Festivales f WHERE f.Codigo = N'PETRONIO-CALI'
UNION ALL SELECT N'festival', f.IdFestival, N'territorio', N'rajalena-y-cucamba' FROM @Festivales f WHERE f.Codigo IN (N'MUSICA-IBAGUE', N'FOLCLOR-IBAGUE')
UNION ALL SELECT N'festival', f.IdFestival, N'territorio', N'marimba' FROM @Festivales f WHERE f.Codigo = N'PETRONIO-CALI'
UNION ALL SELECT N'festival', f.IdFestival, N'territorio', N'comunidades-academicas' FROM @Festivales f WHERE f.Codigo = N'MONO-NUNEZ'
UNION ALL SELECT N'festival', f.IdFestival, N'territorio', N'cantos-pitos-y-tambores' FROM @Festivales f WHERE f.Codigo = N'VALLENATO'
UNION ALL SELECT N'escuela_musica', e.IdEscuela, N'practica', N'musicas-comunitarias-y-procesos-colectivos-de-practica-musical' FROM @Escuelas e
UNION ALL SELECT N'escuela_musica', e.IdEscuela, N'territorio', N'comunidades-academicas' FROM @Escuelas e
UNION ALL SELECT N'mercado_musical', m.IdMercado, N'practica', N'musicas-urbanas-alternativas-e-independientes' FROM @Mercados m WHERE m.Codigo IN (N'BOMM', N'CIRCULART')
UNION ALL SELECT N'mercado_musical', m.IdMercado, N'practica', N'musicas-de-comunidades-negras-afrocolombianas-raizales-y-palenqueras' FROM @Mercados m WHERE m.Codigo = N'MMP'
UNION ALL SELECT N'mercado_musical', m.IdMercado, N'territorio', N'muai' FROM @Mercados m WHERE m.Codigo IN (N'BOMM', N'CIRCULART')
UNION ALL SELECT N'mercado_musical', m.IdMercado, N'territorio', N'marimba' FROM @Mercados m WHERE m.Codigo = N'MMP';

IF EXISTS
(
    SELECT 1 FROM @Clasificaciones c
    WHERE (c.TipoCatalogo = N'practica' AND NOT EXISTS (SELECT 1 FROM dbo.PracticasMusicales p WHERE p.Slug = c.SlugCatalogo))
       OR (c.TipoCatalogo = N'territorio' AND NOT EXISTS (SELECT 1 FROM dbo.TerritoriosSonoros t WHERE t.Slug = c.SlugCatalogo))
)
    THROW 52801, 'La muestra demo requiere un catálogo maestro inexistente. No se creó ni modificó ningún catálogo.', 1;

INSERT INTO dbo.RegistrosEcosistemaPracticasMusicales (IdRegistroEcosistema, IdPracticaMusical)
SELECT r.IdRegistroEcosistema, p.IdPracticaMusical
FROM @Clasificaciones c
INNER JOIN @Registros r ON r.Tipo = c.Tipo AND r.IdOrigen = c.IdOrigen
INNER JOIN dbo.PracticasMusicales p ON p.Slug = c.SlugCatalogo
WHERE c.TipoCatalogo = N'practica'
  AND NOT EXISTS (SELECT 1 FROM dbo.RegistrosEcosistemaPracticasMusicales destino WHERE destino.IdRegistroEcosistema = r.IdRegistroEcosistema AND destino.IdPracticaMusical = p.IdPracticaMusical);

INSERT INTO dbo.RegistrosEcosistemaTerritoriosSonoros (IdRegistroEcosistema, IdTerritorioSonoro)
SELECT r.IdRegistroEcosistema, t.IdTerritorioSonoro
FROM @Clasificaciones c
INNER JOIN @Registros r ON r.Tipo = c.Tipo AND r.IdOrigen = c.IdOrigen
INNER JOIN dbo.TerritoriosSonoros t ON t.Slug = c.SlugCatalogo
WHERE c.TipoCatalogo = N'territorio'
  AND NOT EXISTS (SELECT 1 FROM dbo.RegistrosEcosistemaTerritoriosSonoros destino WHERE destino.IdRegistroEcosistema = r.IdRegistroEcosistema AND destino.IdTerritorioSonoro = t.IdTerritorioSonoro);

INSERT INTO dbo.VersionesFestivalPracticasMusicales (VersionFestivalId, PracticaMusicalId, FechaCreacion)
SELECT f.IdVersionFestival, p.IdPracticaMusical, @Ahora
FROM @Clasificaciones c
INNER JOIN @Festivales f ON c.Tipo = N'festival' AND c.IdOrigen = f.IdFestival
INNER JOIN dbo.PracticasMusicales p ON p.Slug = c.SlugCatalogo
WHERE c.TipoCatalogo = N'practica'
  AND NOT EXISTS (SELECT 1 FROM dbo.VersionesFestivalPracticasMusicales destino WHERE destino.VersionFestivalId = f.IdVersionFestival AND destino.PracticaMusicalId = p.IdPracticaMusical);

INSERT INTO dbo.VersionesFestivalTerritoriosSonoros (VersionFestivalId, TerritorioSonoroId, FechaCreacion)
SELECT f.IdVersionFestival, t.IdTerritorioSonoro, @Ahora
FROM @Clasificaciones c
INNER JOIN @Festivales f ON c.Tipo = N'festival' AND c.IdOrigen = f.IdFestival
INNER JOIN dbo.TerritoriosSonoros t ON t.Slug = c.SlugCatalogo
WHERE c.TipoCatalogo = N'territorio'
  AND NOT EXISTS (SELECT 1 FROM dbo.VersionesFestivalTerritoriosSonoros destino WHERE destino.VersionFestivalId = f.IdVersionFestival AND destino.TerritorioSonoroId = t.IdTerritorioSonoro);

INSERT INTO dbo.EntidadesRegistrosFuente (IdEntidad, TablaFuente, IdRegistroFuente, IdRegistroEcosistema, EsPrincipal, FechaCreacion)
SELECT o.IdEntidad, N'Festivales', f.IdFestival, r.IdRegistroEcosistema, 1, @Ahora
FROM @Festivales f
INNER JOIN @Organizaciones o ON o.Codigo = f.CodigoOrganizacion
INNER JOIN @Registros r ON r.Tipo = N'festival' AND r.IdOrigen = f.IdFestival
WHERE NOT EXISTS (SELECT 1 FROM dbo.EntidadesRegistrosFuente destino WHERE destino.TablaFuente = N'Festivales' AND destino.IdRegistroFuente = f.IdFestival)
UNION ALL
SELECT o.IdEntidad, N'EscuelasMusica', e.IdEscuela, r.IdRegistroEcosistema, 1, @Ahora
FROM @Escuelas e
INNER JOIN @Organizaciones o ON o.Codigo = N'SCCMED'
INNER JOIN @Registros r ON r.Tipo = N'escuela_musica' AND r.IdOrigen = e.IdEscuela
WHERE NOT EXISTS (SELECT 1 FROM dbo.EntidadesRegistrosFuente destino WHERE destino.TablaFuente = N'EscuelasMusica' AND destino.IdRegistroFuente = e.IdEscuela)
UNION ALL
SELECT o.IdEntidad, N'MercadosMusicales', m.IdMercado, r.IdRegistroEcosistema, 1, @Ahora
FROM @Mercados m
INNER JOIN @Organizaciones o ON o.Codigo = m.CodigoOrganizacion
INNER JOIN @Registros r ON r.Tipo = N'mercado_musical' AND r.IdOrigen = m.IdMercado
WHERE NOT EXISTS (SELECT 1 FROM dbo.EntidadesRegistrosFuente destino WHERE destino.TablaFuente = N'MercadosMusicales' AND destino.IdRegistroFuente = m.IdMercado);

DECLARE @AgendaDemo TABLE (Titulo nvarchar(320) NOT NULL PRIMARY KEY, IdFestival int NULL, FechaInicio date NOT NULL, FechaFin date NULL, CodigoDepartamento char(2) NOT NULL, CodigoMunicipio char(5) NOT NULL, Organizador nvarchar(240) NOT NULL, Descripcion nvarchar(1200) NOT NULL);
INSERT INTO @AgendaDemo VALUES
    (N'Festival Mono Núñez: encuentro de música andina', (SELECT IdFestival FROM @Festivales WHERE Codigo = N'MONO-NUNEZ'), '2026-06-25', '2026-06-28', '76', '76306', N'Fundación Pro Música Nacional de Ginebra - FUNMÚSICA', N'Entrada demostrativa basada en la referencia pública del Festival Mono Núñez. La agenda oficial debe consultarse en su fuente institucional.'),
    (N'Circulart: encuentros profesionales de música', NULL, '2026-06-04', '2026-06-07', '05', '05001', N'Redlat Colombia', N'Entrada demostrativa basada en la programación pública de Circulart 2026.'),
    (N'Muestra pedagógica de escuelas de música de Medellín', NULL, '2026-09-18', '2026-09-18', '05', '05001', N'Secretaría de Cultura Ciudadana de Medellín', N'Evento de demostración para validar agenda local. No corresponde a una convocatoria ni programación institucional.'),
    (N'Encuentro demostrativo de música colombiana en Ibagué', (SELECT IdFestival FROM @Festivales WHERE Codigo = N'MUSICA-IBAGUE'), '2026-10-09', '2026-10-10', '73', '73001', N'Fundación Musical de Colombia', N'Evento de demostración para probar navegación entre Festival y Agenda.'),
    (N'Laboratorio de circulación musical en Bogotá', NULL, '2026-11-12', '2026-11-13', '11', '11001', N'Cámara de Comercio de Bogotá', N'Evento de demostración para probar filtros, orden cronológico y vista de agenda.'),
    (N'Muestra demostrativa de músicas del Pacífico', (SELECT IdFestival FROM @Festivales WHERE Codigo = N'PETRONIO-CALI'), '2025-08-15', '2025-08-17', '76', '76001', N'Alcaldía Distrital de Santiago de Cali', N'Evento histórico de demostración para probar la visualización de agenda pasada.');

INSERT INTO dbo.Agenda (Titulo, DescripcionCorta, DescripcionLarga, IdCategoria, FechaInicio, FechaFin, NivelCobertura, CodigoDepartamento, CodigoMunicipio, Organizador, IdFestival, IdEstadoContenido, OrdenVisualizacion, FechaCreacion, FechaActualizacion, FechaPublicacion, IdUsuarioCreador)
SELECT a.Titulo, LEFT(a.Descripcion, 240), a.Descripcion, @CategoriaAgenda, a.FechaInicio, a.FechaFin, N'municipal', a.CodigoDepartamento, a.CodigoMunicipio, a.Organizador, a.IdFestival, @IdEstadoPublicado, 100, @Ahora, @Ahora, @Ahora, @UsuarioSistema
FROM @AgendaDemo a
WHERE NOT EXISTS (SELECT 1 FROM dbo.Agenda destino WHERE destino.Titulo = a.Titulo);

DECLARE @NoticiasDemo TABLE (Titulo nvarchar(320) NOT NULL PRIMARY KEY, Slug nvarchar(220) NOT NULL, Entradilla nvarchar(600) NOT NULL, Cuerpo nvarchar(max) NOT NULL, UrlExterna nvarchar(500) NULL);
INSERT INTO @NoticiasDemo VALUES
    (N'Música andina: una ficha demostrativa para explorar Ginebra', N'musica-andina-ficha-demo-ginebra', N'Contenido demostrativo para recorrer un Festival, su territorio y su ficha pública.', N'Texto original de demostración. Toma como referencia pública la existencia del Festival Mono Núñez, sin reproducir contenidos de su sitio ni atribuir anuncios a su organización.', N'https://funmusica.org/mono-nunez/'),
    (N'La exploración pública conecta Festival, agenda y territorio', N'exploracion-publica-festival-agenda-territorio', N'Una noticia demostrativa para verificar tarjetas, búsqueda y navegación entre módulos.', N'Texto original de demostración para SIMUS. No constituye una comunicación oficial de las entidades nombradas.', NULL),
    (N'Red de Músicas de Medellín: referencia para una muestra de formación', N'red-musicas-medellin-referencia-demo', N'Contenido demostrativo inspirado en información pública de la Red de Músicas de Medellín.', N'Texto original de demostración. Las sedes, cifras y programación oficiales deben consultarse con la Secretaría de Cultura Ciudadana de Medellín.', N'https://www.medellin.gov.co/es/secretaria-cultura-ciudadana/red-de-practicas-artisticas-y-culturales/red-de-musicas-de-medellin/'),
    (N'Mercados musicales: tres rutas de exploración en SIMUS', N'mercados-musicales-rutas-exploracion-demo', N'Una pieza demostrativa para contrastar Bogotá, Medellín y Cali en los filtros del Ecosistema Musical.', N'Texto original de demostración basado en referencias públicas de BOmm, Circulart y Mercado Musical del Pacífico.', N'https://celebralamusica.mincultura.gov.co/Paginas/noticias/noticia7.aspx'),
    (N'Valledupar e Ibagué: diversidad territorial en una muestra local', N'valledupar-ibague-muestra-territorial-demo', N'Contenido demostrativo para probar búsquedas y resultados entre departamentos.', N'Texto original de demostración; no representa una alianza, noticia ni programación oficial.', NULL);

INSERT INTO dbo.Noticias (Titulo, Slug, Entradilla, Cuerpo, Autor, IdCategoria, FechaPublicacion, UrlExterna, IdEstadoContenido, OrdenVisualizacion, FechaCreacion, FechaActualizacion, IdUsuarioCreador)
SELECT n.Titulo, n.Slug, n.Entradilla, n.Cuerpo, N'SIMUS — muestra demostrativa', @CategoriaNoticias, @Ahora, n.UrlExterna, @IdEstadoPublicado, 100, @Ahora, @Ahora, @UsuarioSistema
FROM @NoticiasDemo n
WHERE NOT EXISTS (SELECT 1 FROM dbo.Noticias destino WHERE destino.Slug = n.Slug);

DECLARE @EditorialDemo TABLE (Codigo nvarchar(64) NOT NULL PRIMARY KEY, Titulo nvarchar(500) NOT NULL, Seccion nvarchar(max) NOT NULL, Practica nvarchar(max) NULL, Resumen nvarchar(max) NOT NULL, Ambito nvarchar(max) NOT NULL);
INSERT INTO @EditorialDemo VALUES
    (N'ECO-DEMO-001', N'Rutas de escucha: músicas andinas en el Valle del Cauca', N'Editorial', N'Músicas populares tradicionales, regionales y patrimoniales', N'Contenido editorial original de demostración para probar catálogo y lectura extendida.', N'Valle del Cauca'),
    (N'ECO-DEMO-002', N'Escuelas de música y tejido territorial en Medellín', N'Editorial', N'Músicas comunitarias y procesos colectivos de práctica musical', N'Contenido editorial original de demostración; no constituye investigación publicada.', N'Antioquia'),
    (N'ECO-DEMO-003', N'Circulación y mercados: una lectura demostrativa del ecosistema', N'Editorial', N'Músicas urbanas, alternativas e independientes', N'Contenido editorial original de demostración para navegar entre mercados musicales.', N'Bogotá, Medellín y Cali'),
    (N'ECO-DEMO-004', N'Marimba, memoria y consulta pública', N'Editorial', N'Músicas de comunidades negras, afrocolombianas, raizales y palenqueras', N'Contenido editorial original de demostración asociado al uso del catálogo maestro Marimba.', N'Valle del Cauca'),
    (N'ECO-DEMO-005', N'Festivales y datos públicos: una guía de exploración', N'Editorial', NULL, N'Contenido editorial original de demostración para verificar búsqueda y fichas.', N'Nacional');

INSERT INTO dbo.CatalogoEditorial (CodigoRecurso, Titulo, Anio, SeccionPrincipal, TipoPublicacion, PracticaMusical, AutorCorporativo, AmbitoRegional, Resumen, CamposAdicionales, Activo, FechaImportacion)
SELECT e.Codigo, e.Titulo, N'2026', e.Seccion, N'Contenido demostrativo', e.Practica, N'SIMUS — muestra demostrativa', e.Ambito, e.Resumen, N'{"origen":"semilla-local","estado":"demostrativo"}', 1, @Ahora
FROM @EditorialDemo e
WHERE NOT EXISTS (SELECT 1 FROM dbo.CatalogoEditorial destino WHERE destino.CodigoRecurso = e.Codigo);

DECLARE @Rastreo TABLE (TablaOrigen nvarchar(120) NOT NULL, IdRegistro int NOT NULL, PRIMARY KEY (TablaOrigen, IdRegistro));
INSERT INTO @Rastreo
SELECT N'Entidades', IdEntidad FROM @Organizaciones
UNION ALL SELECT N'Festivales', IdFestival FROM @Festivales
UNION ALL SELECT N'VersionesFestival', IdVersionFestival FROM @Festivales
UNION ALL SELECT N'EscuelasMusica', IdEscuela FROM @Escuelas
UNION ALL SELECT N'MercadosMusicales', IdMercado FROM @Mercados
UNION ALL SELECT N'RegistrosEcosistema', IdRegistroEcosistema FROM @Registros
UNION ALL SELECT N'Agenda', a.IdAgenda FROM dbo.Agenda a INNER JOIN @AgendaDemo demo ON demo.Titulo = a.Titulo
UNION ALL SELECT N'Noticias', n.IdNoticia FROM dbo.Noticias n INNER JOIN @NoticiasDemo demo ON demo.Slug = n.Slug
UNION ALL SELECT N'CatalogoEditorial', e.IdRecursoEditorial FROM dbo.CatalogoEditorial e INNER JOIN @EditorialDemo demo ON demo.Codigo = e.CodigoRecurso;

INSERT INTO dbo.SemillasDatosDemo (CodigoSemilla, TablaOrigen, IdRegistro, FechaRegistro)
SELECT @CodigoSemilla, r.TablaOrigen, r.IdRegistro, @Ahora
FROM @Rastreo r
WHERE NOT EXISTS
(
    SELECT 1 FROM dbo.SemillasDatosDemo destino
    WHERE destino.CodigoSemilla = @CodigoSemilla AND destino.TablaOrigen = r.TablaOrigen AND destino.IdRegistro = r.IdRegistro
);

COMMIT TRANSACTION;
