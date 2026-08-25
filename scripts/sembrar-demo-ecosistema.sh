#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB_NAME="${PNMC_LOCAL_DB_NAME:-PNMC_LOCAL}"
DB_PASSWORD="${PNMC_LOCAL_SA_PASSWORD:-PnmcLocal_2026!}"
SQL_TOOLS_IMAGE="${PNMC_LOCAL_SQL_TOOLS_IMAGE:-mcr.microsoft.com/mssql-tools}"
SQL_CONTAINER="${PNMC_LOCAL_SQL_CONTAINER:-pnmc-sqlserver}"
NETWORK_NAME="$(docker inspect "$SQL_CONTAINER" --format '{{range $network, $_ := .NetworkSettings.Networks}}{{$network}}{{end}}')"

if [[ -z "$NETWORK_NAME" ]]; then
  echo "No se pudo determinar la red local de SQL Server. Ejecuta primero ./scripts/local-db-up.sh." >&2
  exit 1
fi

docker run --rm -i --platform linux/amd64 --network "$NETWORK_NAME" "$SQL_TOOLS_IMAGE" \
  /opt/mssql-tools/bin/sqlcmd -S sqlserver -U sa -P "$DB_PASSWORD" -d "$DB_NAME" -C -b -i /dev/stdin \
  < "$ROOT_DIR/pnmc-database/seed/V20260824_02__muestra_piloto_ecosistema_demo.sql"
