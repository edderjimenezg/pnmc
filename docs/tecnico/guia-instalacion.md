# Guía de instalación y arranque local

Procedimiento para clonar, instalar y ejecutar SIMUS en una máquina de desarrollo. Todo el
entorno corre en local, contra una base de datos SQL Server en Docker.

## 1. Requisitos previos

| Herramienta | Versión |
|---|---|
| Docker Desktop | La más reciente disponible para tu sistema operativo |
| Node.js | 22 o superior |
| .NET SDK | .NET 10 |

Sistema operativo: macOS, Linux, o Windows con WSL2. Los scripts de arranque están escritos
en Bash.

## 2. Clonar y preparar la configuración local

```bash
git clone https://github.com/edderjimenezg/pnmc.git simus
cd simus
```

La API necesita un archivo con la cadena de conexión a la base local. No se versiona porque
va a contener una contraseña; se crea a partir de la plantilla incluida:

```bash
cp pnmc-api/src/PNMC.Api/appsettings.Local.example.json \
   pnmc-api/src/PNMC.Api/appsettings.Local.json
```

Para desarrollo local contra Docker no hace falta editar ese archivo: `scripts/api-local.sh`
arma la cadena de conexión completa por variable de entorno, usando la contraseña por
defecto del contenedor local (`PnmcLocal_2026!`). El archivo solo importa si vas a apuntar
la API a otra base (una instancia remota, por ejemplo).

Instala las dependencias del frontend:

```bash
cd pnmc-web && npm install && cd ..
```

## 3. Arranque

### Un solo comando

```bash
./scripts/dev-up.sh
```

Levanta Docker si no está abierto, prepara la base de datos, y abre la API y el frontend
cada uno en su propia ventana de Terminal (macOS).

**La primera vez que corres esto, tarda más**: `scripts/local-db-up.sh` detecta que la base
está vacía y aplica automáticamente el esquema completo y los datos de prueba
(`scripts/seed-local-db.sh`). Las siguientes veces, si la base ya tiene esquema, ese paso se
salta.

### Paso a paso, en terminales separadas

```bash
./scripts/local-db-up.sh      # base de datos: crea el contenedor y siembra si esta vacia
./scripts/api-local.sh        # API en http://127.0.0.1:8080
cd pnmc-web && npm start      # frontend en http://127.0.0.1:4200 (en otra terminal)
```

### Servicios

| Servicio | URL |
|---|---|
| Frontend | http://127.0.0.1:4200 |
| API y Swagger | http://localhost:8080/swagger |
| Salud de la API | http://localhost:8080/health/live |
| SQL Server | 127.0.0.1:14333 |

## 4. Verificar el estado

```bash
./scripts/dev-check.sh
```

Reporta, componente por componente, si Docker está corriendo, si el contenedor de la base
está activo y con esquema, si la API respondió `Healthy` o quedó en modo degradado, si el
frontend sirve, y el estado de Git. Es el primer lugar donde mirar si algo no arrancó.

## 5. Detener

```bash
./scripts/dev-down.sh
```

Cierra el frontend y la API, y detiene (no elimina) el contenedor de la base de datos. Los
datos quedan intactos para la próxima vez.

Para borrar también los datos y empezar de cero:

```bash
docker compose -f docker-compose.local.yml down -v
```

## 6. Pruebas

```bash
cd pnmc-web && npm test && npm run build
cd ../pnmc-api && dotnet test PNMC.Api.sln
```

## 7. Cuentas de prueba

`scripts/seed-local-db.sh` crea siete usuarios reales, con contraseñas de verdad (no
simuladas): el usuario del sistema y seis cuentas de prueba, una por cada rol. Todas usan
el hash que produce `Microsoft.AspNetCore.Identity.PasswordHasher` para la contraseña
`admin` — el mismo algoritmo que la API usa para validar el login. No son datos de
referencia: son cuentas con las que se puede iniciar sesión de verdad.

| Rol | Correo | Contraseña | Inicia sesión en |
|---|---|---|---|
| Webmaster (control total) | `admin@pnmc.local` | `admin` | `/admin` — botón de acceso rápido |
| Gestor interno | `gestor@pnmc.local` | `admin` | `/admin` — escribir credenciales |
| Aliado administrador | `aliado-admin@pnmc.local` | `admin` | `/admin` — escribir credenciales |
| Aliado editor | `aliado-editor@pnmc.local` | `admin` | `/admin` — escribir credenciales |
| Aliado lector | `aliado-lector@pnmc.local` | `admin` | `/admin` — escribir credenciales |
| Colaborador externo | `externo@pnmc.local` | `admin` | Ninguna consola hoy (ver aviso) |

En `/admin`, el botón **Cuentas de Prueba** (esquina inferior izquierda del login) solo
ofrece Webmaster: es el único caso de uso real de un login de un clic para evaluar la
consola completa. Las cinco cuentas restantes existen y funcionan igual de bien —
verificado contra la API—, solo que se escriben a mano en el formulario.

> **`externo@pnmc.local` no tiene consola funcional hoy.** El login institucional
> (`/admin`) la rechaza a propósito por diseño (no es una cuenta institucional). El login
> del portal externo (`POST /api/v1/external/auth/login`) sí la acepta, pero falla con 500
> al intentar registrar el inicio de sesión en la bitácora de auditoría: la restricción
> `CK_BitacoraAuditoria_Accion` no incluye el valor `iniciar_sesion_externa` que usa ese
> endpoint. Es un problema pendiente, no relacionado con la cuenta en sí.
