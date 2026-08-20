# Diagnóstico de SIMUS — agosto de 2026

Análisis del sistema tal como estaba antes de la reconstrucción: cartografía funcional,
núcleo informacional, experiencias públicas y autenticadas, modelo de datos, identidad y
acceso, gobierno del dato, dependencias entre módulos y brechas detectadas.

Es un documento histórico. Describe un estado que ya cambió y se conserva porque sustenta
las decisiones de arquitectura y la hoja de ruta. Para el estado vigente, ver
`../tecnico/arquitectura.md`.

## SIMUS actual

### Tres perspectivas

| Perspectiva | Lectura | Evidencia / estado |
|---|---|---|
| SIMUS institucional | Actualización del Sistema de Información de la Música dentro de Información y comunicación del PNMC. | VERIFICADO en contexto institucional. |
| SIMUS implementado | Ruta pública `/simus`, catálogos, mapa, escuelas, procesos, entidades, administración y API de datos. | VERIFICADO/PARCIAL. |
| Fronteras observables | Información sectorial, contenidos públicos, gestión editorial, participación, gobernanza y administración. | HIPÓTESIS basada en responsabilidades. |

### Hallazgos

- Se nombran explícitamente SIMUS: `/simus`, `SimusHomePage`, categorías del ecosistema y catálogo de escuelas. **VERIFICADO**.
- Festivales, escuelas, mercados, organizaciones, espacios, relaciones, calidad, duplicados y solicitudes de vínculo encajan con la hipótesis de núcleo informacional aunque varios no lleven “SIMUS” en su nombre. **VERIFICADO/PARCIAL**.
- Agenda, noticias, editorial, galería y contenidos PNMC son parte de la misma aplicación, API y consola. Su pertenencia institucional precisa a SIMUS no está definida por el código. **VERIFICADO/TBC**.
- Se almacenan contenidos, territorialidad DIVIPOLA, procesos, organizaciones, usuarios, roles, relaciones, archivos, notificaciones y gobernanza de registros. **VERIFICADO**.
- Se publican contenidos, mapa, catálogos y fichas de escuelas. La publicación de los demás procesos está incompleta o usa rutas “próximamente”. **PARCIAL**.
- Usuarios observados: visitantes, administradores internos, externos y aliados. La organización como alcance de interfaz completa es **PARCIAL**.

No hay una frontera técnica clara SIMUS–PNMC ni sistema de información–portal: ambos comparten frontend, API, datos y administración. Las redirecciones heredadas `ecosistema/* → simus/*` evidencian evolución por agregación. **VERIFICADO**.

## Cartografía funcional SIMUS

| Responsabilidad | Usuarios | Frontend / API / datos | Persistencia y estado | Relación SIMUS / PNMC |
|---|---|---|---|---|
| Información sectorial | Público, gestión | SIMUS, mapa; catálogo y entidades; procesos/relaciones | SQL; PARCIAL | Núcleo SIMUS; PNMC indirecta. |
| Contenidos PNMC | Público, editores | Home, ejes, estrategias; noticias/agenda/editorial | SQL y configuraciones; PARCIAL | PNMC explícito; pertenencia SIMUS TBC. |
| Territorialidad y mapa | Público, gestión | Mapa Leaflet; Map endpoints; DIVIPOLA/GeoJSON | SQL y archivos; PARCIAL | SIMUS probable; PNMC transversal. |
| Identidad y acceso | Externos, aliados, admin | Shell; auth endpoints; users/roles | SQL; PARCIAL | Transversal. |
| Gobernanza | Revisores, administración | Paneles; vínculo/duplicado/calidad | SQL; API VERIFICADA, UI PARCIAL | Núcleo SIMUS. |
| Importación | Administración | ExcelJS/panel; bulk API | Persistencia parcial; MOCK fallback | Núcleo SIMUS. |
| Participación | Público | API y compatibilidad heredada | SQL; UI TBC | PNMC/SIMUS TBC. |
| Notificaciones | Usuarios autenticados | Shell/API | SQL; PARCIAL | Transversal. |
| Aliados | Aliados y admin | Mismo shell; Ally API | SQL; PARCIAL | Transversal. |

La cartografía describe responsabilidades, no propone módulos ni despliegues.

## Núcleo informacional actual

Existe de facto un núcleo distribuido, no un módulo declarado: catálogo de procesos y organizaciones, datos maestros (categorías, estados, tags, DIVIPOLA), usuarios/roles, relaciones, perfiles de entidad y gobernanza. **VERIFICADO**.

| Capacidad | Evidencia | Estado |
|---|---|---|
| Registro de procesos y entidades | `FestivalRow`, `SchoolRow`, `MarketRow`, `OrganizationRow`, endpoints de catálogo/admin | VERIFICADO/PARCIAL |
| Datos maestros y territorio | categorías, estados, etiquetas, DIVIPOLA | VERIFICADO |
| Identidad y roles | Users, Roles, códigos de verificación, aliados | VERIFICADO/PARCIAL |
| Vínculos y duplicados | RecordLinkRequests, candidatos y decisiones | VERIFICADO |
| Calidad y trazabilidad | QualityFlags, AuditLogs, historial de entidad | VERIFICADO/PARCIAL |
| Procedencia e importación por lote | source records y carga masiva | PARCIAL; reversión/lote TBC |

El frontend que lo utiliza es principalmente `AdminShellPage` y los paneles de administración; también lo consultan mapa, SIMUS y escuela. Se mezcla con contenidos por compartir consola y contratos administrativos. No se rediseña aquí.

## Experiencia pública actual

| Elemento | Propósito y audiencia | Fuente/API | Dependencia |
|---|---|---|---|
| Inicio, PNMC, ejes, estrategias | Información institucional y editorial | configuraciones, textos y contenidos | PNMC explícito |
| Noticias, agenda, editorial, galería | Consulta y difusión pública | endpoints propios; administración de contenidos | contenidos, archivos, categorías |
| Mapa | Lectura territorial del ecosistema | Map + catálogo + DIVIPOLA | información sectorial |
| SIMUS, escuelas y fichas | Consulta de registros | catálogo y procesos | núcleo informacional |
| Participación | Aporte de ciudadanía | Participation API | flujo transversal |

Hay una sola aplicación pública con al menos tres intenciones mezcladas: portal PNMC, exploración SIMUS y servicios de participación. **VERIFICADO**. No hay evidencia de estadísticas públicas independientes; queda **TBC**.

## Relación PNMC ↔ SIMUS

### Evidencia encontrada

PNMC aparece en `/pnmc`, ejes, componentes y estrategias; SIMUS aparece en `/simus`, mapa y catálogos. Ambos comparten inicio, navegación, estilos, API, administración y modelos transversales como categorías, estados, usuarios y territorio. **VERIFICADO**.

### Interpretación

El código materializa un entorno único que comunica el PNMC y ofrece información/servicios SIMUS. No prueba por sí mismo si PNMC es un módulo, portal o contexto institucional de SIMUS. **HIPÓTESIS**.

### Preguntas pendientes

¿Qué contenidos del PNMC son objetos informacionales del SIMUS? ¿Quién gobierna cada línea editorial? ¿Qué debe poder operar de forma autónoma si cambia el portal público? **TBC**.

## Productos y experiencias especializadas

