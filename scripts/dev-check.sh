#!/usr/bin/env bash
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB_NAME="${PNMC_LOCAL_DB_NAME:-PNMC_LOCAL}"
DB_PASSWORD="${PNMC_LOCAL_SA_PASSWORD:-PnmcLocal_2026!}"
DB_PORT="${PNMC_LOCAL_SQL_PORT:-14333}"

BOLD="\033[1m"; RESET="\033[0m"; GREEN="\033[32m"; RED="\033[31m"; YELLOW="\033[33m"
ok()   { echo -e "  ${GREEN}OK${RESET}    $1"; }
fail() { echo -e "  ${RED}FALLA${RESET} $1"; }
warn() { echo -e "  ${YELLOW}AVISO${RESET} $1"; }

echo -e "${BOLD}== Estado de SIMUS local ==${RESET}"
echo

# 1. Docker
echo "Base de datos (Docker · SQL Server, puerto $DB_PORT)"
if ! command -v docker >/dev/null 2>&1; then
  fail "Docker no esta instalado."
elif ! docker info >/dev/null 2>&1; then
  fail "Docker Desktop no esta corriendo."
elif ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^pnmc-sqlserver$'; then
  fail "El contenedor pnmc-sqlserver no esta activo. Ejecuta scripts/local-db-up.sh"
else
  ok "Contenedor pnmc-sqlserver activo."
  if command -v docker >/dev/null 2>&1; then
    NET="$(docker inspect pnmc-sqlserver --format '{{range $network, $_ := .NetworkSettings.Networks}}{{$network}}{{end}}' 2>/dev/null)"
    TABLA="$(docker run --rm --platform linux/amd64 --network "$NET" mcr.microsoft.com/mssql-tools \
      /opt/mssql-tools/bin/sqlcmd -S sqlserver -U sa -P "$DB_PASSWORD" -d "$DB_NAME" -C -h -1 \
      -Q "SET NOCOUNT ON; SELECT OBJECT_ID(N'dbo.Festivales');" 2>/dev/null | tr -d '[:space:]')"
    if [[ "$TABLA" == "NULL" || -z "$TABLA" ]]; then
      warn "Base $DB_NAME sin esquema todavia. Ejecuta scripts/seed-local-db.sh"
    else
      ok "Base $DB_NAME con esquema cargado."
    fi
  fi
fi
echo

# 2. API
echo "API (.NET, puerto 8080)"
API_LIVE="$(curl -sS -o /dev/null -w '%{http_code}' http://localhost:8080/health/live 2>/dev/null || echo "000")"
API_READY="$(curl -sS -w '\n%{http_code}' http://localhost:8080/health/ready 2>/dev/null)"
API_READY_CODE="$(echo "$API_READY" | tail -1)"
API_READY_BODY="$(echo "$API_READY" | head -1)"
if [[ "$API_LIVE" != "200" ]]; then
  fail "No responde en http://localhost:8080 (¿esta corriendo scripts/api-local.sh?)"
elif [[ "$API_READY_CODE" == "200" && "$API_READY_BODY" == "Healthy" ]]; then
  ok "Activa y con base de datos conectada (Healthy)."
else
  warn "Activa pero en modo degradado (revisa el log de la API: la base no respondio a tiempo o falta esquema)."
fi
echo

# 3. Web
echo "Frontend (Angular, puerto 4200)"
WEB_CODE="$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:4200 2>/dev/null || echo "000")"
if [[ "$WEB_CODE" == "200" ]]; then
  ok "Sirviendo en http://127.0.0.1:4200"
else
  fail "No responde (¿esta corriendo 'npm start' en pnmc-web?)"
fi
echo

# 4. Git
echo "Repositorio"
cd "$ROOT_DIR" || exit 1
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  RAMA="$(git rev-parse --abbrev-ref HEAD)"
  CAMBIOS="$(git status --porcelain | wc -l | tr -d ' ')"
  if [[ "$CAMBIOS" -eq 0 ]]; then
    ok "Rama '$RAMA', sin cambios pendientes."
  else
    warn "Rama '$RAMA', $CAMBIOS archivo(s) con cambios sin confirmar."
  fi
else
  fail "No se detecto un repositorio Git en $ROOT_DIR."
fi
echo
echo -e "${BOLD}URLs${RESET}"
echo "  Frontend: http://127.0.0.1:4200"
echo "  API:      http://localhost:8080/swagger"
