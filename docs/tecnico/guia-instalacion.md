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

## 6. Datos de prueba conocidos

`scripts/seed-local-db.sh` aplica nueve archivos de esquema y siete de datos de prueba. Uno
de ellos, `pnmc-database/seed/V20260519_07__datos_moderacion_consola.sql` —datos exhaustivos
pensados para probar la consola de moderación— falla al aplicarse: hace referencia a
usuarios de prueba (`IdUsuario` 3, 4, 5 y 7) que ningún script anterior crea.

Este fallo **no impide usar la aplicación**: el resto del esquema y de los datos de prueba
se cargan con normalidad, y `seed-local-db.sh` continúa e informa claramente cuál semilla
quedó pendiente. Es un problema conocido y documentado, no un síntoma de que algo salió mal
en tu instalación. Corregirlo implica crear esos usuarios de prueba con los roles correctos,
algo pendiente de hacer con cuidado para no introducir datos inconsistentes con el resto del
set de pruebas.

## 7. Pruebas

```bash
cd pnmc-web && npm test && npm run build
cd ../pnmc-api && dotnet test PNMC.Api.sln
```

## 8. Credenciales sembradas para pruebas locales

Una vez aplicadas las semillas, estas cuentas quedan disponibles:

| Rol | Correo | Contraseña | Consola |
|---|---|---|---|
| Webmaster (admin central) | `admin@pnmc.local` | `pnmc-master` | `/admin` |
| Gestor interno | `gestor@pnmc.local` | `pnmc-gestor` | `/admin` |
| Aliado coordinador | `aliado-admin@pnmc.local` | `pnmc-aliado` | `/colaboradores` |
| Colaborador externo | `externo@pnmc.local` | `pnmc-externo` | `/colaboradores` |
