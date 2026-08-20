# Registro de cambios

Cambios relevantes de SIMUS. Las versiones corresponden a tags del repositorio.

## Sin versión — rutas de acceso separadas, 2026-08-20

`/admin` y `/simus/ingresar` eran las únicas puertas de entrada, y el panel institucional
tenía un botón para saltar al portal externo dentro de la misma página (y viceversa). Nada
distinguía, por la URL, a qué público se dirigía cada acceso.

### Cambiado

- `/admin` se retira sin redirección. Es la primera ruta que cualquiera prueba al adivinar
  un panel de administración, y una redirección seguiría confirmando que existe: ahora
  devuelve el 404 genérico, sin pistas. La reemplaza `/consola-interna`.
- Nueva ruta de primer nivel `/ingreso` para el login externo, junto a `/registro` que ya
  existía para el registro. Las dos cargan `ExternalAccessPageComponent` con la pestaña
  correspondiente activa por defecto. `/simus/ingresar` queda como redirección a `/ingreso`.
- Se retiran los botones que alternaban entre modo institucional y externo dentro de la
  misma página. Cada URL es ahora de un solo público; el cruce entre ambas se hace con
  enlaces reales a la ruta del otro público, no con estado interno del componente.

Verificado en el navegador: `/admin` da 404 genérico, `/consola-interna` y `/colaboradores`
inician sesión de verdad (webmaster y externo respectivamente), y los enlaces cruzados
entre ambas páginas navegan correctamente. 49/49 pruebas de API, compilación correcta.

### Documentación

Corregida una inexactitud real, no introducida hoy: `docs/gobernanza/manual-de-roles.md`
indicaba que los tres roles de aliado iniciaban sesión en `/colaboradores`; verificado por
API que en realidad lo hacen por la consola institucional (hoy `/consola-interna`) — el
login externo rechaza cualquier rol que no sea `externo`. Actualizadas también las demás
menciones de `/admin` en la documentación vigente (`docs/archivo/` no se toca: es historial
congelado).

## Sin versión — verificación del arranque desde cero, 2026-08-20

La línea base se había dado por buena sin probar nunca un clon completamente nuevo, con la
base de datos vacía de verdad. Al hacer esa prueba aparecieron cuatro fallas, las cuatro
reproducibles al 100% para cualquiera que clonara el repositorio. Corregidas y confirmado
que ahora arranca limpio de punta a punta, con 49/49 pruebas de API y compilación correcta.

### Corregido

- Un clon nuevo nunca tenía esquema de base de datos: `local-db-up.sh` solo creaba la base
  vacía y nada llamaba a `seed-local-db.sh`. La API arrancaba siempre en modo degradado.
  Ahora `local-db-up.sh` detecta si la base tiene esquema y siembra automáticamente si no.
- `seed-local-db.sh` entregaba cada script `.sql` por `stdin`, y el comentario `/* ... */`
  inicial de cada archivo se interpretaba mal, dejando la carga a medias con errores de
  sintaxis falsos. Ahora los archivos se leen con `-i`, sin ambigüedad.
- El script de esquema de roles y aliados intentaba renombrar una columna mientras su CHECK
  constraint seguía activo, algo que SQL Server rechaza siempre. Fallaba en el 100% de las
  bases nuevas, no solo al migrar una base antigua.
- Un `ALTER TABLE` y el `CREATE INDEX` que dependía de él viajaban en el mismo lote SQL;
  SQL Server resuelve nombres de columna al compilar el lote completo, así que el índice
  fallaba con "Invalid column name" aunque la columna ya existiera. Se separaron en dos
  lotes.
- Una semilla de datos de moderación perdía el estado del cursor al aplicarse, por faltarle
  `SET NOCOUNT ON` antes de varios `DELETE` seguidos.

### Añadido

- `scripts/dev-check.sh` ahora reporta el estado real de cada componente (Docker, esquema
  de base de datos, API, frontend, Git), no solo códigos HTTP crudos.
- Seis cuentas de prueba reales, una por rol, sembradas por SQL con contraseñas que
  funcionan de verdad (`pnmc-database/seed/V20260820_01__usuarios_prueba_seed.sql`). Son
  las mismas que autocompleta el botón "Cuentas de Prueba" del login
  (`admin-login.component.ts`), que hasta ahora dependía de que la API hubiera arrancado
  al menos una vez con `Database:SeedBootstrapUsers` activo para existir. Verificado con
  login real en el navegador, con dos roles distintos.

### Corregido (continuación)

- Como efecto directo de sembrar esas seis cuentas, `V20260519_07__datos_moderacion_consola.sql`
  —que ya las esperaba, por sus mismos `IdUsuario`— ahora se aplica completa. Se le agregó
  además `SET QUOTED_IDENTIFIER ON`, requerido por el índice filtrado que se añadió en el
  punto anterior.
- La tabla de credenciales de prueba en `docs/tecnico/guia-instalacion.md` documentaba
  contraseñas que no correspondían a ninguna cuenta real y le faltaban dos de los seis
  roles. Corregida.
- `EntidadesAliadas` nunca tenía la columna `LogoUrl`, por el mismo tipo de problema: en
  una base nueva la tabla se crea primero con el nombre viejo (`EntidadesColaboradoras`,
  sin esa columna) y luego se renombra; el renombrado copia columnas existentes pero no
  agrega las que son enteramente nuevas. Iniciar sesión con cualquier cuenta de aliado
  fallaba con 500. Verificado el arreglo con la API respondiendo 200 a ese login.

