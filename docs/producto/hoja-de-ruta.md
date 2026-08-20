# Hoja de ruta

Orden de evolución de SIMUS: las fases, las épicas que las componen, sus dependencias y los
criterios para dar una fase por cerrada.

La hoja de ruta ordena, no autoriza. Cada corte vertical se abre con su propia rama y se
cierra con su tag, según lo descrito en `../../CONTRIBUTING.md`.

Estado: aprobado. Última revisión de contenido: agosto de 2026.

## Roadmap Maestro de Implementación del Sistema de Información de la Música — SIMUS

> **Roadmap aprobado.** Este documento define qué capacidades se construyen y en qué secuencia. No es backlog, especificación de desarrollo, lista de épicas ni autorización para modificar código.

### 1. Propósito y alcance

El roadmap traduce la arquitectura objetivo aprobada en una secuencia progresiva. Conserva el desarrollo útil —Angular, API .NET, SQL Server, mapa, catálogos, contenidos y capacidades administrativas verificadas— y prioriza los cambios estructurales que permiten operar SIMUS con identidad, gobierno, analítica y seguridad coherentes.

No define historias de usuario, tareas, estimaciones, responsables, cronograma ni cortes verticales detallados. Esas definiciones vendrán después: primero se derivarán las épicas y, dentro de ellas, los cortes verticales end-to-end que se puedan implementar y probar.

### 2. Distinciones de trabajo

| Concepto | Pregunta que responde | Resultado esperado |
|---|---|---|
| **Roadmap** | ¿Qué se construye y en qué orden? | Fases dependientes con criterios de cierre. |
| **Épicas** | ¿Cuáles son las grandes unidades funcionales de trabajo? | Agrupaciones de alcance, todavía no definidas aquí. |
| **Cortes verticales** | ¿Qué flujo pequeño end-to-end se implementa y prueba? | Recorridos comprobables dentro de una épica, todavía no definidos aquí. |

Una fase puede incluir varias épicas; una épica puede requerir varios cortes verticales. No deben confundirse con una secuencia de despliegue ni con una lista de pantallas.

### 3. Criterios de orden

El orden responde a cinco criterios:

1. Resolver primero fronteras de seguridad y contratos antes de ampliar experiencias.
2. Validar la relación persona–organización–proceso mediante capacidad real, no mediante pantallas simuladas.
3. Establecer publicación gobernada antes de aumentar la exposición pública de datos sectoriales.
4. Mantener la analítica desde los primeros cortes y fortalecerla conforme maduran las fuentes.
5. Extraer el frontend institucional solo cuando la separación se sostenga con políticas, pruebas y contratos estables.

### 4. Vista de conjunto

```text
0. Línea base y preparación
        ↓
1. Fronteras internas, contratos y analítica inicial
        ↓
2. Dominio externo: identidad, organización y autorizaciones
        ↓
3. Primer dominio gobernado: Festival + publicación versionada
        ↓
   ┌────┴────┐
   ↓         ↓
4. Separación institucional   5. Consolidación sectorial
   └────┬────┘
        ↓
6. Fortalecimiento analítico, operación e interoperabilidad progresiva
```

Las fases son secuenciales respecto de sus decisiones críticas, pero algunas actividades de preparación, pruebas, documentación y analítica inicial pueden continuar mientras se desarrolla la siguiente fase. Tras estabilizar los contratos y controles institucionales de la Fase 3, la Fase 4 y las capacidades de gobierno de la Fase 5 pueden avanzar de manera coordinada. La extracción del frontend no bloquea mejoras que no dependan de ella.

### 5. Fase 0 — Línea base y preparación controlada

#### Objetivo

Establecer una línea base verificable del sistema y las condiciones de seguridad, datos y operación necesarias para evolucionar sin perder funcionalidades ni trazabilidad.

#### Por qué ocurre en este momento

El diagnóstico registra código reutilizable, comportamientos PARCIALES y MOCK, rutas privadas sin guarda Angular efectiva y aspectos de dependencias/operación pendientes de confirmar. Sin una línea base, los cambios posteriores no pueden evaluarse ni revertirse con confianza.

#### Dependencias

Documento maestro v02 APR, diagnóstico 10–50, inventario técnico existente y acceso institucional a entornos, respaldos y responsables de operación. La versión, impacto y remediación de `SQLitePCLRaw` siguen siendo **TBC** y requieren confirmación técnica.

#### Capacidades que entrega

- Inventario validado de rutas, endpoints, entidades, contratos y consumidores.
- Línea base de pruebas, datos, dependencias y seguridad.
- Procedimiento acordado de respaldo, restauración, migración y observabilidad.
- Criterios para distinguir comportamiento real, parcial y mock antes de evolucionarlo.

#### Desarrollo actual que reutiliza

Repositorio actual (`pnmc-web`, `pnmc-api`, `pnmc-database`), pruebas y health checks existentes, API .NET, `PnmcDbContext`, SQL Server y diagnósticos ya realizados.

#### Cambios estructurales

No introduce todavía el nuevo modelo de dominio. Formaliza contratos, inventarios, mecanismos de prueba y condiciones de reversión que soportarán las fases posteriores.

#### Riesgos

Subestimar dependencias implícitas, migraciones de datos o consumidores de endpoints; tratar como reales flujos que el diagnóstico identifica como mock; intervenir dependencias o producción sin validación institucional.

#### Criterio para considerar la fase terminada

Existe una línea base revisada de contratos/datos/pruebas, un plan verificable de respaldo-restauración, inventario de dependencias con hallazgos priorizados y evidencia de qué capacidades actuales se preservan o requieren reemplazo. No exige resolver aún cada brecha.

### 6. Fase 1 — Fronteras internas, contratos y analítica inicial

#### Objetivo

Ordenar el Angular, la API .NET y la base común por ámbitos funcionales, sin extraer aplicaciones todavía; iniciar modelos de lectura analítica con datos aprobados y reglas de visibilidad.

#### Por qué ocurre en este momento

La arquitectura B conserva una API y base comunes, pero exige modularidad interna, contratos claros y políticas por ámbito. La analítica es central y debe empezar aquí, no esperar a que todas las capacidades transaccionales estén completas.

#### Dependencias

Fase 0 cerrada; definiciones de dominio aprobadas; inventario de catálogos y reglas mínimas de visibilidad; criterios institucionales para indicadores iniciales.

#### Capacidades que entrega

- Fronteras internas explícitas para identidad externa, identidad institucional, organizaciones/procesos, gobierno, contenidos, catálogos, analítica e importaciones.
- Contratos de lectura y escritura con propiedad identificada.
- Políticas iniciales de audiencia y visibilidad.
- Indicadores y consultas públicas/institucionales iniciales sobre datos aprobados.
- Mapa encaminado a consumir modelos o endpoints de lectura analítica.

#### Desarrollo actual que reutiliza

Features Angular, carga diferida, servicios HTTP, endpoints por grupos `/api/v1`, `MapEndpoints`, `MapDataService`, catálogos, DIVIPOLA, Leaflet y SQL Server.

#### Cambios estructurales

Reorganización interna progresiva de contratos y responsabilidades; introducción de modelos de lectura, vistas o agregados proporcionados. No aprueba data warehouse, microservicios, nuevas bases ni extracción de frontend.

