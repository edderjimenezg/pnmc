# SIMUS

Sistema de Información de la Música en Colombia. Plan Nacional de Música para la
Convivencia, Ministerio de las Culturas, las Artes y los Saberes.

## Componentes

| Directorio | Contenido |
|---|---|
| `pnmc-web/` | Frontend Angular 21 con Tailwind CSS, Leaflet y ExcelJS |
| `pnmc-api/` | API .NET 10 con Entity Framework Core y autenticación por cookie |
| `pnmc-database/` | Esquema SQL Server, migraciones versionadas y semillas |
| `scripts/` | Arranque, carga de base de datos y comprobaciones locales |
| `docs/` | Documentación del proyecto |
| `tools/` | Generadores del manual de marca |

Toda la comunicación de datos del frontend pasa por `pnmc-api`, que es la única responsable
de autorización y persistencia.

## Requisitos

Docker Desktop, Node con Angular 21 y .NET 10.

## Arranque local

```bash
cp pnmc-api/src/PNMC.Api/appsettings.Local.example.json \
   pnmc-api/src/PNMC.Api/appsettings.Local.json

cd pnmc-web && npm install && cd ..

./scripts/dev-up.sh
```

`dev-up.sh` levanta SQL Server en Docker, siembra la base y abre la API y el frontend. Para
detener sin borrar datos, `./scripts/dev-down.sh`.

Por separado:

```bash
./scripts/local-db-up.sh      # base de datos
./scripts/api-local.sh        # API
cd pnmc-web && npm start      # frontend
```

| Servicio | URL |
|---|---|
| Frontend | http://127.0.0.1:4200 |
| API y Swagger | http://localhost:8080/swagger |
| Salud de la API | http://localhost:8080/health/live |
| SQL Server | 127.0.0.1:14333 |

## Verificación

```bash
cd pnmc-api && dotnet test PNMC.Api.sln
cd ../pnmc-web && npm test && npm run build
```

## Configuración

En desarrollo, Angular usa `pnmc-web/src/environments/environment.ts`. La compilación de
producción lo reemplaza por `environment.production.ts` y usa rutas de API relativas. Para
orígenes separados, se ajusta `apiBaseUrl` en el despliegue y se configura
`PNMC_CORS_ORIGINS` en la API.

La configuración local de la API vive en `pnmc-api/src/PNMC.Api/appsettings.Local.json`,
que no se versiona porque contiene credenciales.

## Documentación

El índice está en [`docs/README.md`](docs/README.md). Los puntos de entrada habituales son
la [visión y alcance](docs/producto/vision-y-alcance.md) para entender qué es el sistema, y
la [arquitectura](docs/tecnico/arquitectura.md) para entender cómo está construido.

## Contribuir

Convenciones de ramas, commits, tags y verificación en [`CONTRIBUTING.md`](CONTRIBUTING.md).
Historial de versiones en [`CHANGELOG.md`](CHANGELOG.md).
