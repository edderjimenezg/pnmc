/*
    SIMUS - Limpieza controlada de muestras heredadas.

    Alcance: únicamente PNMC_LOCAL. Retira los 30 registros sintéticos
    identificables de la semilla V20260519_06 (prefijo PNMC) para que la
    muestra ecosistema-demo-piloto-20260824 sea la referencia de navegación.
    No modifica usuarios, entidades, catálogos maestros, DIVIPOLA ni datos de
    producción. Ejecutar solamente después de inventario y respaldo local.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;

IF DB_NAME() <> N'PNMC_LOCAL'
    THROW 52820, 'Esta limpieza está restringida a la base local PNMC_LOCAL.', 1;

BEGIN TRANSACTION;

DECLARE @Festivales TABLE (Id int NOT NULL PRIMARY KEY);
DECLARE @Escuelas TABLE (Id int NOT NULL PRIMARY KEY);
DECLARE @Mercados TABLE (Id int NOT NULL PRIMARY KEY);
DECLARE @Agenda TABLE (Id int NOT NULL PRIMARY KEY);
DECLARE @Noticias TABLE (Id int NOT NULL PRIMARY KEY);
DECLARE @Registros TABLE (Id int NOT NULL PRIMARY KEY);
DECLARE @Versiones TABLE (Id int NOT NULL PRIMARY KEY);

INSERT INTO @Festivales SELECT IdFestival FROM dbo.Festivales WHERE NombreFestival LIKE N'Festival PNMC %';
INSERT INTO @Escuelas SELECT IdEscuelaMusica FROM dbo.EscuelasMusica WHERE NombreEscuela LIKE N'Escuela de Musica PNMC %';
INSERT INTO @Mercados SELECT IdMercadoMusical FROM dbo.MercadosMusicales WHERE NombreMercado LIKE N'Mercado Musical PNMC %';
INSERT INTO @Agenda SELECT IdAgenda FROM dbo.Agenda WHERE Titulo LIKE N'Encuentro PNMC %';
INSERT INTO @Noticias SELECT IdNoticia FROM dbo.Noticias WHERE Titulo LIKE N'Noticia PNMC %';
INSERT INTO @Versiones SELECT IdVersionFestival FROM dbo.VersionesFestival WHERE FestivalOrigenId IN (SELECT Id FROM @Festivales);

INSERT INTO @Registros
SELECT r.IdRegistroEcosistema
FROM dbo.RegistrosEcosistema r
INNER JOIN dbo.TiposRegistroEcosistema t ON t.IdTipoRegistroEcosistema = r.IdTipoRegistroEcosistema
WHERE (t.CodigoTipoRegistro = N'festival' AND r.IdRegistroOrigen IN (SELECT Id FROM @Festivales))
   OR (t.CodigoTipoRegistro = N'escuela_musica' AND r.IdRegistroOrigen IN (SELECT Id FROM @Escuelas))
   OR (t.CodigoTipoRegistro = N'mercado_musical' AND r.IdRegistroOrigen IN (SELECT Id FROM @Mercados));

DELETE FROM dbo.AgendaArchivos WHERE IdAgenda IN (SELECT Id FROM @Agenda);
DELETE FROM dbo.AgendaEtiquetas WHERE IdAgenda IN (SELECT Id FROM @Agenda);
DELETE FROM dbo.NoticiasArchivos WHERE IdNoticia IN (SELECT Id FROM @Noticias);
DELETE FROM dbo.NoticiasEtiquetas WHERE IdNoticia IN (SELECT Id FROM @Noticias);
DELETE FROM dbo.VersionesFestivalPracticasMusicales WHERE VersionFestivalId IN (SELECT Id FROM @Versiones);
DELETE FROM dbo.VersionesFestivalTerritoriosSonoros WHERE VersionFestivalId IN (SELECT Id FROM @Versiones);
DELETE FROM dbo.EntidadesRegistrosFuente
WHERE IdRegistroEcosistema IN (SELECT Id FROM @Registros)
   OR (TablaFuente = N'Festivales' AND IdRegistroFuente IN (SELECT Id FROM @Festivales))
   OR (TablaFuente = N'EscuelasMusica' AND IdRegistroFuente IN (SELECT Id FROM @Escuelas))
   OR (TablaFuente = N'MercadosMusicales' AND IdRegistroFuente IN (SELECT Id FROM @Mercados));
DELETE FROM dbo.RegistrosEcosistemaPracticasMusicales WHERE IdRegistroEcosistema IN (SELECT Id FROM @Registros);
DELETE FROM dbo.RegistrosEcosistemaTerritoriosSonoros WHERE IdRegistroEcosistema IN (SELECT Id FROM @Registros);
UPDATE dbo.MercadosMusicales
SET IdFestivalAsociado = NULL
WHERE IdFestivalAsociado IN (SELECT Id FROM @Festivales);
DELETE FROM dbo.Agenda WHERE IdAgenda IN (SELECT Id FROM @Agenda);
DELETE FROM dbo.Noticias WHERE IdNoticia IN (SELECT Id FROM @Noticias);
DELETE FROM dbo.RegistrosEcosistema WHERE IdRegistroEcosistema IN (SELECT Id FROM @Registros);
DELETE FROM dbo.VersionesFestival WHERE IdVersionFestival IN (SELECT Id FROM @Versiones);
DELETE FROM dbo.Festivales WHERE IdFestival IN (SELECT Id FROM @Festivales);
DELETE FROM dbo.EscuelasMusica WHERE IdEscuelaMusica IN (SELECT Id FROM @Escuelas);
DELETE FROM dbo.MercadosMusicales WHERE IdMercadoMusical IN (SELECT Id FROM @Mercados);

COMMIT TRANSACTION;