#### Riesgos

Que la modularización sea solo una reorganización de carpetas; exponer datos no publicados en lecturas; duplicar reglas entre frontend y API; definir indicadores sin responsables de dato.

#### Criterio para considerar la fase terminada

Los ámbitos internos y contratos críticos están documentados y probados; las lecturas analíticas iniciales tienen fuente, fecha de corte y reglas de visibilidad; el mapa no depende de lecturas que expongan borradores o datos restringidos.

### 7. Fase 2 — Dominio externo: identidad, organización y autorizaciones

#### Objetivo

Convertir la experiencia externa parcial en una capacidad persistente y segura: persona externa, cuenta, organización, autorización inicial y gestión por alcance.

#### Por qué ocurre en este momento

Este es el núcleo que permite corresponsabilidad de la información. Debe llegar después de las fronteras y contratos, porque no puede basarse en roles globales, estado de navegador o rutas sin control efectivo.

#### Dependencias

Fase 1 cerrada; decisiones aprobadas sobre persona/cuenta/organización; políticas de autenticación externa y visibilidad; modelos de auditoría y notificación iniciales.

#### Capacidades que entrega

- Cuenta externa separada de perfil de agente.
- Registro inmediato de organización y asignación persistente de administrador inicial.
- Contexto personal, de organización o de proceso sin escalamiento de privilegios.
- Autorizaciones con roles, relaciones, alcance y vigencia.
- Festival como primer objeto sectorial de referencia, creado como borrador por una organización autorizada.
- Directorios externos solo conforme a políticas aprobadas.

#### Desarrollo actual que reutiliza

Registro y verificación externos, usuarios/roles, entidades y relaciones existentes, `Ally*` y `UserEntityRow` como evidencia de estructuras aprovechables, notificaciones y auditoría. Su reutilización exacta debe definirse por contrato; no todos los flujos actuales están completos.

#### Cambios estructurales

Dos ámbitos de autenticación desde la API, sesión externa propia, relación persona–organización y autorización por recurso. El Festival se usa para validar el modelo de proceso y no se generaliza prematuramente a mercados, escuelas, talleres, espacios u otros registros. Requiere sustituir o evolucionar comportamientos MOCK de colaboración/gestión externa.

#### Riesgos

Confundir relación institucional con permiso; permitir acceso por un identificador enviado por cliente; mezclar sesión externa con institucional; exponer directorios o datos personales sin política; migrar relaciones existentes sin procedencia.

#### Criterio para considerar la fase terminada

Una persona externa puede actuar sobre recursos autorizados y no sobre otros; una organización no inicia sesión; un Festival puede existir como borrador gestionado por la organización autorizada; altas, cambios, revocaciones y cambios de contexto quedan auditados; las pruebas demuestran que ningún principal externo consume acciones institucionales.

### 8. Fase 3 — Primer dominio gobernado: Festival y publicación versionada

#### Objetivo

Validar con el Festival el ciclo operativo de un registro sectorial: borrador, revisión, ajustes, publicación, rechazo, archivo y propuesta de cambio sobre una versión pública vigente.

#### Por qué ocurre en este momento

Una vez que actores externos pueden aportar y gestionar información, la publicación debe impedir que un cambio reemplace la información pública sin revisión. El Festival permite comprobar proceso, organización responsable, autorización, revisión y versionado en un único dominio antes de extender el patrón según las diferencias reales de mercados, escuelas, talleres o espacios.

#### Dependencias

Fase 2 cerrada; estados conceptuales aprobados; políticas de revisión institucional; autorización institucional separada; modelo de auditoría y notificaciones.

#### Capacidades que entrega

- Versión publicada + propuesta pendiente + historial.
- Festival publicado como primer objeto sectorial de referencia.
- Revisión institucional atribuible y notificaciones de ajustes/decisiones.
- Visibilidad pública solo de la versión aprobada.
- Vínculo entre cambio, responsable, procedencia y decisión.
- Base para solicitudes de vinculación, calidad y deduplicación gobernadas.

#### Desarrollo actual que reutiliza

Estados de contenido, estructuras de revisión, `EntityReviewHistoryRow`, `RecordLinkRequestRow`, `RecordDuplicateCandidateRow`, `RecordQualityFlagRow`, auditoría y endpoints de gobierno existentes, todos con alcance a validar/evolucionar.

#### Cambios estructurales

Modelo híbrido de publicación/propuesta/historial aplicado primero al Festival; políticas homogéneas de lectura; materialización persistente de decisiones de vinculación; separación de alertas de calidad y estados del registro. La extensión a otros objetos se decidirá por sus diferencias de dominio, no por generalización automática.

#### Riesgos

Generalizar prematuramente el modelo Festival a objetos distintos; duplicar versiones sin reglas de promoción; publicar desde rutas o consultas heredadas que no aplican visibilidad; pérdida de procedencia; convertir una solicitud aprobada o una decisión de duplicado en simple estado sin efecto persistente.

#### Criterio para considerar la fase terminada

Una actualización de un Festival publicado no sustituye la versión visible hasta revisión; cada decisión deja auditoría; las lecturas públicas, mapa y analítica usan solo información autorizada; las pruebas cubren aprobación, ajustes, rechazo, archivo y reversión de propuesta. Solo después se evalúa extender el patrón a otro objeto sectorial.

### 9. Fase 4 — Separación del frontend institucional

#### Objetivo

Extraer la administración institucional a un frontend separado, manteniendo API .NET modular común y SQL Server único.

#### Por qué ocurre en este momento

La separación es una decisión de arquitectura aprobada, pero extraerla antes de estabilizar autenticación, autorización, gobierno y contratos trasladaría ambigüedades a una nueva aplicación. Esta fase materializa el aislamiento de experiencia y despliegue cuando puede probarse.

#### Dependencias

Fases 1–3 cerradas; políticas institucionales y externas separadas; contratos de API estables; estrategia de despliegue, CORS, cookies, CSRF y recuperación validada; pruebas de regresión disponibles.

#### Capacidades que entrega

- Frontend institucional con login, navegación y sesión propios.
- Administración de gobierno, CMS, usuarios, catálogos, importaciones, auditoría, configuración y analítica administrativa.
- Separación operativa de “administración” frente a entorno externo; desaparición progresiva de la mezcla heredada con “colaboradores”.

#### Desarrollo actual que reutiliza

Shell y paneles administrativos, `AdminService`, endpoints `/admin/*`, componentes de revisión/monitor, contenidos y configuración actuales, extraídos o adaptados sin reescritura funcional innecesaria.

#### Cambios estructurales

Segundo proyecto frontend en el mismo repositorio inicialmente; dos cookies/sesiones y políticas API excluyentes; contratos de UI compartidos solo cuando aporten valor. No requiere una segunda API ni una segunda base.

#### Riesgos

Duplicar lógica o diseño, romper rutas administrativas heredadas, confiar en el frontend como control de seguridad, errores de CORS/cookies/CSRF, y despliegues desacoplados sin observabilidad común.

#### Criterio para considerar la fase terminada

La administración institucional se opera desde su frontend propio; ninguna ruta o sesión externa habilita acciones institucionales; las políticas se validan por API; el despliegue independiente y las pruebas de regresión están comprobados.