| Elemento | Lectura actual | Evidencia | Ambigüedad |
|---|---|---|---|
| Mapa ecosistémico | aplicativo/experiencia especializada | página Leaflet, endpoints geográficos y de resumen | módulo interno vs producto consultor. |
| Agenda | sección de contenidos con transacción administrativa | endpoints, panel de registro, ICS | producto autónomo TBC. |
| Catálogos | capacidad de consulta de información | escuelas, festivales, mercados, entidades | catálogo vs núcleo. |
| Editorial | portal/sección editorial | resources y página pública | pertenencia a SIMUS TBC. |
| Participación | servicio transversal | submissions y compatibilidad | recorrido público no confirmado. |
| Celebra la Música | estrategia/contenido PNMC | textos, tarjetas, página de estrategia y CTA | no hay aplicación/portal independiente. |

La categoría correcta depende de usuarios, gobierno, ciclo de vida y datos compartidos, no de una carpeta actual.

## Mapa ecosistémico actual

Propósito: exploración territorial de procesos y datos musicales para público y gestión. Usa Leaflet y MarkerCluster; consume TopoJSON/GeoJSON territorial, resumen y catálogos de festivales, escuelas, mercados, organizaciones, espacios y relaciones. **VERIFICADO**.

Los filtros, capas y registros se configuran en frontend; DIVIPOLA aporta territorialidad. Existe ficha pública de escuela; las demás fichas son **PARCIALES** o “próximamente”. La administración se realiza indirectamente desde la consola de registros, no en el mapa. La relación con contenidos es visual/editorial; la relación con SIMUS es fuerte por los catálogos y territorialidad.

| Lectura | Ventaja | Límite / implicación |
|---|---|---|
| A. Módulo interno SIMUS | coherencia de datos y navegación | acopla evolución de UX a la aplicación general. |
| B. Aplicativo especializado del ecosistema | puede tener ciclo y UX propios | exige contratos, gobierno y soporte explícitos. |
| C. Visor público compartido | reutilizable por PNMC y otros productos | necesita definir responsable de datos y publicación. |

No se selecciona alternativa.

## Portales especializados

Una experiencia pública general presenta múltiples propósitos y audiencias; un portal especializado concentra una necesidad, vocabulario, navegación, gobierno de contenido y métricas propios, aunque consulte información central compartida. Esta es una definición operativa, no una decisión técnica.

No existe evidencia en el repositorio de un portal independiente de Celebra la Música. Sí hay una estrategia visible en inicio, contenido de estrategia y textos administrables. **VERIFICADO**. Por tanto, tratarla hoy como portal sería una **HIPÓTESIS**, no una descripción de lo implementado.

Conceptualmente, un portal podría consultar catálogos, agenda o mapa central mediante API, sin tener que administrar la fuente de esos datos. Esto requiere acordar permisos de publicación, atributos compartidos y propiedad editorial. **TBC**.

## Taxonomía de productos digitales

| Término | Definición funcional | Ejemplo del proyecto | Riesgo de uso impreciso |
|---|---|---|---|
| Sistema de información | Recursos organizados para recolectar, mantener, usar y difundir información. | SIMUS institucional; catálogo/gobernanza implementados. | Llamar “sistema” a una sola pantalla. |
| Núcleo informacional | PROPUESTA: capacidades compartidas que identifican, relacionan y gobiernan datos. | procesos, entidades, territorio, calidad. | Confundirlo con una base de datos aislada. |
| Experiencia pública | Interfaz para consulta, comprensión o transacción de usuarios externos. | home, mapa, SIMUS, contenidos. | Ocultar que depende de procesos internos. |
| Portal | Experiencia orientada a una comunidad o propósito especializado. | Ninguno independiente verificado; editorial es caso ambiguo. | Declarar independencia sin gobierno propio. |
| Aplicativo | Herramienta enfocada a una tarea o flujo delimitado. | mapa: hipótesis razonable. | Nombrar aplicativo a toda la plataforma. |
| Plataforma | Conjunto que habilita múltiples productos/servicios compartiendo capacidades. | SIMUS como ecosistema: hipótesis. | Usarlo como sinónimo de web. |
| Módulo | Parte cohesionada de una aplicación con responsabilidad delimitada. | agenda, galería, admin. | Confundir módulo conceptual con NgModule Angular. |
| Servicio | Lo necesario de extremo a extremo para lograr un resultado de usuario. | registro y reclamación: parcial. | Reducirlo a un endpoint. |
| Dominio de información | Conceptos y reglas que describen una parte del mundo. | organizaciones, procesos, contenidos. | Mezclar entidades sin lenguaje común. |

La definición NIST respalda distinguir recursos de información; GOV.UK sitúa servicios como resultados de extremo a extremo, incluidos sistemas públicos e internos. **PROPUESTA**: usar “núcleo informacional” para el conjunto de datos y gobierno, no como nombre de un componente técnico.

## Dominios de información

```text
Usuario ──rol/alcance──> Entidad / aliado
Entidad ──relación──> Proceso (festival, escuela, mercado, espacio)
Proceso ──ubicación──> DIVIPOLA
Proceso ──estado/categoría──> datos maestros
Registro ──solicitud──> vínculo / duplicado / calidad
Contenido (noticia, agenda, editorial, galería) ──tags/archivos──> publicación
```

| Concepto | Nivel observable | Inconsistencia o vacío |
|---|---|---|
| Persona / usuario | identidad de acceso | persona no equivale necesariamente a organización. |
| Entidad / organización | actor institucional | ambos existen; frontera semántica y cardinalidad TBC. |
| Agente | concepto de negocio | no aparece como entidad inequívoca. |
| Proceso | categoría transversal | se implementa por tablas específicas. |
| Festival, escuela, mercado, espacio | tipos de registro | difieren en atributos; no forzar modelo idéntico. |
| Taller, evento, proyecto | hipótesis solicitadas | no se verificaron como tablas completas. |

## Modelo de datos actual

| Grupo | Entidades/tablas observables | Papel |
|---|---|---|
| Maestros | Categories, ContentStatuses, Tags, DivipolaLocations | clasificación, estado, territorio. |
| Información sectorial | Festivals, Schools, Markets, Organizations, SpacesInfrastructure, relaciones | registros y vínculos. |
| Contenidos | AgendaEvents, NewsArticles, GalleryAlbums, EditorialCatalogResources, Files | publicación editorial. |
| Acceso | Users, Roles, UserVerificationCodes, Ally* | identidad y alcance. |
| Gobernanza | AuditLogs, RecordLinkRequests, DuplicateCandidates, QualityFlags, Entity* | revisión y trazabilidad. |
| Participación | ParticipationSubmissions, Notifications | interacción transversal. |

Las claves son principalmente enteros; relaciones explícitas incluyen proceso-entidad, proceso-proceso, usuario-entidad y entidades fuente/revisión. Cardinalidades completas deben validarse contra SQL y migraciones antes de cualquier migración. **PARCIAL**.

Información central: maestros, sectorial y gobernanza. Información de contenidos: agenda/noticias/editorial/galería. Administración: usuarios, roles, logs y estados. Transversal: archivos, etiquetas y territorio.

## Identidad y acceso

```text
persona/organización (registro externo)
  ↓ validación de correo, territorio y consentimientos
UserRow (rol externo, activo tras verificación)
  ↓ cookie de sesión: flujo admin verificado; externo TBC
rol y, para aliados, vínculo con entidad
  ↓ autorización API
funcionalidad y datos permitidos
```

