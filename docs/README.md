# Documentación de SIMUS

Sistema de Información de la Música en Colombia, del Plan Nacional de Música para la
Convivencia (PNMC), Ministerio de las Culturas, las Artes y los Saberes.

## Contexto institucional

El PNMC es la política pública que fomenta la práctica musical como motor de vida, paz y
justicia social. SIMUS es su sistema de información: cartografía el ecosistema musical del
país —escuelas de música, festivales, lutieres, centros de investigación— y sostiene tres
propósitos.

**Visibilizar.** Exponer públicamente la riqueza musical de las regiones en un mapa
interactivo y en catálogos consultables.

**Cogestionar.** Permitir que entidades territoriales y académicas administren de forma
descentralizada la información de su red musical.

**Participar.** Ofrecer a gestores comunitarios y ciudadanía una consola para registrar,
actualizar y reclamar sus propios procesos culturales históricos.

## Cómo está organizada esta documentación

### Producto

| Documento | Contenido |
|---|---|
| [Visión y alcance](producto/vision-y-alcance.md) | Referencia conceptual aprobada: qué es SIMUS, qué información gobierna, para quién y con qué límites. |
| [Hoja de ruta](producto/hoja-de-ruta.md) | Fases, épicas, dependencias y criterios de cierre. |

### Técnico

| Documento | Contenido |
|---|---|
| [Arquitectura](tecnico/arquitectura.md) | Estado técnico, alternativas evaluadas y arquitectura objetivo. Identidad, autorización, gobierno del dato, analítica, migración. |
| [Arquitectura y estructura](tecnico/arquitectura-y-estructura.md) | Estructura de archivos del frontend y el backend, y esquema relacional vigente. |
| [Guía de instalación](tecnico/guia-instalacion.md) | Requisitos, variables de entorno, montaje local y credenciales de desarrollo. |
| [Auditoría y notificaciones](tecnico/auditoria-y-notificaciones.md) | Trazabilidad de cambios, interceptores de EF Core y buzón interno. |

### Funcional

| Documento | Contenido |
|---|---|
| [Inventario funcional y rutas](funcional/inventario-y-rutas.md) | Qué hace la plataforma, para quién, en qué estado y sobre qué rutas. |
| [Mapa ecosistémico](funcional/mapa-ecosistemico.md) | Capa geográfica: Leaflet, agrupamiento, mapa de calor, coropletas y sincronización DIVIPOLA. |
| [Portal público y CMS](funcional/portal-publico-y-cms.md) | Textos dinámicos, carrusel de estrategias, buscador editorial y filtros de eventos. |

### Gobernanza

| Documento | Contenido |
|---|---|
| [Manual de roles](gobernanza/manual-de-roles.md) | Matriz de permisos por rol y su homologación entre base de datos e interfaz. |
| [Convenios y privilegios](gobernanza/convenios-y-privilegios.md) | Base legal de habeas data, enmascaramiento de datos personales y acceso privilegiado de aliados. |
| [Motor de reclamaciones](gobernanza/motor-de-reclamaciones.md) | Registros huérfanos, escaneo territorial, bandeja de coincidencias y clonación editorial. |

### Operación

| Documento | Contenido |
|---|---|
| [Respaldo y restauración](operacion/respaldo-y-restauracion.md) | Qué se respalda, con qué periodicidad, cómo se verifica y cómo se restaura. |

### Calidad y deuda técnica

| Documento | Contenido |
|---|---|
| [Deuda técnica](backlog/deuda-tecnica.md) | Refactorizaciones pendientes y desacoplamiento modular. |
| [Seguridad y hardening](backlog/seguridad-y-hardening.md) | Vulnerabilidades de dependencias, blindaje de endpoints, CSP y límites de tasa. |
| [Accesibilidad WCAG 2.1 AA](backlog/accesibilidad-wcag.md) | Auditorías, contrastes, foco, teclado y accesibilidad del mapa. |
| [Historias de usuario](backlog/historias-de-usuario.md) | Historias de la web, por experiencia. |

### Marca

`marca/` contiene la identidad visual: logos y firma institucional en `assets/`, propuestas
en SVG en `propuestas/` y el Manual de Marca en `pdf/`. Los PDF se regeneran con los
scripts de `../tools/`.

### Informes

`informes/` reúne los entregables: el informe final de entrega, el informe de QA de
interfaz y experiencia, y el avance general del proyecto.

### Archivo

`archivo/` conserva documentos históricos que ya no describen el estado vigente pero
sustentan las decisiones tomadas: el [diagnóstico de agosto de 2026](archivo/diagnostico-2026-08.md),
la [línea base técnica](archivo/linea-base-2026-08.md) de ese momento y la
[propuesta de piloto de organizaciones](archivo/propuesta-piloto-organizaciones.md), que no
fue aprobada.

## Convenciones

Los documentos usan nombres en minúscula separados por guiones. Las rutas entre documentos
son relativas, para que la documentación funcione en cualquier máquina al clonar el
repositorio.

Cuando un cambio de código altere lo que describe un documento, se actualiza el documento
en el mismo commit. Los cambios de arquitectura se resumen además en
[`../CHANGELOG.md`](../CHANGELOG.md).
