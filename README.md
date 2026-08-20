# SIMUS — Plataforma PNMC

Sistema de Información de la Música en Colombia. Versión integral e independiente de la
plataforma PNMC.

## Estructura

```
pnmc-web/        Angular 21, Tailwind CSS, Leaflet y ExcelJS
pnmc-api/        .NET 10, Entity Framework Core, autenticacion por cookie
pnmc-database/   SQL Server / Azure SQL, esquema, migraciones y semillas
scripts/         arranque, carga de base y comprobaciones locales
docs/            documentacion funcional, tecnica y de marca
tools/           generadores del manual de marca
```

Toda la comunicación de datos del frontend pasa por `pnmc-api`. La API es la única
responsable de autorización y persistencia.

## Arranque local

Requisitos: Docker Desktop, Node con Angular 21 y .NET 10.

```bash
./scripts/dev-up.sh
```

Levanta la base en Docker, la API y el frontend. Para detener sin borrar datos:

```bash
./scripts/dev-down.sh
```

Por separado:

```bash
./scripts/local-db-up.sh
./scripts/api-local.sh
cd pnmc-web && npm install && npm start
```

Servicios:

| Servicio | URL |
|---|---|
| Frontend | http://127.0.0.1:4200 |
| API y Swagger | http://localhost:8080/swagger |
| Salud de la API | http://localhost:8080/health/live |
| SQL Server | 127.0.0.1:14333 |

## Validación

```bash
cd pnmc-web && npm test && npm run build
cd ../pnmc-api && dotnet test PNMC.Api.sln
```

## Configuración

En desarrollo Angular usa `pnmc-web/src/environments/environment.ts`. La compilación de
producción lo reemplaza por `environment.production.ts` y usa rutas de API relativas. Para
orígenes separados, ajusta `apiBaseUrl` en el despliegue y configura `PNMC_CORS_ORIGINS`
en la API.

La configuración local de la API va en `pnmc-api/src/PNMC.Api/appsettings.Local.json`, que
se crea a partir de `appsettings.Local.example.json` y **no se versiona**. Nunca publiques
archivos `.env` ni credenciales reales.

## Ramas y versiones

`main` es la rama principal. El trabajo se hace en ramas temáticas y se integra en `main`.
Ver `CONTRIBUIR.md`.
