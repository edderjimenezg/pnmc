# Registro de cambios

Cambios relevantes de SIMUS. Las versiones corresponden a tags del repositorio.

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