### 10. Fase 5 — Consolidación sectorial: importaciones, calidad, vínculos y CMS

#### Objetivo

Fortalecer las capacidades que permiten ampliar y mantener información sectorial: importaciones gobernadas, vinculación de registros históricos, deduplicación, calidad, notificaciones y gobierno editorial diferenciado.

#### Por qué ocurre en este momento

Estas capacidades necesitan identidad, autorización, publicación, procedencia y contratos institucionales estables. Incorporarlas antes elevaría volumen de datos sin mecanismos suficientes para gobernarlos. Las capacidades editoriales actuales permanecen operativas durante todas las fases: esta fase consolida el CMS institucional, no inicia la gestión de contenidos.

#### Dependencias

Fases 2 y 3 cerradas; reglas de procedencia y publicación operativas; contratos y controles institucionales estabilizados; catálogo validado; responsables institucionales de importación, calidad y editorial definidos. La extracción de la Fase 4 puede avanzar en paralelo y solo es requisito para las capacidades que dependan materialmente del frontend institucional separado.

#### Capacidades que entrega

- Lotes de importación con archivo/fuente, validación, normalización, resultados, conflictos y reversión gobernada.
- Solicitudes de vinculación que materializan relaciones persistentes tras revisión.
- Gestión de candidatos de duplicado y alertas de calidad como objetos independientes.
- Notificaciones para invitaciones, ajustes, decisiones, permisos, importaciones y calidad.
- CMS institucional con ciclos editoriales diferenciados del gobierno sectorial.

#### Desarrollo actual que reutiliza

Bootstrap y soporte de importación existentes, tablas/endpoints de vínculo, duplicados, calidad, notificaciones, agenda, noticias, editorial, galería y archivos. La evidencia actual es PARCIAL para lote/reversión y debe evolucionarse.

#### Cambios estructurales

Lote y procedencia como entidades trazables; ejecución controlada de importación; aplicación efectiva de decisiones de vínculo/duplicado; unificación gradual de contratos editoriales sin forzar una sola tabla de contenido.

#### Riesgos

Importaciones que alteren registros publicados, fusión automática, archivos inseguros, reversión destructiva, información personal en logs, y mezcla de responsabilidades editoriales con gobierno sectorial.

#### Criterio para considerar la fase terminada

Todo lote es auditable y reversible de forma gobernada; los importados siguen el ciclo de publicación; las decisiones de vínculo/duplicado tienen efecto persistente y trazable; contenido editorial y dato sectorial operan con responsabilidades diferenciadas.

### 11. Fase 6 — Fortalecimiento analítico, operación e interoperabilidad progresiva

#### Objetivo

Escalar las lecturas analíticas, la confiabilidad operativa y la capacidad de integración sin comprometer privacidad, gobierno ni autonomía de SIMUS.

#### Por qué ocurre en este momento

La analítica ya inició en la Fase 1. En este punto existen fuentes y reglas de publicación más consolidadas para profundizar series, agregados, exportaciones y análisis institucional. Las integraciones se abordan cuando hay contratos y procedencia sólidos.

#### Dependencias

Fases anteriores cerradas; métricas de uso/volumen/rendimiento; definiciones de indicadores; política de exportación; evaluación de privacidad; acuerdos institucionales para integraciones.

#### Capacidades que entrega

- Modelos de lectura fortalecidos para analítica pública, externa e institucional.
- Series, agregados, filtros, exportaciones autorizadas y mejora progresiva del mapa.
- Observabilidad de operación, importaciones y lecturas; criterios para capacidad/recuperación.
- Adaptadores de interoperabilidad futura, sin dependencia obligatoria de Soy Cultura, SSO u otros sistemas.
- IA asistiva controlada, si se aprueba, para clasificación, normalización, coincidencias o anomalías con revisión humana.

#### Desarrollo actual que reutiliza

Mapa Leaflet, endpoints y servicios de mapa, SQL Server, catálogos, auditoría, notificaciones, health checks, rate limiting y modelos de lectura introducidos en Fase 1.

#### Cambios estructurales

Vistas/agregados/materializaciones proporcionados, procesos de actualización y control de exportaciones. Un almacén analítico separado, mensajería distribuida, SSO, Soy Cultura o proveedor de IA solo se consideran si las métricas, acuerdos y análisis justifican su costo.

#### Riesgos

Reidentificación o sobreexposición por exportación, indicadores sin definición estable, consultas costosas sobre transaccional, dependencias externas frágiles, automatización que sustituya revisión humana y sobrearquitectura.

#### Criterio para considerar la fase terminada

Las analíticas acordadas tienen definición, fuente, fecha de corte, controles de visibilidad y rendimiento verificable; las exportaciones son auditables; la operación cuenta con métricas, logs, respaldo/restauración y criterios de escalamiento. Ninguna integración externa es requisito para considerar exitoso el roadmap base de SIMUS; cuando exista, conserva autonomía y procedencia.

### 12. Transversales de todas las fases

Las fases no sustituyen obligaciones continuas: accesibilidad, protección de datos personales, seguridad, auditoría, pruebas de autorización/publicación, observabilidad, documentación de contratos, respaldo/restauración y gestión de catálogos. Cada fase debe revisar estos elementos antes de declararse terminada.

### 13. Límites de este roadmap y siguiente derivación

Este roadmap no ordena iniciar código ni reemplaza el análisis de factibilidad de cada fase. Tampoco define las épicas, los cortes verticales, estimaciones, cronograma, responsables o infraestructura concreta.

La siguiente fase documental, cuando se apruebe este roadmap, será derivar las **épicas** por capacidad. Después se definirán, dentro de esas épicas, **cortes verticales** end-to-end que permitan probar el avance con evidencia funcional, de seguridad y de datos.

## Marco y criterios de épicas

### Qué es una épica

Una épica es una capacidad sustantiva de producto, información, gobierno, seguridad o plataforma. El roadmap define el orden macro; la épica define qué capacidad se desarrolla; los futuros cortes verticales demostrarán flujos end-to-end. Ninguna épica equivale a una pantalla, tabla, endpoint o tarea técnica.

### Criterios de tamaño y frontera

Una épica tiene una responsabilidad, audiencia o ciclo propio, dependencias identificables y resultado observable. Se separan capacidades cuando una puede avanzar sin la otra o cuando confundirlas crea circularidad: cuenta externa ≠ perfil de agente; identidad institucional ≠ frontend institucional; analítica estructural ≠ interoperabilidad/IA condicionada; auditoría técnica ≠ trazabilidad funcional.

Festival es el primer dominio sectorial. El patrón correcto es Festival → gobierno/publicación → Festival publicado → analítica pública. Festival no necesita analítica para existir; la analítica inicial ya comienza con datos aprobados disponibles.

### Nomenclatura, estados y prioridad

Los identificadores EP-01 a EP-17 son estables para v02. Cada ficha se marca **PROPUESTA — PENDIENTE DE APROBACIÓN**. Los documentos están en `REV`; ni las épicas ni su derivación autorizan implementación.