### Cambiado

- El panel "Cuentas de Prueba" del login pasó de seis atajos a uno solo (webmaster).
  `gestor_interno` y las tres cuentas de aliado se retiraron porque su consola es una
  línea de trabajo aparte, no un atajo de evaluación rápida; `externo` se retiró porque
  nunca pudo funcionar ahí — `AdminAuthEndpoints` rechaza ese rol a propósito en el login
  institucional. Las seis cuentas siguen existiendo y funcionando si se escriben las
  credenciales a mano; solo cambió cuáles tienen botón de acceso directo.

- `CK_BitacoraAuditoria_Accion` solo permitía 9 valores, pero el código real escribe 19
  distintos. Los 10 que faltaban rompían, cada uno con un 500, el login y cierre de sesión
  externos, la creación de organizaciones externas, la asignación de administrador inicial
  y las cinco acciones de revisión de solicitudes de aliado. Ampliada a los 19 valores que
  el código usa, verificado con búsqueda exhaustiva de cada `WriteAuditAsync` del proyecto.
- El portal de colaboradores externos (botón "Ingresar al Portal de Colaboradores
  Externos") nunca pudo iniciar sesión: su formulario llamaba a `sessionService.login()`,
  que solo habla con la API institucional — la misma que rechaza a propósito el rol
  `externo`. `AdminService.loginExternal()` ya existía, correctamente conectado al
  endpoint externo, pero nada lo llamaba. Corregido y verificado con un login real: entra
  al panel de colaborador con sus procesos culturales y ficha de caracterización.

### Conocido, no resuelto

- `/api/v1/admin/data/records/*` y `/api/v1/admin/data/monitor` devuelven 401 sin importar
  el rol, incluido webmaster con control total. No es un problema de permisos: es previo a
  esta sesión de trabajo, afecta al panel de gestión de datos y monitoreo técnico del
  dashboard, y probablemente esté en cómo el frontend envía credenciales a esas rutas
  puntuales. Queda pendiente de investigar; no bloquea el login ni el resto de la
  aplicación.

## v0.0-base — 2026-08-20

Línea base depurada. Punto de partida para el desarrollo posterior.

### Añadido

- Solicitudes de administración de festival: una organización externa puede solicitar el
  reconocimiento de la administración de un festival, y la institución revisa, pide
  información adicional y decide. Incluye endpoints externos e institucionales, entidad,
  contratos, panel institucional de gobierno y pruebas de integración del circuito.
- `CONTRIBUTING.md` con las convenciones de ramas, commits y tags.
- Este registro de cambios.

### Cambiado

- La creación de la versión vigente de un festival se centraliza en un único punto.
- Interfaz de acceso externo, continuando el patrón visual de la pantalla de ingreso y
  registro.
- La documentación se consolidó en `docs/`, organizada por producto, técnico, funcional,
  gobernanza, operación, calidad, marca, informes y archivo. Los documentos fragmentados
  del proceso de diagnóstico y arquitectura se integraron en documentos únicos.
- El material de marca pasó de `output/` a `docs/marca/`, y los generadores de `tools/`
  apuntan a la nueva ruta.

### Retirado

- `tmp/pdfs`: 708 artefactos intermedios de la generación del manual de marca que estaban
  bajo control de versiones.
- `pnmc-web/public/Galeria/Galeria`: 255 archivos que repetían byte a byte el contenido de
  su carpeta madre, sin referencias en el código.
- Los lanzadores `Iniciar PNMC.command` y `Detener PNMC.command` de la raíz. El punto de
  entrada son los scripts de `scripts/`.
- La configuración de agentes (`.agents/`, `.claude/`, `skills-lock.json`), que es local y
  no forma parte del proyecto.

### Seguridad

- `appsettings.Local.json` contenía la contraseña de la base de datos local y no estaba
  cubierto por `.gitignore`. Se añadió, junto con `tmp/` y la configuración de agentes.

### Notas de migración

Las once ramas de trabajo integradas —ocho `cv/*`, `mantenimiento/preproduccion-festival`,
`piloto/pv-01-coincidencias-festival` y `piloto/002-acceso`— se cerraron tras verificar su
integración en `main`. Los tags de cada entrega se conservan.

## Entregas anteriores

Documentadas mediante tags, sin registro narrativo:

| Tag | Entrega |
|---|---|
| `simus-impl-001-cv004` | Registro de organización |
| `simus-impl-002-cv005` | Festival en borrador |
| `simus-impl-003-cv006` | Envío a revisión |
| `simus-impl-004-cv007` | Revisión institucional |
| `simus-impl-005-cv008` | Consulta pública de festival |
| `simus-impl-006-cv009` | Cambios sobre festival publicado |
| `simus-impl-007-cv010` | Gobierno de propuestas de festival |
| `simus-impl-008-cv011` | Analítica y mapa de gobernados |
| `simus-piloto-001-pv01` | Coincidencias con festivales históricos |
| `simus-piloto-002-acceso` | Acceso externo |
| `simus-preprod-001-festival` | Saneamiento de preproducción |
