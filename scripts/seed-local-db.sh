#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB_NAME="${PNMC_LOCAL_DB_NAME:-PNMC_LOCAL}"
DB_PASSWORD="${PNMC_LOCAL_SA_PASSWORD:-PnmcLocal_2026!}"
DB_PORT="${PNMC_LOCAL_SQL_PORT:-14333}"
SQL_TOOLS_IMAGE="${PNMC_LOCAL_SQL_TOOLS_IMAGE:-mcr.microsoft.com/mssql-tools}"

echo "[pnmc-db] Detectando sqlcmd..."
SQLCMD=""
SQLCMD_MODE=""
SQL_NETWORK="$(docker inspect pnmc-sqlserver --format '{{range $network, $_ := .NetworkSettings.Networks}}{{$network}}{{end}}')"
if command -v sqlcmd >/dev/null 2>&1 \
  && sqlcmd -S "127.0.0.1,$DB_PORT" -U sa -P "$DB_PASSWORD" -C -Q "SELECT 1" >/dev/null 2>&1; then
  SQLCMD="$(command -v sqlcmd)"
  SQLCMD_MODE="host"
elif docker exec pnmc-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$DB_PASSWORD" -C -Q "SELECT 1" >/dev/null 2>&1; then
  SQLCMD="/opt/mssql-tools18/bin/sqlcmd"
  SQLCMD_MODE="container"
elif docker exec pnmc-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$DB_PASSWORD" -Q "SELECT 1" >/dev/null 2>&1; then
  SQLCMD="/opt/mssql-tools/bin/sqlcmd"
  SQLCMD_MODE="container"
elif docker run --rm --platform linux/amd64 --network "$SQL_NETWORK" "$SQL_TOOLS_IMAGE" \
  /opt/mssql-tools/bin/sqlcmd -S sqlserver -U sa -P "$DB_PASSWORD" -C -l 5 -Q "SELECT 1" >/dev/null 2>&1; then
  SQLCMD_MODE="tools-container"
  SQLCMD="/opt/mssql-tools/bin/sqlcmd"
fi

if [[ -z "$SQLCMD" ]]; then
  echo "[pnmc-db] Error: No se pudo conectar a SQL Server o no se encontró sqlcmd."
  exit 1
fi

echo "[pnmc-db] sqlcmd detectado en: $SQLCMD"

# Los archivos se leen con -i (archivo real), nunca por stdin: sqlcmd no
# interpreta de forma fiable el comentario /* ... */ inicial de estos
# scripts cuando el contenido llega por una tuberia en lugar de un archivo,
# y produce errores de sintaxis falsos ("Incorrect syntax near '*'").
run_sql_file() {
  local file_path="$1"
  if [[ "$SQLCMD_MODE" == "host" ]]; then
    "$SQLCMD" -S "127.0.0.1,$DB_PORT" -U sa -P "$DB_PASSWORD" -d "$DB_NAME" -C -b -i "$file_path"
  elif [[ "$SQLCMD_MODE" == "tools-container" ]]; then
    local rel_path="${file_path#"$ROOT_DIR"/pnmc-database/}"
    docker run --rm --platform linux/amd64 --network "$SQL_NETWORK" \
      -v "$ROOT_DIR/pnmc-database:/sql:ro" "$SQL_TOOLS_IMAGE" \
      /opt/mssql-tools/bin/sqlcmd -S sqlserver -U sa -P "$DB_PASSWORD" -d "$DB_NAME" -C -b -i "/sql/$rel_path"
  else
    (cat "$file_path"; echo ""; echo "GO") | docker exec -i pnmc-sqlserver "$SQLCMD" \
      -S localhost -U sa -P "$DB_PASSWORD" -d "$DB_NAME" -C -b
  fi
}

run_sql_query() {
  local query="$1"
  if [[ "$SQLCMD_MODE" == "host" ]]; then
    "$SQLCMD" -S "127.0.0.1,$DB_PORT" -U sa -P "$DB_PASSWORD" -d "$DB_NAME" -C -b -Q "$query"
  elif [[ "$SQLCMD_MODE" == "tools-container" ]]; then
    docker run --rm -i --platform linux/amd64 --network "$SQL_NETWORK" "$SQL_TOOLS_IMAGE" \
      /opt/mssql-tools/bin/sqlcmd -S sqlserver -U sa -P "$DB_PASSWORD" -d "$DB_NAME" -C -b -Q "$query"
  else
    docker exec -i pnmc-sqlserver "$SQLCMD" \
      -S localhost -U sa -P "$DB_PASSWORD" -d "$DB_NAME" -C -b \
      -Q "$query"
  fi
}

# Lista de esquemas a aplicar
SCHEMAS=(
  "schema/V20260519_01__maestras_estaticas.sql"
  "schema/V20260519_02__administracion_control.sql"
  "schema/V20260519_03__contenidos_modulos.sql"
  "schema/V20260519_04__articulacion_lectura_comun.sql"
  "schema/V20260521_01__entidades_administrativas.sql"
  "schema/V20260525_01__administracion_extendida.sql"
  "schema/V20260525_02__roles_finales_y_aliados.sql"
  "schema/V20260525_03__notificaciones.sql"
  "schema/V20260525_04__vinculacion_duplicados_calidad.sql"
)

# Lista de semillas a aplicar
SEEDS=(
  "seed/V20260519_01__maestras_estaticas_seed.sql"
  "seed/V20260519_02__divipola_seed.sql"
  "seed/V20260519_03__administracion_control_seed.sql"
  "seed/V20260820_01__usuarios_prueba_seed.sql"
  "seed/V20260519_04__contenidos_modulos_seed.sql"
  "seed/V20260519_05__articulacion_lectura_comun_seed.sql"
  "seed/V20260519_06__datos_prueba_amplios.sql"
  "seed/V20260519_07__datos_moderacion_consola.sql"
)

echo "[pnmc-db] Aplicando archivos de esquema..."
for schema in "${SCHEMAS[@]}"; do
  echo "  -> Aplicando $schema..."
  run_sql_file "$ROOT_DIR/pnmc-database/$schema"
done

echo "[pnmc-db] Aplicando archivos de semilla..."
SEEDS_FALLIDAS=()
for seed in "${SEEDS[@]}"; do
  echo "  -> Aplicando $seed..."
  if ! run_sql_file "$ROOT_DIR/pnmc-database/$seed"; then
    echo "  [pnmc-db] AVISO: $seed fallo y se omitio. La aplicacion sigue siendo utilizable"
    echo "  [pnmc-db] con el resto de las semillas; revisa el mensaje de error de arriba."
    SEEDS_FALLIDAS+=("$seed")
  fi
done

echo "[pnmc-db] Actualizando métricas del mapa..."
run_sql_query "EXEC dbo.sp_ActualizarMetricasMapa;"

if [[ ${#SEEDS_FALLIDAS[@]} -eq 0 ]]; then
  echo "[pnmc-db] Base de datos local inicializada y sembrada con éxito."
else
  echo "[pnmc-db] Base de datos local inicializada. Esquema y datos principales listos."
  echo "[pnmc-db] Semillas omitidas por error (no bloquean el uso de la aplicacion):"
  for f in "${SEEDS_FALLIDAS[@]}"; do echo "  - $f"; done
fi
