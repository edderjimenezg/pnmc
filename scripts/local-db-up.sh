#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.local.yml"
DB_NAME="${PNMC_LOCAL_DB_NAME:-PNMC_LOCAL}"
DB_PASSWORD="${PNMC_LOCAL_SA_PASSWORD:-PnmcLocal_2026!}"
DB_PORT="${PNMC_LOCAL_SQL_PORT:-14333}"
SQL_TOOLS_IMAGE="${PNMC_LOCAL_SQL_TOOLS_IMAGE:-mcr.microsoft.com/mssql-tools}"

if ! command -v docker >/dev/null 2>&1; then
  echo "[pnmc] Docker CLI no esta disponible."
  echo "[pnmc] Abre Docker Desktop y espera a que termine de iniciar."
  exit 1
fi

echo "[pnmc] Iniciando SQL Server local..."
docker compose -f "$COMPOSE_FILE" up -d sqlserver
SQL_NETWORK="$(docker inspect pnmc-sqlserver --format '{{range $network, $_ := .NetworkSettings.Networks}}{{$network}}{{end}}')"

if [[ -z "$SQL_NETWORK" ]]; then
  echo "[pnmc] No se pudo determinar la red del contenedor SQL Server."
  exit 1
fi

echo "[pnmc] Esperando conexion con SQL Server..."
for _ in {1..90}; do
  if command -v sqlcmd >/dev/null 2>&1 \
    && sqlcmd -S "127.0.0.1,$DB_PORT" -U sa -P "$DB_PASSWORD" -C -Q "SELECT 1" >/dev/null 2>&1; then
    SQLCMD_MODE="host"
    SQLCMD="$(command -v sqlcmd)"
    break
  fi

  if docker exec pnmc-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$DB_PASSWORD" -C -Q "SELECT 1" >/dev/null 2>&1; then
    SQLCMD_MODE="container"
    SQLCMD="/opt/mssql-tools18/bin/sqlcmd"
    break
  fi

  if docker exec pnmc-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$DB_PASSWORD" -Q "SELECT 1" >/dev/null 2>&1; then
    SQLCMD_MODE="container"
    SQLCMD="/opt/mssql-tools/bin/sqlcmd"
    break
  fi

  # Azure SQL Edge ya no incluye sqlcmd en todas sus variantes. En ese caso,
  # se usa el cliente oficial en un contenedor efimero dentro de la red del SQL.
  if docker run --rm --platform linux/amd64 --network "$SQL_NETWORK" "$SQL_TOOLS_IMAGE" \
    /opt/mssql-tools/bin/sqlcmd -S sqlserver -U sa -P "$DB_PASSWORD" -C -l 5 -Q "SELECT 1" >/dev/null 2>&1; then
    SQLCMD_MODE="tools-container"
    SQLCMD="/opt/mssql-tools/bin/sqlcmd"
    break
  fi

  sleep 2
done

if [[ -z "${SQLCMD:-}" ]]; then
  echo "[pnmc] No fue posible conectar con SQL Server local."
  echo "[pnmc] En Mac con Apple Silicon, revisa que Docker Desktop permita emulacion x86_64/Rosetta."
  exit 1
fi

echo "[pnmc] Creando/verificando base $DB_NAME..."
if [[ "${SQLCMD_MODE:-}" == "host" ]]; then
  sqlcmd -S "127.0.0.1,$DB_PORT" -U sa -P "$DB_PASSWORD" -C \
    -Q "IF DB_ID(N'$DB_NAME') IS NULL CREATE DATABASE [$DB_NAME];"
elif [[ "${SQLCMD_MODE:-}" == "tools-container" ]]; then
  docker run --rm --platform linux/amd64 --network "$SQL_NETWORK" "$SQL_TOOLS_IMAGE" \
    /opt/mssql-tools/bin/sqlcmd \
    -S sqlserver \
    -U sa \
    -P "$DB_PASSWORD" \
    -C \
    -Q "IF DB_ID(N'$DB_NAME') IS NULL CREATE DATABASE [$DB_NAME];"
else
  docker exec pnmc-sqlserver "$SQLCMD" \
    -S localhost \
    -U sa \
    -P "$DB_PASSWORD" \
    -C \
    -Q "IF DB_ID(N'$DB_NAME') IS NULL CREATE DATABASE [$DB_NAME];"
fi

echo "[pnmc] Base local lista."
echo "[pnmc] Host: 127.0.0.1,$DB_PORT"
echo "[pnmc] Database: $DB_NAME"
echo "[pnmc] User: sa"

# La base recien creada no trae esquema: DatabaseBootstrapper solo agrega
# tablas de soporte y altera tablas existentes, no crea el esquema base.
# Si la tabla principal no existe todavia, se siembra automaticamente para
# que un clon nuevo del repositorio quede utilizable con un solo comando.
echo "[pnmc] Verificando si la base ya tiene esquema..."
schema_query() {
  local q="$1"
  case "$SQLCMD_MODE" in
    host)
      sqlcmd -S "127.0.0.1,$DB_PORT" -U sa -P "$DB_PASSWORD" -d "$DB_NAME" -C -h -1 -Q "$q" 2>/dev/null
      ;;
    tools-container)
      docker run --rm --platform linux/amd64 --network "$SQL_NETWORK" "$SQL_TOOLS_IMAGE" \
        /opt/mssql-tools/bin/sqlcmd -S sqlserver -U sa -P "$DB_PASSWORD" -d "$DB_NAME" -C -h -1 -Q "$q" 2>/dev/null
      ;;
    *)
      docker exec pnmc-sqlserver "$SQLCMD" -S localhost -U sa -P "$DB_PASSWORD" -d "$DB_NAME" -C -h -1 -Q "$q" 2>/dev/null
      ;;
  esac
}

TABLA_EXISTE="$(schema_query "SET NOCOUNT ON; SELECT OBJECT_ID(N'dbo.Festivales');" | tr -d '[:space:]')"
if [[ "$TABLA_EXISTE" == "NULL" || -z "$TABLA_EXISTE" ]]; then
  echo "[pnmc] Base sin esquema. Aplicando esquema y datos de prueba (primera vez)..."
  "$ROOT_DIR/scripts/seed-local-db.sh"
else
  echo "[pnmc] La base ya tiene esquema; no se vuelve a sembrar."
  echo "[pnmc] Para recargar los datos de prueba desde cero: ./scripts/seed-local-db.sh"
fi