| Nivel | Criterio |
|---|---|
| FUNDACIONAL | Seguridad, contratos o identidades que habilitan varias capacidades. |
| TEMPRANA | Valida cuenta, organización, Festival, publicación o analítica inicial. |
| INTERMEDIA | Consolida operación institucional y gobierno sectorial. |
| AVANZADA | Amplía dominios o fortalece analítica. |
| FUTURA / CONDICIONADA | No bloquea el roadmap base; depende de evidencia o acuerdos externos. |

### Límites

No se incluyen como trabajo del piloto: directorios públicos de agentes/organizaciones, integración obligatoria con Soy Cultura, SSO, proveedor MFA, data warehouse separado, microservicios, motor externo de permisos o IA decisoria. Mercados, escuelas, talleres y espacios se evalúan tras Festival, sin generalización automática.

## Catálogo maestro de épicas

Todas las fichas son **PROPUESTA — PENDIENTE DE APROBACIÓN**. Los cortes citados son solo nombres conceptuales, no historias ni especificaciones.

### EP-01 — Línea base, seguridad, auditoría y observabilidad
#### Propósito
Operar, observar y auditar técnicamente SIMUS con evidencia y recuperación.
#### Problema que resuelve
El estado actual tiene brechas de rutas privadas, dependencia/operación TBC y cobertura de auditoría parcial.
#### Audiencias principales
Tecnología, datos, funcionarios; transversal.
#### Fase(s) del roadmap
F0 inicio; F1–F6 fortalecimiento.
#### Alcance
Logs estructurados, correlación, métricas, health checks, respaldos, restauración, controles de seguridad y auditoría técnica base.
#### Fuera de alcance
Proveedor de monitoreo, MFA específico o plataforma cloud definida.
#### Dependencias
Ninguna funcional.
#### Capacidades reutilizadas del sistema actual
**VERIFICADO/PARCIAL:** middleware, health checks, rate limiting, `AuditLogs` y pruebas API.
#### Resultado observable
Cambios críticos son observables, recuperables y revisables técnicamente.
#### Riesgos principales
Inventario incompleto, datos sensibles en logs o UI tratada como control de seguridad.
#### Decisiones abiertas relacionadas
`SQLitePCLRaw`, retención y monitoreo.
#### Posibles cortes verticales futuros
“Acción sensible con auditoría técnica”; “restauración comprobada”.
#### Estado
**PROPUESTA — PENDIENTE DE APROBACIÓN**

### EP-02 — Fronteras, contratos y catálogos maestros
#### Propósito
Ordenar ámbitos internos y conservar los maestros estructurados.
#### Problema que resuelve
API, Angular y `PnmcDbContext` concentran responsabilidades; clasificación y territorio se reutilizan sin ownership explícito.
#### Audiencias principales
Tecnología, datos, administración; transversal.
#### Fase(s) del roadmap
F1 inicio; F2–F6 desarrollo.
#### Alcance
Contratos por ámbito y gobierno de DIVIPOLA, PracticasMusicales, TerritoriosSonoros y demás maestros.
#### Fuera de alcance
Renombrado masivo, nueva jerarquía género/práctica o segunda base.
#### Dependencias
EP-01.
#### Capacidades reutilizadas del sistema actual
**VERIFICADO:** `Categories`, `DivipolaLocations`, catálogo y endpoints de mapa.
#### Resultado observable
Contratos críticos con responsable; catálogos no sustituidos por texto libre.
#### Riesgos principales
Modularización nominal, ruptura de consumidores o mezcla de clasificaciones.
#### Decisiones abiertas relacionadas
Catálogo futuro de expresiones/géneros.
#### Posibles cortes verticales futuros
“Festival con territorio y práctica validados”.
#### Estado
**PROPUESTA — PENDIENTE DE APROBACIÓN**

### EP-03 — Identidad y cuenta externa
#### Propósito
Proveer identidad de acceso externa segura, distinta de la institucional.
#### Problema que resuelve
Registro/verificación externa existe de forma **PARCIAL** y no demuestra sesión externa integral.
#### Audiencias principales
Usuario externo, agente, administrador de organización.
#### Fase(s) del roadmap
F2 inicio; F3–F6 fortalecimiento.
#### Alcance
Registro, verificación, sesión, recuperación, seguridad e identidad de acceso externa.
#### Fuera de alcance
Perfil de agente obligatorio, directorio público, Soy Cultura o documento como autenticación suficiente.
#### Dependencias
EP-01 y EP-02.
#### Capacidades reutilizadas del sistema actual
**PARCIAL:** `/external/auth/register`, verificación de correo, `Users` y códigos.
#### Resultado observable
Una persona tiene cuenta externa y puede administrar una organización sin perfil musical.
#### Riesgos principales
Recuperación insegura, mezcla de ámbitos o exposición de datos.
#### Decisiones abiertas relacionadas
Verificación de identidad y canales de recuperación.
#### Posibles cortes verticales futuros
“Persona crea y verifica cuenta externa”.
#### Estado
**PROPUESTA — PENDIENTE DE APROBACIÓN**

### EP-04 — Perfil de agente y directorio autenticado
#### Propósito
Permitir perfil musical opcional y consulta de agentes solo a usuarios autenticados.
#### Problema que resuelve
Cuenta y perfil son conceptos distintos; el perfil no debe bloquear el primer dominio.
#### Audiencias principales
Agente, usuario externo autenticado, funcionario.
#### Fase(s) del roadmap
F2 inicio opcional; F3–F6 desarrollo.
#### Alcance
Perfil progresivo, roles/oficios, territorio, prácticas, instrumentos, especialidades, trayectoria, visibilidad y directorio autenticado.
#### Fuera de alcance
Directorio público de agentes o requisito de perfil para organización/Festival.
#### Dependencias
EP-03 y EP-02; no bloquea EP-05 ni EP-06.
#### Capacidades reutilizadas del sistema actual
**TBC:** no hay perfil de agente integral comprobado.
#### Resultado observable
Una cuenta puede crear perfil opcional; usuarios autorizados consultan agentes conforme a política.
#### Riesgos principales
Exposición de datos, perfil forzoso o confusión con cuenta.
#### Decisiones abiertas relacionadas
Campos de perfil y política de visibilidad.
#### Posibles cortes verticales futuros
“Persona completa perfil privado”; “usuario autenticado consulta agente”.
#### Estado
**PROPUESTA — PENDIENTE DE APROBACIÓN**

### EP-05 — Organizaciones, autorizaciones y contextos
#### Propósito
Permitir organización activa, administrador inicial y permisos por alcance.
#### Problema que resuelve
La gestión externa persistente está incompleta y relación institucional ≠ permiso digital.
#### Audiencias principales
Administrador de organización, editor delegado, funcionario.
#### Fase(s) del roadmap
F2 inicio; F3–F5 desarrollo.
#### Alcance
Registro sin aprobación previa, equipo, invitaciones, revocaciones, alcance por organización/proceso/recurso y cambio de contexto.
#### Fuera de alcance
Login de organización, superusuario externo, ABAC complejo o directorio público.
#### Dependencias
EP-01, EP-02 y EP-03.
#### Capacidades reutilizadas del sistema actual
**PARCIAL:** `Organizations`, `EntityProfiles`, `UserEntityRow`, `Ally*` y auditoría.
#### Resultado observable
Persona registra organización, recibe autorización inicial y actúa solo en recursos permitidos.
#### Riesgos principales
Escalamiento por contexto, permisos de aliados implícitos o pérdida de trazabilidad.
#### Decisiones abiertas relacionadas
Verificación futura de organizaciones y detalle de roles.
#### Posibles cortes verticales futuros
“Persona registra organización”; “admin autoriza editor de Festival”.
#### Estado
**PROPUESTA — PENDIENTE DE APROBACIÓN**

