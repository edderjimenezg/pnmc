# Registro de cambios

Cambios relevantes de SIMUS. Las versiones corresponden a tags del repositorio.

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

### Conocido, no resuelto

- La semilla `V20260519_07__datos_moderacion_consola.sql` sigue sin poder aplicarse
  completa: hace referencia a usuarios de prueba que ningún script crea. No bloquea el uso
  de la aplicación; ver `docs/tecnico/guia-instalacion.md`, sección "Datos de prueba
  conocidos".

### Añadido

- `scripts/dev-check.sh` ahora reporta el estado real de cada componente (Docker, esquema
  de base de datos, API, frontend, Git), no solo códigos HTTP crudos.

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