Administradores: autenticación por cookies y roles internos. Externos: API permite registro/verificación. Aliados: tablas y endpoints de entidad/vínculo aliado. Colaboradores: el término aparece asociado a ruta/UI, pero su definición de rol no es inequívoca. Organizaciones: API recibe nombre en registro externo y existen entidades/organizaciones, pero no hay panel de organización separado. **PARCIAL**.

El backend aplica autorización a endpoints sensibles. El router Angular no aplica el guard existente y este permite continuar sin sesión; por tanto el frontend no reconstruye aún el recorrido anterior de manera segura para UX. **VERIFICADO**.

## Administración actual

El panel `AdminShellPageComponent` concentra login, usuarios, monitor, registros, revisión, textos web, sistema, entidades, gobernanza, IA asistiva y dashboard externo. Se carga en `/admin` y `/colaboradores`. **VERIFICADO**.

| Función | Clasificación principal |
|---|---|
| Registros, entidades, relaciones, importación, calidad, duplicados | núcleo informacional |
| Noticias, agenda, editorial, galería, textos web | contenidos / PNMC según caso |
| Usuarios, roles, monitor, configuración, auditoría | administración transversal |
| Ally dashboard y solicitudes | aliado / TBC |
| Asistente IA | herramienta experimental; TBC |

La clasificación es funcional: la interfaz no está separada de ese modo. No se propone aún una nueva interfaz.

## Importación, gobernanza y trazabilidad

| Paso | Evidencia | Estado |
|---|---|---|
| Fuente | `EntitySourceRecords`, textos de importación | PARCIAL |
| Importación | ExcelJS, mapeo de encabezados, endpoint bulk | VERIFICADO |
| Normalización | funciones de encabezado y claves de duplicado | PARCIAL |
| Registro | endpoints administrativos y tablas específicas | VERIFICADO |
| Calidad | `RecordQualityFlags` | VERIFICADO |
| Duplicado | candidatos, niveles y decisión | VERIFICADO |
| Vinculación | solicitudes y revisión | VERIFICADO |
| Actualización | endpoints/paneles de estado | VERIFICADO/PARCIAL |
| Publicación | estados y API pública | PARCIAL |

No se comprobó lote persistente con archivo, fecha, responsable, identificador original y reversión como unidad. Por ello la trazabilidad completa de una importación histórica es **TBC**. Los fallbacks mock de la UI no prueban integración.

## Mocks, prototipos y funcionalidad real

| Capacidad | Pantalla | Integrada | Persistida/autorizada |
|---|---|---|---|
| Mapa y catálogos | Sí | Sí, con fallbacks | PARCIAL según datos disponibles |
| Administración de registros | Sí | Sí, con fallback | PARCIAL |
| Dashboard externo / procesos | Sí | Parcial | MOCK en varios arreglos locales |
| Gobernanza de vínculos, duplicados, calidad | Sí | API sí; UI parcial | API autorizada, flujo completo PARCIAL |
| Registro externo | UI no identificada | API sí | persistida, verificación sí |
| IA asistiva | Sí | procesamiento local/administrativo | no validar como IA productiva |

La distinción evita tratar una interfaz visible como evidencia de proceso real. La clasificación se basa en código; producción y datos reales siguen **TBC**.

## API y servicios

