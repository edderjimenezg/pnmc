# Línea base técnica — agosto de 2026

Estado verificable del proyecto antes de la reconstrucción, con el resultado de compilación y pruebas de ese momento. Documento histórico: las cifras corresponden al commit `52c06ae`.

## Estado actual — línea base SIMUS v0.0

### Propósito

Fijar el estado verificable del proyecto antes de cualquier refactorización. La carpeta base permanece intacta; los documentos de evolución viven en `../Desarrollo/docs/`.

### Hallazgos verificables

El repositorio contiene tres aplicaciones relacionadas: `pnmc-web` (Angular), `pnmc-api` (.NET) y `pnmc-database` (SQL). La rama actual es `main`, con referencia remota `origin/main` y último commit observado `52c06ae`.

Había cambios previos no atribuibles a esta auditoría en `pnmc-api/src/PNMC.Infrastructure/Data/DatabaseBootstrapper.cs`, `pnmc-api/src/PNMC.Api/appsettings.Local.json` e `Informe_Final_Entrega_PNMC/`. No fueron abiertos, alterados, movidos ni incorporados a esta entrega.

La carpeta `../Desarrollo` existía, sin contenido previo. Se creó únicamente `../Desarrollo/docs/` para los entregables aprobados.

### Ejecución y verificación

| Componente | Comando | Resultado |
|---|---|---|
| Frontend | `npm run build` en `pnmc-web` | Correcto, con advertencias de plantilla e imports sin uso; salida generada en `pnmc-web/dist/`, artefacto no versionado. |
| API | `dotnet test PNMC.Api.sln --no-restore` en `pnmc-api` | 27 pruebas correctas; 0 fallidas. |

La prueba de API reporta una vulnerabilidad alta conocida en `SQLitePCLRaw.lib.e_sqlite3` 2.1.11 (`NU1903`). La compilación Angular no falla, pero reporta imports Lucide sin uso, expresiones opcionales redundantes y dependencias CommonJS (`leaflet`, `leaflet.markercluster`, `exceljs`).

### Tecnologías observadas

Angular 21.2.17, TypeScript 5.9, Tailwind CSS 4, RxJS 7.8, Leaflet 1.9, ExcelJS 4.4 y Lucide Angular. La API usa .NET 10, Minimal APIs, Entity Framework Core, autenticación por cookies, Swagger en desarrollo, CORS, rate limiting y SQLite en las pruebas. La base contiene esquema, semillas, scripts de validación y migraciones SQL.

### Alcance y límites

Esta es una auditoría estática y de compilación. No valida una base de datos de producción, correos, despliegue, sesiones reales ni datos institucionales. Cualquier conclusión sobre esos entornos queda TBC hasta contar con su configuración y autorización.