### EP-06 — Festival como primer dominio sectorial
#### Propósito
Validar el primer proceso sectorial sin imponer su modelo a otros dominios.
#### Problema que resuelve
Se requiere probar organización responsable, autorización y registro sectorial en un objeto con identidad propia.
#### Audiencias principales
Organización, editor, funcionario y visitante.
#### Fase(s) del roadmap
F2 inicio; F3 validación; F5 fortalecimiento.
#### Alcance
Festival en borrador, organización responsable, territorio/prácticas y preparación para gobierno, lectura y notificación.
#### Fuera de alcance
Mercados, escuelas, talleres, espacios, modelo universal o edición completa.
#### Dependencias
EP-01, EP-02, EP-03 y EP-05. No depende de EP-08.
#### Capacidades reutilizadas del sistema actual
**VERIFICADO/PARCIAL:** `FestivalRow`, mapa, administración y relaciones existentes.
#### Resultado observable
Organización autorizada crea y gestiona Festival en borrador.
#### Riesgos principales
Ficha plana, identidad confundida con edición o generalización prematura.
#### Decisiones abiertas relacionadas
Campos definitivos, edición y métricas.
#### Posibles cortes verticales futuros
“Organización crea Festival en borrador”.
#### Estado
**PROPUESTA — PENDIENTE DE APROBACIÓN**

### EP-07 — Gobierno, publicación y versionado
#### Propósito
Revisar y publicar el Festival sin sobrescribir la versión pública vigente.
#### Problema que resuelve
Estados y revisión existen, pero versión publicada/propuesta pendiente es **PARCIAL**.
#### Audiencias principales
Funcionario, organización, editor y visitante.
#### Fase(s) del roadmap
F3 inicio; F4–F6 fortalecimiento.
#### Alcance
BORRADOR, EN REVISIÓN, AJUSTES, PUBLICADO, RECHAZADO, ARCHIVADO; propuesta, historial y visibilidad.
#### Fuera de alcance
Event sourcing completo, publicación automática o extensión automática a otros objetos.
#### Dependencias
EP-06 y EP-09; consume EP-14 para avisos, no depende de EP-08.
#### Capacidades reutilizadas del sistema actual
**PARCIAL:** estados, revisión, `EntityReviewHistoryRow` y endpoints de gobierno.
#### Resultado observable
Festival publicado conserva versión visible mientras una propuesta se revisa.
#### Riesgos principales
Promoción inconsistente, borradores públicos o pérdida de procedencia.
#### Decisiones abiertas relacionadas
Estructura física de versiones y reglas de archivo.
#### Posibles cortes verticales futuros
“Funcionario publica Festival”; “organización propone cambio”.
#### Estado
**PROPUESTA — PENDIENTE DE APROBACIÓN**

### EP-08 — Analítica inicial y evolución del mapa
#### Propósito
Iniciar analítica sobre datos aprobados y mover el mapa a lecturas gobernadas.
#### Problema que resuelve
Mapa ≠ analítica; la lectura actual necesita reglas homogéneas de publicación, privacidad y corte.
#### Audiencias principales
Visitante, usuario externo, funcionario y datos.
#### Fase(s) del roadmap
F1 inicio; F3 integra Festival publicado; F6 transfiere fortalecimiento a EP-16.
#### Alcance
Indicadores iniciales, modelos de lectura, fecha de corte, filtros, visibilidad y evolución del mapa.
#### Fuera de alcance
Data warehouse separado, dependencia de Festival para iniciar o exportación sin política.
#### Dependencias
EP-01 y EP-02; para incorporar Festival público depende de EP-07.
#### Capacidades reutilizadas del sistema actual
**VERIFICADO/PARCIAL:** Leaflet, `MapDataService`, `MapEndpoints`, capas y exportación; publicación homogénea es parcial.
#### Resultado observable
Analítica inicial usa datos aprobados existentes; Festival publicado se incorpora progresivamente.
#### Riesgos principales
Consultas costosas, métricas ambiguas, reidentificación o borradores en lectura.
#### Decisiones abiertas relacionadas
Indicadores y política de exportación.
#### Posibles cortes verticales futuros
“Mapa consulta lectura aprobada”; “indicador territorial de Festivales publicados”.
#### Estado
**PROPUESTA — PENDIENTE DE APROBACIÓN**

### EP-09 — Identidad y seguridad institucional
#### Propósito
Habilitar revisión institucional con identidad, sesión y políticas independientes antes del frontend separado.
#### Problema que resuelve
Hay un esquema/cookie administrativa único; la frontera externo–institucional no está completada.
#### Audiencias principales
Funcionario SIMUS y gestor interno autorizado.
#### Fase(s) del roadmap
F1 preparación; F3 inicio/desarrollo; F4 fortalecimiento.
#### Alcance
Autenticación institucional, cookie/sesión propia, políticas excluyentes, auditoría institucional y no escalamiento desde externo.
#### Fuera de alcance
Segundo frontend, SSO o MFA obligatorio para el piloto.
#### Dependencias
EP-01 y EP-02.
#### Capacidades reutilizadas del sistema actual
**VERIFICADO:** `/admin/auth`, autorización API y cookie `pnmc.admin`; requiere separar ámbitos.
#### Resultado observable
Funcionario revisa Festival con sesión institucional que no deriva de sesión externa.
#### Riesgos principales
Cookies mal aisladas, privilegio cruzado o frontend asumido como control.
#### Decisiones abiertas relacionadas
MFA, SSO y dominio/ciclo de sesión.
#### Posibles cortes verticales futuros
“Funcionario institucional revisa Festival”.
#### Estado
**PROPUESTA — PENDIENTE DE APROBACIÓN**

### EP-10 — Separación del frontend institucional
#### Propósito
Extraer progresivamente la experiencia administrativa a un segundo frontend Angular.
#### Problema que resuelve
Administración y colaboradores comparten shell y la separación de experiencia/despliegue no está materializada.
#### Audiencias principales
Funcionario SIMUS y equipo administrador.
#### Fase(s) del roadmap
F4 inicio y desarrollo; F5–F6 fortalecimiento.
#### Alcance
Shell, navegación, login institucional propio, extracción de paneles, despliegue independiente y contratos de UI sobre API común.
#### Fuera de alcance
Nueva API/base, cambio de modelo de gobierno o creación de identidad institucional.
#### Dependencias
EP-09, EP-07 y contratos estables de EP-02.
#### Capacidades reutilizadas del sistema actual
**VERIFICADO/PARCIAL:** shell/paneles admin, `AdminService` y `/admin/*`.
#### Resultado observable
Administración opera en frontend separado con API común y políticas institucionales ya vigentes.
#### Riesgos principales
Duplicación de UI, rutas heredadas, CORS/CSRF o despliegues sin observabilidad.
#### Decisiones abiertas relacionadas
Dominio de despliegue y biblioteca compartida.
#### Posibles cortes verticales futuros
“Panel institucional revisa Festival publicado”.
#### Estado
**PROPUESTA — PENDIENTE DE APROBACIÓN**

