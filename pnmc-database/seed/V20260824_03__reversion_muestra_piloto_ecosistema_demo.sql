/*
    SIMUS - Reversión de la muestra piloto demostrativa del Ecosistema Musical.

    Uso exclusivo: desarrollo/local.
    Elimina solo registros rastreados bajo ecosistema-demo-piloto-20260824.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;

DECLARE @CodigoSemilla nvarchar(120) = N'ecosistema-demo-piloto-20260824';

IF OBJECT_ID(N'dbo.SemillasDatosDemo', N'U') IS NULL
    THROW 52810, 'No existe el rastreo de semillas demostrativas; la reversión no puede garantizar alcance seguro.', 1;

BEGIN TRANSACTION;

DECLARE @Festivales TABLE (Id int NOT NULL PRIMARY KEY);
DECLARE @VersionesFestival TABLE (Id int NOT NULL PRIMARY KEY);
DECLARE @Escuelas TABLE (Id int NOT NULL PRIMARY KEY);
DECLARE @Mercados TABLE (Id int NOT NULL PRIMARY KEY);
DECLARE @Registros TABLE (Id int NOT NULL PRIMARY KEY);
DECLARE @Entidades TABLE (Id int NOT NULL PRIMARY KEY);

INSERT INTO @Festivales SELECT IdRegistro FROM dbo.SemillasDatosDemo WHERE CodigoSemilla = @CodigoSemilla AND TablaOrigen = N'Festivales';
INSERT INTO @VersionesFestival SELECT IdRegistro FROM dbo.SemillasDatosDemo WHERE CodigoSemilla = @CodigoSemilla AND TablaOrigen = N'VersionesFestival';
INSERT INTO @Escuelas SELECT IdRegistro FROM dbo.SemillasDatosDemo WHERE CodigoSemilla = @CodigoSemilla AND TablaOrigen = N'EscuelasMusica';
INSERT INTO @Mercados SELECT IdRegistro FROM dbo.SemillasDatosDemo WHERE CodigoSemilla = @CodigoSemilla AND TablaOrigen = N'MercadosMusicales';
INSERT INTO @Registros SELECT IdRegistro FROM dbo.SemillasDatosDemo WHERE CodigoSemilla = @CodigoSemilla AND TablaOrigen = N'RegistrosEcosistema';
INSERT INTO @Entidades SELECT IdRegistro FROM dbo.SemillasDatosDemo WHERE CodigoSemilla = @CodigoSemilla AND TablaOrigen = N'Entidades';

DELETE FROM dbo.VersionesFestivalPracticasMusicales WHERE VersionFestivalId IN (SELECT Id FROM @VersionesFestival);
DELETE FROM dbo.VersionesFestivalTerritoriosSonoros WHERE VersionFestivalId IN (SELECT Id FROM @VersionesFestival);
DELETE FROM dbo.EntidadesRegistrosFuente WHERE IdRegistroEcosistema IN (SELECT Id FROM @Registros)
   OR (TablaFuente = N'Festivales' AND IdRegistroFuente IN (SELECT Id FROM @Festivales))
   OR (TablaFuente = N'EscuelasMusica' AND IdRegistroFuente IN (SELECT Id FROM @Escuelas))
   OR (TablaFuente = N'MercadosMusicales' AND IdRegistroFuente IN (SELECT Id FROM @Mercados));
DELETE FROM dbo.RegistrosEcosistemaPracticasMusicales WHERE IdRegistroEcosistema IN (SELECT Id FROM @Registros);
DELETE FROM dbo.RegistrosEcosistemaTerritoriosSonoros WHERE IdRegistroEcosistema IN (SELECT Id FROM @Registros);
DELETE FROM dbo.Agenda WHERE IdAgenda IN (SELECT IdRegistro FROM dbo.SemillasDatosDemo WHERE CodigoSemilla = @CodigoSemilla AND TablaOrigen = N'Agenda');
DELETE FROM dbo.Noticias WHERE IdNoticia IN (SELECT IdRegistro FROM dbo.SemillasDatosDemo WHERE CodigoSemilla = @CodigoSemilla AND TablaOrigen = N'Noticias');
DELETE FROM dbo.CatalogoEditorial WHERE IdRecursoEditorial IN (SELECT IdRegistro FROM dbo.SemillasDatosDemo WHERE CodigoSemilla = @CodigoSemilla AND TablaOrigen = N'CatalogoEditorial');
DELETE FROM dbo.RegistrosEcosistema WHERE IdRegistroEcosistema IN (SELECT Id FROM @Registros);
DELETE FROM dbo.VersionesFestival WHERE IdVersionFestival IN (SELECT Id FROM @VersionesFestival);
DELETE FROM dbo.Festivales WHERE IdFestival IN (SELECT Id FROM @Festivales);
DELETE FROM dbo.EscuelasMusica WHERE IdEscuelaMusica IN (SELECT Id FROM @Escuelas);
DELETE FROM dbo.MercadosMusicales WHERE IdMercadoMusical IN (SELECT Id FROM @Mercados);
DELETE FROM dbo.Entidades WHERE IdEntidad IN (SELECT Id FROM @Entidades)
  AND NOT EXISTS (SELECT 1 FROM dbo.UsuariosEntidades ue WHERE ue.IdEntidad = dbo.Entidades.IdEntidad)
  AND NOT EXISTS (SELECT 1 FROM dbo.Festivales f WHERE f.OrganizacionPrincipalId = dbo.Entidades.IdEntidad);
DELETE FROM dbo.SemillasDatosDemo WHERE CodigoSemilla = @CodigoSemilla;

COMMIT TRANSACTION;