```text
Página Angular → servicio (`AdminService`, `BackendDataService`, `MapDataService`, etc.)
→ `/api/v1/*` → endpoint Minimal API → DbContext/entidad → SQL
```

| Área frontend | API | Dominio/dato |
|---|---|---|
| Mapa y SIMUS | map, catálogo | territorio, procesos, entidades |
| Contenidos | news, agenda, editorial, gallery | artículos, eventos, recursos, archivos |
| Administración | admin/auth, admin/data, admin/entities | usuarios, registros, monitor, entidades |
| Identidad externa | external/auth | usuarios, verificación |
| Gobernanza | record-link, duplicates, data-quality | solicitudes, candidatos, alertas |
| Aliados/participación | ally, participation, notifications | alcance, aportes, avisos |

Servicios transversales observados: cliente HTTP, sesión, administración, catálogo, backend de datos, mapa y textos web. La relación exacta pantalla-endpoint debe mantenerse como inventario ejecutable antes de una división técnica; hay 79 mapeos de métodos de endpoint observados. **VERIFICADO**.

## Matriz maestra SIMUS

| Área | Responsabilidad | Usuario | Frontend | API | Datos | Estado | Relación SIMUS | Relación PNMC | Posible capa conceptual |
|---|---|---|---|---|---|---|---|---|---|
| Catálogo | registros sectoriales | público/gestión | SIMUS, mapa | catálogo | procesos | PARCIAL | directa | indirecta | núcleo informacional |
| Mapa | lectura territorial | público | Leaflet | map | territorio/procesos | PARCIAL | directa | transversal | aplicativo |
| Contenidos | difusión | público/editor | páginas públicas | content APIs | contenidos | PARCIAL | TBC | directa | experiencia pública |
| Identidad | acceso | todos | shell | auth | users/roles | PARCIAL | transversal | transversal | transversal |
| Gobernanza | calidad/vínculo | revisión | admin | governance | requests/flags | PARCIAL | directa | indirecta | núcleo informacional |
| Importación | incorporación | admin | records panel | bulk | procesos/fuente | PARCIAL | directa | indirecta | núcleo informacional |
| Aliados | colaboración | aliado/admin | shell | ally | ally links | PARCIAL | transversal | transversal | TBC |

La última columna es hipótesis; no es diseño definitivo.

## Dependencias y acoplamientos

| Tipo | Evidencia | Consecuencia |
|---|---|---|
| Funcional | catálogo alimenta mapa, SIMUS y fichas | cambios de publicación afectan varias experiencias. |
| Datos | territorio, categorías, estados y archivos se reutilizan | son candidatos a capacidades compartidas. |
| Técnica | un Angular, una API y DbContext común | facilita entrega actual; limita aislamiento. |
| Visual | navegación, estilos y shared UI comunes | identidad consistente, cambios transversales costosos. |
| Histórica accidental | `ecosistema/*` redirige a `simus/*`; admin/colaboradores comparten shell | evidencia de agregación, no necesariamente decisión vigente. |

El acoplamiento no prueba que deba dividirse. Primero se debe decidir gobierno de datos, usuarios y ciclos de publicación.

## Modelos conceptuales posibles

| Modelo | Coherencia con lo existente | Ventajas | Riesgos |
|---|---|---|---|
| A. Plataforma integrada única | Alta a corto plazo: una app, API, DB y consola. | operación simple, navegación y datos compartidos. | panel y responsabilidades siguen creciendo mezclados. |
| B. Núcleo informacional + experiencias especializadas | Media-alta: catálogo, gobernanza y mapa ya sugieren fronteras. | aclara propiedad de datos y permite UX específica. | exige contratos, criterios de publicación y gobierno. |
| C. Ecosistema digital con servicios compartidos | Media: coherente con hipótesis institucional. | puede articular portales, aplicaciones y PNMC sin negar identidad SIMUS. | puede convertirse en abstracción prematura si no hay responsables/casos reales. |

Los tres modelos pueden conservar un backend común inicialmente. Cambiar la conceptualización no obliga a dividir repositorios, API o bases. Ningún modelo se adopta en esta fase.

## Preguntas de producto y arquitectura

| Tema | Pregunta en lenguaje claro | Por qué importa técnicamente |
|---|---|---|
| Identidad SIMUS | ¿Qué debe reconocer una persona cuando dice “SIMUS”: datos, portal, servicios o todo el ecosistema? | Define nombres, navegación, propiedad y alcance. |
| PNMC | ¿Qué información PNMC debe administrarse como contenido y cuál como dato sectorial? | Separa ciclos editoriales de gobierno de datos. |
| Núcleo | ¿Cuáles son los registros oficiales y quién responde por su calidad? | Define fuentes, estados, auditoría y publicación. |
| Experiencia pública | ¿Qué necesitan consultar ciudadanía, investigadores y gestores? | Prioriza rutas, búsqueda, accesibilidad y datos públicos. |
| Portales/aplicativos | ¿Qué producto requiere audiencia, flujo y responsable propios? | Evita dividir por pantalla o por moda. |
| Usuarios | ¿Qué puede hacer una persona externa, una organización, un aliado y un administrador? | Fija roles, alcance y pruebas de autorización. |
| Organizaciones/agentes | ¿Entidad, organización y agente son conceptos distintos? | Evita duplicados y modelos contradictorios. |
| Información/publicación | ¿Qué campos son privados, revisables y públicos por tipo de registro? | Modela permisos, APIs y consentimiento. |
| Administración | ¿Qué tareas requieren administración central y cuáles delegación? | Delimita paneles y trazabilidad. |
| Gobierno de datos | ¿Cómo se aprueba una reclamación o una fusión de duplicados? | Requiere reglas, evidencia y responsables. |
| Integraciones | ¿Qué fuentes externas o sistemas existentes serán autoridad? | Determina procedencia, sincronización y seguridad. |
| Arquitectura/operación | ¿Quién operará, financiará y mantendrá cada capacidad? | Evita una arquitectura sin capacidad operativa. |

## Resumen para definición de SIMUS

### ¿Qué es hoy SIMUS?

Institucionalmente, SIMUS es la actualización del Sistema de Información de la Música dentro del PNMC. En el código es una parte relevante de una aplicación más amplia que consulta y administra información, además de publicar contenidos y servicios.

### ¿Cómo funciona actualmente?

Una aplicación Angular muestra contenidos, mapa, catálogos y un área administrativa. Una API .NET administra datos, usuarios, procesos, contenidos, territorialidad y solicitudes de revisión. La base de datos conserva esos registros y relaciones.

### ¿Qué componentes contiene?

Información sectorial, mapa, catálogos, contenidos PNMC, noticias, agenda, editorial, galería, usuarios, aliados, participación, importación, calidad, duplicados, vínculos y administración.

### ¿Cómo se relaciona actualmente con PNMC?

PNMC y SIMUS comparten la misma aplicación, administración y datos transversales. El código no establece aún una separación institucional clara entre ambos.

### ¿Dónde están sus datos y cómo se administran?

Los datos viven en el modelo de la API y SQL. Se administran principalmente desde una consola única. Hay estructuras para categorías, territorio, procesos, entidades, usuarios, calidad, duplicados y trazabilidad.

### ¿Qué experiencias públicas y herramientas existen?

Hay portal general, SIMUS público, mapa, catálogos, fichas de escuelas, agenda, noticias, editorial, galería y participación. El mapa tiene características de herramienta especializada; Celebra la Música existe como contenido/estrategia, no como portal independiente verificable.

### ¿Qué está funcionando y qué está simulado?

Frontend y API compilan y las 27 pruebas de API pasan. Varios flujos privados muestran datos mock o fallback; una pantalla no prueba por sí sola persistencia, autorización o trazabilidad completas.

### ¿Qué está mezclado o es ambiguo?

Administración y colaboradores usan el mismo shell. PNMC, contenidos y datos SIMUS comparten capas. “Entidad”, “organización” y “agente” requieren definición. Las rutas privadas no aplican un guard efectivo en Angular.

### ¿Qué modelos podrían considerarse?

Una plataforma única, un núcleo informacional con experiencias especializadas, o un ecosistema digital con servicios compartidos. Son alternativas de discusión; ninguna se adopta aquí.

### ¿Qué decisiones deben discutirse y en qué orden?

1. Identidad institucional y alcance de SIMUS.
2. Registro oficial, fuentes y gobierno de datos.
3. Usuarios, organizaciones, roles y publicación.
4. Propósito de cada experiencia pública o especializada.
5. Arquitectura y operación que responden a esas decisiones.

## Gobierno del dato actual

### Ciclo de vida verificable

```text
Administración autenticada → alta/edición o importación
→ estado inicial o seleccionado → cambio de estado autorizado
→ historial de revisión (para módulos administrativos)
→ consulta pública según endpoint, con filtros desiguales
```

`/api/v1/admin/data` exige acceso administrativo mediante filtro de endpoint. Sus altas de mapa, contenidos e importación persisten entidades. Los cambios de estado verifican rol y transición, escriben historial de revisión y luego guardan. **VERIFICADO**.

El catálogo público de procesos consulta registros sin filtrar uniformemente por estado de publicación; noticias, agenda y galería también tienen consultas públicas cuya selección de estado no es homogénea. **VERIFICADO**. Por tanto, “publicado” no funciona como condición única y transversal de visibilidad.

### Estados identificados

| Grupo | Estados | Uso comprobado |
|---|---|---|
| Contenido y registros | `borrador`, `en_revision`, `ajustes_solicitados`, `aprobado`, `publicado`, `rechazado`, `archivado` | `EstadosContenido`; transición API administrativa. |
| Entidades | mismos códigos, más `Activo` | perfil de entidad y historial de revisión. |
| Solicitudes de vínculo/aliado | `pendiente`, `en_revision`, `ajustes_solicitados`, `aprobada`, `rechazada`, `cancelada` | tablas y endpoints específicos. |
| Duplicados | `pendiente`, `resuelto`; decisiones `fusionar`, `mantener_separados`, `no_duplicado`, `pendiente` | candidatos de duplicado. |
| Calidad | `abierta`, `en_revision`, `resuelta`, `descartada` | alertas de calidad. |
| Notificaciones | `pendiente`, `enviada`, `leida`, `fallida`, `cancelada` | tabla y endpoints. |

### Distinción de realidad

- **VERIFICADO:** API administrativa, estados, usuarios internos, entidades, solicitudes de vínculo, duplicados, alertas y notificaciones persistibles.
- **PARCIAL:** relación entre cambios y publicación pública; historial transversal; roles de organización.
- **MOCK:** procesos, coincidencias, reclamaciones y avisos creados localmente en `ExternalUserDashboardComponent`.
- **TBC:** despliegue, datos reales, entrega externa de notificaciones y ejecución de migraciones en un entorno.

## Creación, edición y publicación

| Objeto | Creación / edición verificable | Revisión y aprobación | Visibilidad pública | Estado |
|---|---|---|---|---|
| Festivales, escuelas, mercados, redes y lutieres | Panel admin → `/admin/data/map/*`; importación bulk. | Roles `gestor_interno` y `webmaster` cambian estado. | Catálogos públicos no aplican filtro uniforme de `publicado`. | VERIFICADO/PARCIAL |
| Entidades | `/admin/entities`; creador, responsable o vínculo activo pueden acceder a entidad; webmaster/editor acceden globalmente. | Cambio de estado e `EntityReviewHistory`. | No se comprobó ficha pública de entidad. | VERIFICADO/PARCIAL |
| Agenda, noticias, galería | Altas administrativas y estado de contenido. | Misma transición de `EstadosContenido`. | Endpoints públicos no demuestran filtro universal de publicación. | VERIFICADO/PARCIAL |
| Editorial de catálogo | Alta/estado administrativo. | Estado o `IsActive` según ruta/modelo. | Editorial pública filtra `IsActive`; no por todos los estados. | VERIFICADO/PARCIAL |
| Procesos de usuario externo | Formulario y cambios locales en dashboard. | Bandeja visible; no persiste el flujo completo. | No demostrado. | MOCK |

La transición administrativa es `borrador → en_revision → ajustes_solicitados/aprobado/rechazado`; `ajustes_solicitados → en_revision`; `aprobado → publicado`; `publicado → archivado`. `webmaster` puede aplicar cualquier estado conocido; `gestor_interno` puede aplicar ajustes, aprobación o rechazo desde una transición válida. **VERIFICADO**.

Las operaciones de alta/edición administrativas sobrescriben el registro existente y actualizan `UpdatedAt`. No se encontró una versión pública separada de una versión pendiente. **VERIFICADO**. La distinción entre crear y publicar existe en el control de estados, pero no se aplica de modo consistente en todas las consultas públicas. **PARCIAL**.

## Usuarios, organizaciones y alcances actuales

### Registro externo

`POST /external/auth/register` crea `UserRow` con rol `externo`, perfil `persona` u `organizacion`, correo, contraseña, territorio y consentimientos. Inicia inactivo y genera código de verificación. `POST /external/auth/verify-email` activa el usuario. **VERIFICADO**.

El registro externo no crea en ese endpoint una entidad, perfil institucional ni membresía persistida. **VERIFICADO**. Tampoco se encontró inicio de sesión externo independiente ni panel de organización conectado a ese flujo. **PARCIAL**.

### Alcances persistidos

| Relación | Evidencia | Alcance efectivo |
|---|---|---|
| Usuario–entidad | `UsuariosEntidades` / `UserEntityRow` | acceso a una entidad cuando el vínculo está activo. |
| Responsable de entidad | `ResponsibleUserId` | acceso de edición a esa entidad. |
| Creador de entidad | `CreatedByUserId` | acceso de edición a esa entidad. |
| Aliado–entidad aliada | `AllyUserLinks` | requerido para solicitudes de vínculo de roles aliados. |
| Proceso–organización | campos de nombre/responsable y relaciones de ecosistema | no existe una autorización comprobada por proceso u organización. |

`AdminEntityEndpoints` aplica el alcance de entidad en API. Los endpoints administrativos de procesos son de ámbito administrativo, no validan una propiedad individual del proceso. **VERIFICADO**. El dashboard de colaborador representa propietario, procesos e invitaciones de forma local; no demuestra administrador de organización persistido. **MOCK/PARCIAL**.

### Roles

Roles internos comprobados en autorización: `webmaster`, `gestor_interno`. Roles de aliados comprobados en solicitudes: `aliado_admin`, `aliado_editor`, `aliado_lector`. El rol `externo` se crea en registro externo. La ruta Angular no es la autoridad de seguridad y su guard actual permite continuar sin sesión. **VERIFICADO**.

## Reclamaciones, duplicados y calidad

| Capacidad | Flujo API persistido | Resultado actual | Estado |
|---|---|---|---|
| Solicitud de vínculo | usuario autenticado crea `RecordLinkRequest` con módulo, registro, alcance, razón y evidencia. | Revisor interno cambia estado y comentario. No crea relación de propiedad al aprobar. | VERIFICADO/PARCIAL |
| Duplicado | revisor interno crea candidato con dos IDs, nivel, puntaje y evidencia JSON. | Decide `fusionar`, `mantener_separados`, `no_duplicado` o `pendiente`; solo cambia candidato. | VERIFICADO |
| Calidad | revisor interno crea alerta con módulo, registro, tipo, severidad y detalle. | Revisor interno cambia a revisión, resuelta o descartada. | VERIFICADO |

La detección automática de duplicados no está implementada en estos endpoints: la creación del candidato es manual por un revisor autorizado. **VERIFICADO**. `fusionar` no ejecuta fusión, redirección de relaciones ni conservación especial de historial: registra solo la decisión y marca resuelto. **VERIFICADO**.

Las solicitudes de vínculo no verifican en el endpoint que el registro exista ni que esté huérfano, y su aprobación no escribe una relación entidad–registro. **VERIFICADO**. El concepto “registro huérfano” aparece en UI y datos demo, no como estado o campo estructural comprobado. **MOCK/PARCIAL**.

Las alertas de calidad no bloquean publicación ni visibilidad en la lógica revisada. **VERIFICADO**. El panel de gobernanza contiene datos mock como fallback. **MOCK**.

## Importación y trazabilidad actual

### Importación masiva

El panel administrativo lee archivos en navegador, asocia encabezados, valida filas mínimas y detecta duplicados exactos con claves locales. Envía filas válidas a `/api/v1/admin/data/records/{moduleId}/bulk`. **VERIFICADO**.

La API administrativa exige acceso y persiste registros por módulo. Para festivales, escuelas y mercados importados establece `StatusCode = "borrador"` y `CreatedByUserId`; convierte campos, valida presencia mínima y resuelve DIVIPOLA cuando corresponde. **VERIFICADO**.

| Aspecto | Evidencia | Estado |
|---|---|---|
| Archivo y lote persistidos | no se observó entidad de lote ni archivo de importación asociado | TBC/ausente en alcance revisado |
| Fuente e identificador original | existen `EntitySourceRecords`, pero bulk no los escribe | PARCIAL |
| Duplicados | aviso de coincidencia local; no crea automáticamente candidato persistido | PARCIAL/MOCK |
| Reversión | no se encontró endpoint ni lote reversible | TBC/ausente en alcance revisado |
| Fallback UI | al fallar API informa importación simulada | MOCK |

### Auditoría e historial

`AuditLogs` existe y se usa verificablemente para administración de usuarios y solicitudes de aliados. Conserva actor, acción, recurso, resultado y metadatos según `AuditLogRow`. **VERIFICADO**. No se comprobó su escritura desde altas/ediciones/importación de registros de ecosistema.

`EntityReviewHistory` registra entidad, usuario, acción, comentario y fecha. El cambio de estado administrativo escribe historial de revisión para módulos mediante `WriteRevisionHistoryAsync`; el alcance exacto de la tabla/registro para todos los módulos debe comprobarse con una base ejecutada. **PARCIAL**.

No hay versión antes/después por campo ni historial de relaciones proceso–territorio/práctica comprobado. **TBC**.

## Gobierno editorial y agenda

| Objeto | Administración | Estado/revisión | Consulta pública | Estado real |
|---|---|---|---|---|
| Agenda | alta administrativa `agenda/events`; edición por panel | `ContentStatuses` y endpoint de cambio de estado | `/agenda/events` devuelve filas sin filtro explícito de publicación | VERIFICADO/PARCIAL |
| Noticias | alta administrativa `news/articles`; importación bulk | `ContentStatuses` | `/news/articles` consulta todas las filas | VERIFICADO/PARCIAL |
| Galería | alta administrativa y archivos | `ContentStatuses` en modelo; endpoint público agrupa archivos de imagen | consulta depende de archivos, no estado de álbum | VERIFICADO/PARCIAL |
| Editorial | alta/estado administrativo y catálogo | `IsActive` o estado según modelo | `/editorial/resources` filtra `IsActive` | VERIFICADO/PARCIAL |
| Textos web | panel local y API de administración | historial local/panel; persistencia completa TBC | `WebTextsService` tiene valores de configuración | PARCIAL/MOCK |

La transición administrativa de estados es reutilizada por agenda, noticias, galería, editorial y registros de ecosistema. **VERIFICADO**. La condición de publicación no se reutiliza de manera uniforme en los endpoints públicos. **VERIFICADO**.

La bandeja de revisión del shell reúne registros obtenidos por módulos administrativos. Su interfaz sí llama al endpoint de cambio de estado; las notificaciones de la misma pantalla se agregan localmente cuando se solicitan ajustes. **VERIFICADO/MOCK**.

## Matriz de gobierno del dato

| Objeto | Quién crea | Quién edita | Revisión | Quién aprueba | Condición de publicación | Historial | Auditoría | Notificación | Estado real |
|---|---|---|---|---|---|---|---|---|---|
| Registro ecosistémico | administración/importación | administración | cambio de estado | webmaster/gestor interno | no uniforme en API pública | revisión parcial | no comprobada por edición | local en UI | PARCIAL |
| Entidad | usuario autorizado o admin | creador, responsable, miembro o admin | estado entidad | webmaster/editor | TBC | EntityReviewHistory | TBC | TBC | PARCIAL |
| Usuario externo | visitante | perfil propio parcial | verificación correo | sistema por código | no aplica | código consumido | TBC | no envío externo probado | VERIFICADO/PARCIAL |
| Solicitud de vínculo | autenticado | no se encontró edición | revisión de estado | interno | no aplica | estado/comentario | TBC | TBC | PARCIAL |
| Candidato duplicado | interno | decisión interna | revisión interna | interno | no aplica | decisión/comentario | TBC | TBC | VERIFICADO |
| Alerta de calidad | interno | estado interno | revisión interna | interno | no bloquea publicación | estado | TBC | TBC | VERIFICADO |
| Agenda/noticia | administración/importación | administración | estado de contenido | webmaster/gestor interno | endpoint público no filtra siempre | revisión parcial | TBC | UI local | PARCIAL |
| Editorial | administración/importación | administración | estado / `IsActive` | administración | `IsActive` para consulta pública | TBC | TBC | TBC | PARCIAL |
| Notificación | interno autorizado | lectura por destinatario | no aplica | no aplica | no aplica | `SentAt`, `ReadAt`, intentos | tabla propia | persistible; envío TBC | PARCIAL |

## Brechas observables frente a un gobierno robusto

- **VERIFICADO:** la visibilidad pública no aplica `publicado` de manera homogénea; noticias, agenda y catálogos consultan datos sin el mismo filtro de estado.
- **VERIFICADO:** un cambio administrativo puede sobrescribir datos de un registro sin una versión pública separada o comparación antes/después por campo.
- **VERIFICADO:** la aprobación de una solicitud de vínculo no materializa una relación de propiedad o responsabilidad sobre el registro solicitado.
- **VERIFICADO:** la decisión `fusionar` de un duplicado no fusiona registros ni mueve relaciones.
- **VERIFICADO:** las alertas de calidad no afectan publicación o visibilidad en la lógica revisada.
- **VERIFICADO:** el control de acceso de entidades existe, pero no hay autorización equivalente comprobada para que una organización gestione solo sus procesos.
- **VERIFICADO:** la importación no persiste un lote, archivo, fuente o reversión como unidad en el endpoint revisado.
- **MOCK:** procesos, reclamaciones, avisos y coincidencias del dashboard externo pueden actualizarse solo en memoria local.
- **PARCIAL:** `AuditLogs` no prueba cobertura para cambios de registros, importaciones y relaciones; `EntityReviewHistory` es específico de entidad/revisión.
- **PARCIAL:** una bandeja de revisión existe para módulos administrativos, pero solicitudes de vínculo, duplicados, calidad y aliados mantienen flujos/paneles separados.
- **VERIFICADO:** “persona”, “usuario externo”, “entidad”, “organización”, “aliado” y “colaborador” no se corresponden de forma única entre UI, endpoints y relaciones persistidas.

## Resumen no técnico: gobierno del dato

Hoy, el equipo administrativo puede crear, importar, editar y cambiar el estado de registros y contenidos desde una consola. La API guarda esos cambios y controla quién puede realizar cambios de estado. Un registro puede pasar de borrador a revisión, aprobación, publicación o archivo.

Sin embargo, que un registro tenga estado “publicado” no garantiza por sí mismo que sea la única versión visible: varios servicios públicos consultan registros sin aplicar la misma regla de publicación. Cuando se modifica un registro ya disponible, el sistema puede actualizar directamente sus datos; no hay una versión pública separada de una modificación pendiente comprobada.

Una persona puede crear una cuenta externa y verificar su correo. Aún no queda demostrado un recorrido completo que convierta esa cuenta en administradora persistida de una organización y de sus procesos. El tablero que muestra creación, reclamación y edición de procesos externos tiene partes simuladas en el navegador.

Existen solicitudes para vincularse a un registro, candidatos de duplicado y alertas de calidad. Se pueden revisar y decidir, pero aprobar una solicitud no crea todavía el vínculo de propiedad; decidir “fusionar” no fusiona registros; y una alerta de calidad no bloquea la publicación.

La importación puede crear registros, pero no conserva de forma comprobada un lote con archivo, fuente, responsable y reversión. Hay algunos registros de auditoría e historial de revisión, aunque no evidencia suficiente de una trazabilidad completa de cada cambio de campo, relación o importación.

## Arquitectura de producto actual

| Experiencia observable | Evidencia | Estado |
|---|---|---|
| Portal PNMC | inicio, PNMC, ejes, estrategias, noticias, agenda, editorial y galería bajo navegación común | VERIFICADO |
| Consulta SIMUS | `/simus`, menú ecosistémico, escuelas y mapa | VERIFICADO/PARCIAL |
| Mapa/directorio | geovisor, capas, filtros, métricas, búsqueda y CSV local | VERIFICADO |
| Gestión administrativa | `/admin`, shell con registros, usuarios, entidades, contenidos, sistema y gobierno | VERIFICADO |
| Colaboradores/externos | `/colaboradores` usa el mismo shell; dashboard externo interno | PARCIAL/MOCK |
| Aliados | endpoints y paneles aliados; interfaz comparte shell administrativo | PARCIAL |

La entrada `/` comunica primero PNMC: hero “Plan Nacional de Música para la Convivencia”, ejes, estrategias, mapa y contenidos. SIMUS se presenta como acceso destacado de navegación y como puerta al ecosistema musical. **VERIFICADO**. Las fronteras anteriores son lecturas funcionales; no equivalen a aplicaciones separadas. **HIPÓTESIS**.

## Experiencia pública actual detallada

| Nombre | Propósito / audiencia | Rutas | Datos/API | Estado |
|---|---|---|---|---|
| Inicio PNMC | entrada institucional para ciudadanía | `/` | textos, componentes y previews | VERIFICADO |
| PNMC, ejes y estrategias | contenido del Plan | `/pnmc`, `/ejes`, `/ejes/componentes/:id`, `/estrategia/*` | configuración y textos | VERIFICADO/PARCIAL |
| SIMUS | presentación del ecosistema | `/simus` | contenido y categorías | VERIFICADO |
| Escuelas | listado y ficha | `/simus/escuelas`, `/:schoolId` | catálogo/API | VERIFICADO |
| Otros directorios SIMUS | agrupaciones, agentes, escenarios, festivales, mercados, redes, lutería | `/simus/:section` | página “próximamente” | PARCIAL |
| Mapa | exploración territorial | `/mapa` | Map, catálogo, DIVIPOLA | VERIFICADO |
| Noticias/agenda/editorial/galería | consulta de contenidos | rutas homónimas | APIs públicas | VERIFICADO/PARCIAL |
| Participación | enlace heredado desde mapa | `/mapa/participa → /colaboradores` | no hay recorrido público inequívoco | HEREDADO/PARCIAL |

La navegación pública reutiliza `NavigationComponent`, pie y botón flotante. El menú SIMUS promete “Ingresar” y “Ser parte”, pero esas rutas son capturadas por `/simus/:section` y muestran disponibilidad futura; no son autenticación o registro implementados. **VERIFICADO**.

No existe una experiencia pública completa y verificable para organizaciones o agentes: “Agentes” es una ruta de próxima disponibilidad y no un directorio separado. **PARCIAL**.

## Experiencias autenticadas actuales

| Área | Persistencia / autorización | Interfaz | Estado |
|---|---|---|---|
| Administración | cookie, roles, endpoints protegidos | `/admin` y `AdminShell` | VERIFICADO |
| Registro externo | usuario, código de correo y activación en API | no se encontró ruta pública dedicada | PARCIAL |
| Perfil | actualización de sesión/admin | formulario del shell/dashboard | PARCIAL |
| Aliados | entidades y usuarios aliados en API | comparte shell administrativo | PARCIAL |
| Colaboradores/external | misma ruta/shell; dashboard de procesos y reclamos | procesos, coincidencias y avisos locales | MOCK/PARCIAL |

No se encontró recuperación de contraseña, inicio de sesión externo independiente, selector de organización ni invitaciones persistidas de organización. Los aliados sí pueden crear/gestionar usuarios de su entidad mediante endpoints autorizados; eso no equivale a una organización genérica. **VERIFICADO/PARCIAL**.

## Administración y CMS actual

`/admin` concentra monitor, usuarios, registros, entidades, estados, importación, revisión, gobernanza, aliados, textos web, agenda, noticias, editorial, galería, configuración y asistente IA. La navegación se controla dentro de `AdminShellPageComponent`. **VERIFICADO**.

| Responsabilidad | Mecanismo actual | Estado |
|---|---|---|
| Gobierno de datos | registros, estados, entidades, vínculos, calidad y duplicados | VERIFICADO/PARCIAL |
| CMS de textos | `WebTextsService` y panel de textos | PARCIAL |
| Contenidos | módulos administrativos para agenda, noticias, editorial y galería | VERIFICADO/PARCIAL |
| Usuarios/permisos | admin auth, usuarios, aliados | VERIFICADO/PARCIAL |
| Importación | carga masiva y mapeo | VERIFICADO/PARCIAL |
| IA | extracción/mapeo en panel administrativo | experimental/PARCIAL |

No hay un CMS único comprobado: textos del sitio, registros de contenido, catálogo editorial y archivos usan mecanismos/modelos distintos. **VERIFICADO**. La consola mezcla responsabilidades editoriales, administrativas y de datos. **VERIFICADO**.

## Mapa y herramientas especializadas actuales

El mapa permite seleccionar capas de festivales, escuelas, mercados, redes y lutieres; filtrar por territorio, práctica, departamento y municipio; consultar métricas; buscar en un directorio y exportar la capa activa como CSV creado en el navegador. Consume geografía, catálogos y configuraciones fijas de capas/prácticas/territorios. **VERIFICADO**.

La ficha pública conectada es la de escuelas. Las demás categorías del menú público SIMUS están en “próximamente”, aunque el mapa puede listar registros de varias fuentes. **VERIFICADO/PARCIAL**.

El mapa funciona de facto como sección pública de SIMUS y visor especializado dentro de la misma aplicación. No hay evidencia de despliegue o producto independiente. **VERIFICADO/HIPÓTESIS**.

No se identificó otra herramienta pública con alcance comparable; el panel de IA es administrativo y experimental. **VERIFICADO**.

## Consulta analítica y directorios actuales

| Capacidad | Evidencia | Estado |
|---|---|---|
| Métricas públicas territoriales | conteos y tarjetas en mapa; resumen de departamentos | VERIFICADO |
| Filtros y visualización | capas, coropletas, directorio y búsqueda local del mapa | VERIFICADO |
| Exportación | CSV de capa activa generado en navegador | VERIFICADO |
| Monitor administrativo | `/admin/data/monitor`, totales por módulo/estado | VERIFICADO |
| Series históricas/reportes | no se encontró UI/API específica | TBC |
| Directorio de escuelas | listado y ficha propios | VERIFICADO |
| Directorio unificado de ecosistema | pestaña de directorio del mapa; incluye cinco tipos | VERIFICADO |
| Directorio de agentes/organizaciones | menú y datos existen; ruta pública dedicada no | PARCIAL |
| Búsqueda entre usuarios autenticados | usuarios administrativos/aliados, no directorio general | PARCIAL |

Los indicadores dependen de registros consultados y configuraciones de mapa; no se encontró un producto analítico público separado. **VERIFICADO**.

## Rutas, layouts y contextos actuales

| Tipo | Rutas / shell | Estado |
|---|---|---|
| Público general | `/`, `/pnmc`, `/ejes*`, `/noticias*`, `/agenda`, `/editorial`, `/galeria`, `/mapa`, `/simus*` | VERIFICADO |
| Administrativo | `/admin` → `AdminShellPageComponent` | VERIFICADO |
| Colaboradores | `/colaboradores` → mismo `AdminShellPageComponent` | VERIFICADO |
| Compatibilidad | `/ecosistema/* → /simus/*`, `/home → /`, `/mapa/participa → /colaboradores` | HEREDADO |

La aplicación raíz muestra navegación, pie y botón flotante fuera de `admin` y `colaboradores`; no existen layouts Angular separados para PNMC, SIMUS, organización o aliado. **VERIFICADO**. No hay rutas `/login`, `/registro`, `/organizacion` ni `/aliado` en Angular. El guard de autenticación no está asignado a rutas y permite continuar cuando no hay sesión. **VERIFICADO**.

Contextos de actuación: persona, organización o proceso no son contextos seleccionables persistidos en frontend. El único alcance verificable es el de entidad en API y el de aliado en endpoints específicos. **VERIFICADO/PARCIAL**.

## Matriz de audiencias y experiencias

| Experiencia | Visitante | Usuario registrado | Agente | Organización | Editor delegado | Ministerio | Estado real |
|---|---|---|---|---|---|---|---|
| Portal PNMC/contenidos | Sí | Sí | Sí | Sí | N/A | Sí | VERIFICADO |
| SIMUS público/mapa | Sí | Sí | Sí | Sí | N/A | Sí | VERIFICADO/PARCIAL |
| Escuelas/ficha | Sí | Sí | Sí | Sí | N/A | Sí | VERIFICADO |
| Directorios de agentes/organizaciones | PARCIAL | PARCIAL | PARCIAL | PARCIAL | N/A | Sí | PARCIAL |
| Registro externo | No UI | API sí | API sí | API sí | N/A | N/A | PARCIAL |
| Organización propia | No | MOCK | MOCK | MOCK | MOCK | N/A | MOCK |
| Aliados | N/A | N/A | N/A | N/A | Sí, según rol aliado | Sí | PARCIAL |
| Administración | No | N/A | N/A | N/A | gestor interno | webmaster/gestor | VERIFICADO |
| Analítica/monitor | mapa público | N/A | N/A | N/A | N/A | administración | VERIFICADO/PARCIAL |

“Agente”, “organización” y “editor delegado” son categorías de lectura; el código no las materializa siempre como audiencias o roles distintos. **TBC/PARCIAL**.

## Dependencias entre experiencias

| Experiencia | Dependencias principales | Acoplamiento observable |
|---|---|---|
| Portal PNMC | navegación, textos, contenidos, imágenes | comparte marca y componentes con todo lo público. |
| SIMUS/mapa | catálogo, territorio, prácticas, territorios sonoros, API y Leaflet | cambios de datos afectan mapa, fichas y directorio. |
| Escuelas | catálogo, territorio, `BackendDataService` | ficha/listado dependen de adaptación de contratos. |
| CMS/contenidos | categorías, estados, archivos, panel admin | comparte consola y estado con registros SIMUS. |
| Administración | sesión, roles, esquema API, datos de todos los módulos | shell concentra responsabilidades. |
| Aliados/externos | roles, entidades, notificaciones, mocks locales | la UI no representa por completo las relaciones API. |

Dependencias visuales: navegación, pie, tokens CSS y componentes compartidos. Dependencias históricas: redirecciones de ecosistema y mapa/participación. Dependencias técnicas: una sola app Angular, API y DbContext. **VERIFICADO**.

## Brechas de arquitectura de producto

- **VERIFICADO:** la entrada pública predomina como PNMC, mientras SIMUS aparece como sección destacada; no hay portal SIMUS independiente.
- **VERIFICADO:** el menú SIMUS anuncia agentes, festivales, mercados, acceso y participación, pero varias rutas terminan en “próximamente”.
- **VERIFICADO:** `/admin` y `/colaboradores` comparten shell pese a audiencias y responsabilidades declaradas distintas.
- **VERIFICADO:** no existe una experiencia de organización persistida y separada; el dashboard externo contiene procesos y reclamaciones mock.
- **VERIFICADO:** no hay CMS único; contenidos, textos, editorial, galería y archivos siguen mecanismos distintos.
- **VERIFICADO:** mapa combina visor territorial, directorio, indicadores y exportación en una sola experiencia.
- **PARCIAL:** existen datos y endpoints de aliados, entidades y usuarios, pero no una experiencia pública coherente de agentes u organizaciones.
- **VERIFICADO:** analítica pública se limita al mapa; no se encontró producto de reportes o series históricas.
- **VERIFICADO:** rutas privadas carecen de protección efectiva de navegación Angular.

## Resumen no técnico: arquitectura de producto

Quien entra hoy al sitio encuentra primero el PNMC: su presentación, ejes, estrategias, agenda, noticias, editorial y galería. Dentro de esa misma experiencia aparece SIMUS como acceso al ecosistema musical, sus escuelas y el mapa.

El mapa es la herramienta pública más completa: permite consultar datos territoriales, explorar varios tipos de registros, buscar en un directorio, ver indicadores y exportar resultados. Las escuelas tienen listado y ficha. Otras categorías visibles en el menú SIMUS todavía están en construcción.

La administración reúne en un solo espacio la gestión de datos, contenidos, usuarios, importaciones, entidades, aliados, revisión y configuraciones. “Colaboradores” usa ese mismo espacio. Hay estructuras reales para aliados y entidades, pero no existe todavía un área comprobada donde una organización gestione de forma persistida sus propios procesos.

Parte de la experiencia externa muestra procesos, coincidencias, reclamaciones y avisos, pero varios de esos comportamientos viven solo en memoria del navegador. Por eso no constituyen todavía un producto de organización o agente terminado.

SIMUS, PNMC, contenidos y mapa viven en una sola aplicación y comparten servicios, datos y componentes visuales. Hay fronteras funcionales observables, pero no una separación de producto implementada de forma completa.

## Diagnóstico profundo SIMUS

Este índice reúne documentos descriptivos. No aprueba arquitectura ni cambios de implementación.

| Bloque | Documentos |
|---|---|
| Identidad y cartografía | [10](#simus-actual), [11](#cartografia-funcional-simus), [14](#relacion-pnmc-simus), [26](#matriz-maestra-simus), [30](#resumen-para-definicion-de-simus) |
| Información, datos y acceso | [12](#nucleo-informacional-actual), [19](#dominios-de-informacion), [20](#modelo-de-datos-actual), [21](#identidad-y-acceso), [23](#importacion-gobernanza-y-trazabilidad) |
| Experiencias y productos | [13](#experiencia-publica-actual), [15](#productos-y-experiencias-especializadas), [16](#mapa-ecosistemico-actual), [17](#portales-especializados), [18](#taxonomia-de-productos-digitales) |
| Implementación | [22](#administracion-actual), [24](#mocks-prototipos-y-funcionalidad-real), [25](#api-y-servicios), [27](#dependencias-y-acoplamientos) |
| Discusión posterior | [28](#modelos-conceptuales-posibles), [29](#preguntas-de-producto-y-arquitectura) |
| Gobierno del dato | [31](#gobierno-del-dato-actual), [32](#creacion-edicion-y-publicacion), [33](#usuarios-organizaciones-y-alcances-actuales), [34](#reclamaciones-duplicados-y-calidad), [35](#importacion-y-trazabilidad-actual), [36](#gobierno-editorial-y-agenda), [37](#matriz-de-gobierno-del-dato), [38](#brechas-observables-frente-a-un-gobierno-robusto), [39](#resumen-no-tecnico-gobierno-del-dato) |
| Arquitectura de producto | [40](#arquitectura-de-producto-actual), [41](#experiencia-publica-actual-detallada), [42](#experiencias-autenticadas-actuales), [43](#administracion-y-cms-actual), [44](#mapa-y-herramientas-especializadas-actuales), [45](#consulta-analitica-y-directorios-actuales), [46](#rutas-layouts-y-contextos-actuales), [47](#matriz-de-audiencias-y-experiencias), [48](#dependencias-entre-experiencias), [49](#brechas-de-arquitectura-de-producto), [50](#resumen-no-tecnico-arquitectura-de-producto) |

Leyenda: **VERIFICADO** código o prueba; **PARCIAL** existe incompleto; **MOCK** simulado; **HEREDADO** compatibilidad o agregado previo; **TBC** no comprobable; **HIPÓTESIS** interpretación.