### EP-11 — Gestión editorial institucional / CMS
#### Propósito
Consolidar contenidos institucionales con gobierno editorial diferenciado del dato sectorial.
#### Problema que resuelve
Textos, noticias, agenda, editorial y galería existen, pero su CMS unificado es parcial.
#### Audiencias principales
Editor institucional y visitante.
#### Fase(s) del roadmap
F1 conservación; F4 preparación; F5 desarrollo.
#### Alcance
PNMC, páginas, textos, noticias, agenda, publicaciones, galerías y archivos, con ciclos editoriales propios.
#### Fuera de alcance
CMS SaaS, tabla única obligatoria o detener contenidos hasta F5.
#### Dependencias
EP-02 y EP-09; puede avanzar coordinadamente con EP-10.
#### Capacidades reutilizadas del sistema actual
**VERIFICADO:** endpoints de agenda, noticias, editorial, galería y administración.
#### Resultado observable
Contenido institucional se gestiona sin alterar gobierno de registros sectoriales.
#### Riesgos principales
Mezcla editorial/sectorial, ruptura de publicaciones o duplicación de modelo.
#### Decisiones abiertas relacionadas
Flujos editoriales, permisos y archivos.
#### Posibles cortes verticales futuros
“Editor publica noticia”.
#### Estado
**PROPUESTA — PENDIENTE DE APROBACIÓN**

### EP-12 — Importaciones y procedencia
#### Propósito
Incorporar datos por lotes trazables, validables y reversibles.
#### Problema que resuelve
El lote completo con archivo, fuente, responsable, resultados y reversión no está comprobado.
#### Audiencias principales
Funcionario SIMUS y equipos de datos.
#### Fase(s) del roadmap
F4 preparación; F5 inicio/desarrollo; F6 fortalecimiento.
#### Alcance
Lote, fuente, archivo/referencia, responsable, validación, normalización, conflictos, borradores y reversión gobernada.
#### Fuera de alcance
Publicación directa, eliminación masiva, integración obligatoria o IA decisoria.
#### Dependencias
EP-01, EP-02, EP-07 y EP-09.
#### Capacidades reutilizadas del sistema actual
**PARCIAL:** soporte de bootstrap/importación y trazabilidad diagnosticada.
#### Resultado observable
Todo importado se atribuye a lote y atraviesa revisión/publicación.
#### Riesgos principales
Archivo inseguro, reversión destructiva, fuente perdida o datos sensibles en logs.
#### Decisiones abiertas relacionadas
Formatos, límites y retención.
#### Posibles cortes verticales futuros
“Lote crea Festival en borrador”.
#### Estado
**PROPUESTA — PENDIENTE DE APROBACIÓN**

### EP-13 — Vinculación, duplicados y calidad
#### Propósito
Gestionar continuidad y confiabilidad de registros sin un flujo universal artificial.
#### Problema que resuelve
Vínculos, candidatos y alertas existen parcialmente; sus decisiones no prueban efectos persistentes completos.
#### Audiencias principales
Organización, funcionario y equipos de datos.
#### Fase(s) del roadmap
F5 inicio/desarrollo; F6 fortalecimiento.
#### Alcance
Vinculación de registro histórico; candidato/decisión de duplicado; alerta de calidad como tres subcapacidades diferenciadas.
#### Fuera de alcance
Reclamo jurídico, fusión automática o calidad como estado de publicación.
#### Dependencias
EP-05, EP-06, EP-07, EP-09 y EP-14.
#### Capacidades reutilizadas del sistema actual
**PARCIAL:** `RecordLinkRequests`, duplicados, alertas y endpoints de gobierno.
#### Resultado observable
Decisiones crean relación o resolución trazable, preservando procedencia e historial.
#### Riesgos principales
Fusión irreversible, falsa atribución, automatización indebida o workflow único.
#### Decisiones abiertas relacionadas
Reglas de coincidencia, fusión y alertas bloqueantes.
#### Posibles cortes verticales futuros
“Organización solicita vincular Festival histórico”; “funcionario resuelve duplicado”.
#### Estado
**PROPUESTA — PENDIENTE DE APROBACIÓN**

### EP-14 — Notificaciones y trazabilidad funcional
#### Propósito
Registrar qué ocurrió en el negocio SIMUS, quién lo hizo y quién debe conocerlo.
#### Problema que resuelve
Los eventos de negocio requieren avisos y trazabilidad sin duplicar la auditoría técnica de EP-01.
#### Audiencias principales
Usuario externo, organización, editor y funcionario.
#### Fase(s) del roadmap
F2 inicio; F3–F6 desarrollo transversal.
#### Alcance
Eventos de invitación, permiso, revisión, ajuste, publicación, rechazo, vinculación, duplicado, importación y calidad; notificación interna y correo futuro.
#### Fuera de alcance
Logs/métricas/respaldos de plataforma, bus distribuido o canal externo obligatorio.
#### Dependencias
Consume infraestructura de EP-01 y eventos de EP-03 a EP-13.
#### Capacidades reutilizadas del sistema actual
**VERIFICADO/PARCIAL:** `Notifications`, `AuditLogs` y endpoints; cobertura de negocio por completar.
#### Resultado observable
Eventos relevantes son atribuibles funcionalmente y se informan conforme a política.
#### Riesgos principales
Ruido, filtración, doble aviso o falta de contexto.
#### Decisiones abiertas relacionadas
Canales, preferencias y retención de notificaciones.
#### Posibles cortes verticales futuros
“Festival enviado a revisión notifica y deja trazabilidad”.
#### Estado
**PROPUESTA — PENDIENTE DE APROBACIÓN**

### EP-15 — Extensión diferenciada del modelo sectorial
#### Propósito
Analizar e incorporar nuevos dominios según sus diferencias reales después de validar Festival.
#### Problema que resuelve
El alcance nacional exige mercados, escuelas, talleres, espacios, ediciones, eventos y caracterizaciones, pero no comparten necesariamente el mismo modelo.
#### Audiencias principales
Agentes, organizaciones, funcionarios, visitantes y datos.
#### Fase(s) del roadmap
F5 preparación; F6 desarrollo progresivo y posterior ampliación.
#### Alcance
Evaluación y extensión diferenciada de mercados, escuelas, talleres, espacios, ediciones, eventos y caracterizaciones.
#### Fuera de alcance
Implementar todos a la vez o reutilizar Festival como plantilla obligatoria.
#### Dependencias
EP-02, EP-05 a EP-08, EP-12 a EP-14.
#### Capacidades reutilizadas del sistema actual
**VERIFICADO/PARCIAL:** `Schools`, `Markets`, `SpacesInfrastructure`, fichas y capas actuales.
#### Resultado observable
Cada dominio nuevo tiene identidad, temporalidad, relaciones y gobierno analizados antes de construirse.
#### Riesgos principales
Copiar campos sin sentido, proliferar tipos o invalidar datos existentes.
#### Decisiones abiertas relacionadas
Orden de dominios, campos, métricas y caracterizaciones.
#### Posibles cortes verticales futuros
“Mercado con edición”; “escuela con caracterización periódica”.
#### Estado
**PROPUESTA — PENDIENTE DE APROBACIÓN**

### EP-16 — Fortalecimiento analítico
#### Propósito
Profundizar analítica pública, externa e institucional como capacidad estructural del roadmap.
#### Problema que resuelve
Tras la analítica inicial, crecimiento de fuentes y uso exige series, agregados, rendimiento, exportaciones y modelos de lectura más robustos.
#### Audiencias principales
Visitante, usuario externo, funcionario y equipos de datos.
#### Fase(s) del roadmap
F6 inicio/desarrollo; deriva de EP-08.
#### Alcance
Series históricas, agregados, indicadores avanzados, rendimiento, modelos de lectura, exportaciones autorizadas y evolución del mapa.
#### Fuera de alcance
Soy Cultura, IA, data warehouse separado, arquitectura distribuida o requisito de proveedor externo.
#### Dependencias
EP-01, EP-02, EP-07, EP-08 y políticas de privacidad/exportación.
#### Capacidades reutilizadas del sistema actual
**VERIFICADO/PARCIAL:** SQL Server, mapa, catálogos y lecturas introducidas por EP-08.
#### Resultado observable
Analítica avanzada es reproducible, gobernada y performante sin depender de integraciones externas.
#### Riesgos principales
Reidentificación, carga transaccional, indicadores inestables o sobrearquitectura.
#### Decisiones abiertas relacionadas
Umbral de escala, definiciones de indicador y exportaciones.
#### Posibles cortes verticales futuros
“Serie territorial de Festivales publicados”.
#### Estado
**PROPUESTA — PENDIENTE DE APROBACIÓN**

### EP-17 — Interoperabilidad e IA asistiva
#### Propósito
Preparar capacidades futuras de relación con fuentes externas e IA supervisada.
#### Problema que resuelve
SIMUS debe poder integrarse y asistir trabajo humano sin depender de ello ni delegar decisiones institucionales.
#### Audiencias principales
Funcionarios, datos y tecnología; impacto futuro en otras audiencias.
#### Fase(s) del roadmap
F6 y posterior, solo si evidencia, acuerdos y evaluación lo justifican.
#### Alcance
Adaptadores para Soy Cultura, SSO, sistemas territoriales, observatorios/fuentes; IA para clasificación, normalización, coincidencias, mapeos y anomalías con revisión humana.
#### Fuera de alcance
Integración obligatoria, proveedor definido, IA decisoria, microservicios, data warehouse o arquitectura distribuida.
#### Dependencias
EP-01, EP-02, EP-12, EP-16 y acuerdos/políticas aún no disponibles.
#### Capacidades reutilizadas del sistema actual
**TBC:** no hay integraciones o IA aprobadas/disponibles como requisito.
#### Resultado observable
Si se aprueba, un adaptador o sugerencia asistiva conserva procedencia, autonomía y decisión humana.
#### Riesgos principales
Dependencia externa, privacidad, automatización indebida o bloqueo por acuerdos inexistentes.
#### Decisiones abiertas relacionadas
Soy Cultura, SSO, proveedor, privacidad y gobernanza de IA.
#### Posibles cortes verticales futuros
“Sugerencia de coincidencia revisada por funcionario”.
#### Estado
**FUTURA / CONDICIONADA — PENDIENTE DE APROBACIÓN**

## Mapa de dependencias entre épicas

```text
EP-01 Línea base, seguridad, auditoría y observabilidad
  ↓
EP-02 Fronteras, contratos y catálogos
  ├──→ EP-08 Analítica inicial y mapa ─────────────→ EP-16 Fortalecimiento analítico
  ├──→ EP-09 Identidad y seguridad institucional ──┐
  └──→ EP-03 Identidad y cuenta externa             │
           ├──→ EP-04 Perfil de agente (no bloqueante)
           └──→ EP-05 Organizaciones/autorizaciones │
                     ↓                               │
                  EP-06 Festival                     │
                     ↓                               │
                  EP-07 Gobierno/publicación ←──────┘
                     ├──→ EP-10 Frontend institucional
                     ├──→ EP-12 Importaciones/procedencia
                     └──→ EP-13 Vinculación/duplicados/calidad

EP-14 Notificaciones y trazabilidad funcional consume EP-01
y atraviesa los eventos de EP-03 a EP-13.

EP-15 Extensión diferenciada depende de Festival validado y gobierno.
EP-17 Interoperabilidad e IA asistiva: FUTURA / CONDICIONADA; no bloquea el roadmap base.
```

No existe ciclo: EP-06 Festival no depende de EP-08; EP-08 inicia con datos aprobados existentes e incorpora Festival solo después de EP-07. EP-09 habilita revisión institucional antes de EP-10. EP-14 usa auditoría técnica de EP-01 sin duplicarla.

## Matriz épicas × fases

Leyenda: **I** inicio · **D** desarrollo · **F** fortalecimiento/continuidad · **Dep** dependencia · **Cond** capacidad futura/condicionada, fuera del camino crítico y no requerida para cerrar F6 ni el roadmap base.

| Épica | F0 | F1 | F2 | F3 | F4 | F5 | F6 |
|---|---|---|---|---|---|---|---|
| EP-01 Línea base/seguridad/auditoría/observabilidad | I | D | F | F | F | F | F |
| EP-02 Fronteras/contratos/catálogos | Dep | I | D | D | F | F | F |
| EP-03 Identidad y cuenta externa | Dep | Dep | I | D | F | F | F |
| EP-04 Perfil de agente/directorio autenticado | Dep | Dep | I/D | D | F | F | F |
| EP-05 Organizaciones/autorizaciones/contextos | Dep | Dep | I | D | F | D | F |
| EP-06 Festival | Dep | Dep | I | D | F | F | F |
| EP-07 Gobierno/publicación/versionado | Dep | Dep | Dep | I/D | F | F | F |
| EP-08 Analítica inicial/mapa | Dep | I | D | D | F | F | F |
| EP-09 Identidad/seguridad institucional | Dep | I | Dep | I/D | F | F | F |
| EP-10 Frontend institucional | Dep | Dep | Dep | Dep | I/D | F | F |
| EP-11 CMS | Dep | D | D | D | I | D | F |
| EP-12 Importaciones/procedencia | Dep | Dep | Dep | Dep | I | D | F |
| EP-13 Vinculación/duplicados/calidad | Dep | Dep | Dep | Dep | D | I/D | F |
| EP-14 Notificaciones/trazabilidad funcional | Dep | Dep | I | D | F | F | F |
| EP-15 Extensión diferenciada | Dep | Dep | Dep | Dep | Dep | I | D |
| EP-16 Fortalecimiento analítico | Dep | Dep | Dep | Dep | Dep | Dep | I/D |
| EP-17 Interoperabilidad/IA [futura] | — | — | — | — | — | — | Cond |

F4 y F5 pueden coordinarse tras contratos y controles de F3; EP-10 no bloquea EP-12 o EP-13 cuando no dependen materialmente de frontend separado.

## Matriz épicas × experiencias

Leyenda: **P** principal · **S** secundaria · **T** transversal · — sin impacto directo.

| Épica | Público | Externo | Organización | Institucional | Transversal |
|---|---|---|---|---|---|
| EP-01 | S | S | S | S | T |
| EP-02 | S | S | S | S | T |
| EP-03 | — | P | S | S | T |
| EP-04 | — | P | S | S | T |
| EP-05 | — | S | P | S | T |
| EP-06 | P tras publicación | S | P | P | S |
| EP-07 | P | S | S | P | T |
| EP-08 | P | P | S | P | T |
| EP-09 | — | — | — | P | T |
| EP-10 | — | — | — | P | S |
| EP-11 | P | — | — | P | S |
| EP-12 | — | — | — | P | T |
| EP-13 | — | S | S | P | T |
| EP-14 | S | P | P | P | T |
| EP-15 | P | S | P | P | T |
| EP-16 | P | P | S | P | T |
| EP-17 | — | — | — | S | T |

EP-04 y EP-05 no habilitan directorios públicos: agentes y organizaciones solo se consultan autenticadamente en esta fase. Festival público aparece únicamente tras EP-07.

## Trazabilidad: documento maestro, roadmap y diagnóstico

| Épica | Documento maestro | Fase | Estado/brecha actual | Arquitectura relacionada |
|---|---|---|---|---|
| EP-01 | §§19–21 | F0–F6 | Seguridad/operación: PARCIAL/TBC | Evidencia operativa transversal. |
| EP-02 | §§10,20 | F1–F6 | API/DbContext comunes: VERIFICADO | Modularización; SQL Server único. |
| EP-03 | §11 | F2 | Registro externo: PARCIAL | Ámbito externo separado. |
| EP-04 | §§7,11,13 | F2–F6 | Perfil/directorio: TBC | Cuenta ≠ perfil; sin directorio público. |
| EP-05 | §12 | F2–F5 | Gestión externa: PARCIAL/MOCK | Roles + alcances + relaciones. |
| EP-06 | §§7–9 | F2–F3 | Festival/mapa: VERIFICADO/PARCIAL | Primer dominio sin generalizar. |
| EP-07 | §14 | F3–F6 | Revisión/versiones: PARCIAL | Publicada + propuesta + historial. |
| EP-08 | §16 | F1,F3,F6 | Mapa: VERIFICADO; lectura: PARCIAL | Analítica temprana. |
| EP-09 | §§18–19 | F1–F4 | Cookie/esquema único: VERIFICADO | Políticas/sesiones excluyentes. |
| EP-10 | §18 | F4–F6 | Shell admin: VERIFICADO | Dos frontends, API común. |
| EP-11 | §16 | F1,F4,F5 | Contenidos: VERIFICADO/PARCIAL | CMS ≠ gobierno sectorial. |
| EP-12 | §15 | F4–F6 | Lote/reversión: PARCIAL | Procedencia gobernada. |
| EP-13 | §15 | F5–F6 | Vínculos/duplicados/calidad: PARCIAL | Sin fusión automática. |
| EP-14 | §§15,19 | F2–F6 | Notifications/AuditLogs: VERIFICADO/PARCIAL | Traza funcional sobre base técnica. |
| EP-15 | §§7–9 | F5–F6 | Otros dominios: VERIFICADO/PARCIAL | Diferencias previas a extensión. |
| EP-16 | §16 | F6 | Analítica avanzada: PARCIAL | Agregados sin almacén obligado. |
| EP-17 | §16 | F6+ | Integraciones/IA: TBC | Futura/condicionada, autónoma. |

Los documentos preliminares de diagnóstico 05–08 no son fuente de arquitectura aprobada.

## Priorización y orden de activación

La prioridad no asigna tiempo ni responsables; expresa dependencia, seguridad y valor de validación.

| Nivel | Épicas | Justificación |
|---|---|---|
| FUNDACIONAL | EP-01, EP-02, EP-09, EP-14 | Operación técnica, contratos, seguridad institucional y trazabilidad funcional progresiva. |
| TEMPRANA | EP-03, EP-04, EP-05, EP-06, EP-07, EP-08 | Cuenta, organización, Festival, gobierno y analítica inicial. EP-04 es temprana pero no bloquea EP-05/EP-06. |
| INTERMEDIA | EP-10, EP-11, EP-12, EP-13 | Frontend institucional, CMS, importación/procedencia y continuidad/calidad. |
| AVANZADA | EP-15, EP-16 | Extensión diferenciada y analítica avanzada. |
| FUTURA / CONDICIONADA | EP-17 | Interoperabilidad/IA no bloquea el roadmap base. |

La secuencia crítica es EP-01 → EP-02 → EP-03 → EP-05 → EP-06 → EP-07. EP-08 corre en paralelo desde F1 y recibe Festival solo publicado. EP-09 habilita revisión institucional antes de EP-10. EP-10, EP-12 y EP-13 pueden coordinarse después de F3 según contratos/controles. EP-14 consume la base de EP-01 y acompaña los flujos sin duplicar observabilidad.

## Resumen no técnico de épicas maestras

Las 17 épicas proponen las grandes capacidades para construir SIMUS sin convertir esta fase en tareas. Primero se ordenan seguridad, contratos, catálogos e identidades. La cuenta externa permite registrar una organización y gestionar un Festival sin exigir perfil musical; el perfil de agente se desarrolla de manera opcional y nunca crea un directorio público.

Festival sigue siendo el primer dominio de referencia. Después de existir como borrador, una identidad institucional independiente puede revisarlo y publicarlo. Solo entonces el Festival publicado se incorpora progresivamente a la analítica pública. La analítica ya comienza desde Fase 1 con información aprobada existente y se fortalece más adelante; no depende de Soy Cultura ni de IA.

La identidad institucional se resuelve antes del segundo frontend. La separación del frontend institucional viene después de validar gobierno/publicación y contratos. Importaciones, vínculos, calidad y CMS pueden coordinarse con esa extracción, sin quedar bloqueados artificialmente.

Auditoría y observabilidad técnica permiten operar el sistema; notificaciones y trazabilidad funcional explican qué ocurrió dentro del negocio y a quién avisar. Son complementarias, no duplicadas. Mercados, escuelas, talleres y espacios se incorporarán después de analizar sus diferencias frente a Festival. Interoperabilidad e IA quedan futuras y condicionadas.

### Validación estructural v02

1. No existe ciclo de dependencias entre épicas; Festival no depende de analítica.
2. El perfil de agente no bloquea organización ni Festival.
3. La identidad institucional existe antes de requerir un frontend institucional separado.
4. Festival no depende de analítica para existir.
5. La analítica inicial empieza antes de Festival y después incorpora Festival publicado.
6. El fortalecimiento analítico no depende de Soy Cultura ni de IA.
7. Interoperabilidad e IA no bloquean el roadmap base.
8. Auditoría técnica y trazabilidad funcional tienen responsabilidades distintas y no duplicadas.
9. Festival sigue siendo el primer dominio sectorial de referencia.
10. Mercado, escuela, taller y espacios no se generalizan prematuramente.
11. No se habilitan directorios públicos de agentes u organizaciones.
12. Documento Maestro y Roadmap no fueron modificados.

Tras revisión y aprobación de estas épicas, el siguiente paso documental será definir cortes verticales end-to-end; este documento no los deriva.
