# Arquitectura

Estado técnico del sistema, alternativas evaluadas para su evolución y arquitectura
objetivo. Cubre identidad y seguridad, autorización, gobierno del dato, analítica, CMS,
importaciones e integraciones, y la estrategia de migración incremental.

Para la estructura concreta de archivos y el esquema de base de datos vigentes, ver
`arquitectura-y-estructura.md`.

Cómo leer las marcas de evidencia:

| Marca | Significado |
|---|---|
| **VERIFICADO** | Comprobado en código o configuración |
| **PARCIAL** | Existe, incompleto |
| **MOCK** | Simulado, sin persistencia real |
| **TBC** | Por validar |
| **PROPUESTA** | Alternativa de diseño, no decisión aprobada |

## Arquitectura actual

### Estructura

`pnmc-web` es una aplicación Angular standalone: las páginas se cargan de forma diferida desde `app.routes.ts`; no se encontraron NgModules de funcionalidades. `core` concentra cliente HTTP, sesión, guard, navegación y servicios de datos. `features` agrupa páginas por tema y `shared` contiene navegación, pie y diez componentes de interfaz reutilizables.

`pnmc-api` separa API, Application, Contracts, Domain e Infrastructure. Expone Minimal APIs bajo `/api/v1`; registra middleware de contexto de solicitud, cabeceras de seguridad y excepciones. `pnmc-database` conserva scripts SQL de esquema, semilla, migraciones y validación.

El frontend contiene 66 archivos TypeScript, 43 componentes y 8 servicios. Sus páginas se distribuyen en: home; PNMC; contenidos/ejes/estrategias; noticias; agenda; editorial; galería; mapa; SIMUS/ecosistema; y administración. Sus componentes reutilizables actuales incluyen navegación, pie, hero compacto, hero de página, contenedor, cabecera de sección, etiquetas, estados remoto/carga/error, botón flotante y directiva de foco. No se encontró un layout Angular explícito: navegación y pie se componen directamente desde las páginas públicas, mientras el shell privado concentra su propia estructura.

### Capas y responsabilidades

| Capa | Estado observado |
|---|---|
| Presentación pública | Inicio, PNMC, ejes, noticias, agenda, editorial, galería, mapa, SIMUS y escuelas. |
| Presentación privada | Un solo `AdminShellPageComponent` sirve `/admin` y `/colaboradores`; decide vistas dentro del componente. |
| Datos frontend | `AdminService`, `BackendDataService`, `CatalogService`, `MapDataService`, `WebTextsService`; varios integran fallback o mocks. |
| API | 17 grupos de endpoints: catálogo, mapa, contenidos, participación, autenticación externa/admin, administración, aliados, gobernanza de registros y notificaciones. |
| Datos | Entidades de contenidos, procesos, organizaciones, usuarios/roles, territorialidad DIVIPOLA, solicitudes de vínculo, duplicados, alertas de calidad y trazabilidad. |

### Autenticación y autorización

La API utiliza cookies HTTP-only de 8 horas y controla accesos de endpoints con `RequireAuthorization`. Hay límites de tasa para registro externo y participación. El frontend posee `SessionService` y `authGuard`, pero el guard retorna `true` incluso si no existe sesión; por tanto no protege navegación. Además, las rutas `/admin` y `/colaboradores` no lo aplican. La autorización efectiva está en la API, pero la separación y la experiencia de acceso en frontend están incompletas.

### Evaluación

La arquitectura de backend y datos ya contiene una base aprovechable para gobernanza e identidad de registros. La principal tensión está en la presentación: un componente de gran tamaño concentra administración, colaboradores y tablero externo. La recomendación es extraer dominios y layouts sin reescribir API ni esquema de forma masiva.

## Arquitectura objetivo preliminar

> **PROPUESTA PRELIMINAR — NO APROBADA.** Se conserva como antecedente; debe leerse junto con `diagnostico/` antes de tomar decisiones.

Versión: v01  
Estado: REV  
Fecha: 2026-08-18  
Autor: Codex  
Deriva de: auditoría de línea base y marco PNMC/SIMUS  
Fuentes: repositorio; [Contexto · SIMUS](https://app.notion.com/p/3ad3799e122b8114b880f5a35295bd48); [Contexto · PNMC](https://app.notion.com/p/3ad3799e122b81529977f241044e8ac0).  
Destinatario: Grupo de Música, Grupo de Tecnología y equipo técnico.

### Decisión preliminar

Mantener el monolito modular actual —Angular + API .NET + base SQL— y evolucionar la frontera de rutas, layouts y autorización. No se justifica introducir microservicios ni reemplazar el backend. La API conserva la autoridad de permisos; los guards del frontend ordenan navegación y experiencia, sin ser control de seguridad por sí solos.

### Rutas y layouts propuestos

| Área | Prefijo | Layout | Acceso |
|---|---|---|---|
| Web pública | `/`, `/mapa`, `/simus`, fichas públicas | `PublicLayout` | Público |
| Autenticación | `/acceso/*` | `AuthLayout` | Público con redirección si hay sesión |
| Organización | `/organizacion/*` | `OrganizationLayout` | Usuario con membresía de organización |
| Aliados | `/aliado/*` | `AllyLayout` | Rol y alcance de aliado |
| Administración | `/admin/*` | `AdminLayout` | Rol interno autorizado |

Conservar temporalmente `/colaboradores` como redirección compatible cuando se acuerde el destino final. No crear rutas de cada subpágina hasta confirmar taxonomía y permisos.

### Estructura Angular sugerida

```text
app/
  core/                 # HTTP, sesión, autorización, configuración
  shared/               # UI transversal y tokens
  features/
    public/             # contenido, mapa, fichas
    auth/
    organizations/
    allies/
    admin/
    records-governance/
```

Cada feature tendrá `routes`, `pages`, `components`, `data-access` y `domain` solo cuando la complejidad lo demande. Se mantienen componentes standalone y carga diferida. Los modelos de API pasan gradualmente de `any` a contratos tipados compartidos desde OpenAPI o `PNMC.Contracts`.

### Datos y gobernanza

Separar conceptualmente registro histórico, organización y solicitud de vínculo. La coincidencia es una recomendación con señales y evidencia; nunca vincula por sí sola. Añadir, antes de una importación real ampliada, lote/fuente/archivo/fecha/responsable/identificador original y una estrategia reversible por lote.

### Impacto y migración

El primer cambio debe ser una ruta y layout de organización protegidos más la corrección de guard. A continuación, integrar una sola escritura de proceso y la solicitud de vínculo existentes. No se modifica el catálogo público ni las tablas actuales salvo que el slice demuestre una necesidad concreta. Cada corte debe mantener enlaces públicos y ejecutar `ng build` y pruebas API relevantes.

### Preguntas que requieren definición institucional

- Roles finales y reglas de membresía de una organización.
- Campos públicos, privados y sujetos a autorización por tipo de proceso.
- Fuente, retención y responsables de datos históricos.
- Criterios verificables y responsables para aprobar reclamaciones.
- Política de tratamiento de datos y flujos de consentimiento en producción.

## Principios y restricciones de arquitectura

### Decisiones que condicionan el diseño

1. **SIMUS es el Sistema de Información de la Música**, nacional y sectorial. PNMC lo orienta, pero no limita su universo de información.
2. Las capacidades de información, registro, consulta pública, herramientas, administración, gobierno, servicios y analítica **no implican por sí mismas aplicaciones técnicas separadas**.
3. Persona, cuenta, perfil de agente, organización, relación persona–organización y autorización son conceptos distintos. La organización no inicia sesión.
4. El acceso externo y la administración institucional son dominios operativos separados: sesiones, autenticación, autorización, navegación y auditoría independientes; no hay escalamiento desde una sesión externa.
5. El registro sectorial publicado requiere gobierno: propuesta pendiente, revisión y conservación de la versión pública aprobada. Procedencia, lotes de importación, reclamaciones, duplicados y alertas de calidad son objetos diferenciados.
6. Analítica es capacidad prioritaria y transversal. El mapa es una representación territorial dentro de ella, no su sustituto.

### Restricciones no negociables

| Restricción | Consecuencia arquitectónica |
|---|---|
| Evolucionar lo útil, no reescribir desde cero | Mantener Angular, API .NET, SQL Server y módulos aprovechables mientras se introducen fronteras explícitas. |
| Separación externo/institucional | Dos ámbitos de seguridad verificables también en API; la separación visual sola no basta. |
| Publicación gobernada | Las consultas públicas leen una proyección aprobada; una edición no sustituye la publicación vigente automáticamente. |
| Catálogos estructurados reales | `PracticasMusicales` y `TerritoriosSonoros` se preservan como maestros; no se sustituyen por texto libre. |
| Privacidad | Directorios de agentes y organizaciones no son públicos en el primer alcance. Exportaciones requieren política y trazabilidad. |
| Proporcionalidad | No adoptar microservicios, bases separadas o almacén analítico si no resuelven una necesidad comprobada. |

### Criterios de evaluación

Se comparan alternativas por seguridad efectiva, reutilización, entregabilidad, integridad relacional, analítica, mantenibilidad, operación, migración reversible y capacidad de pruebas. Las alternativas son **PROPUESTAS**, no decisiones.

## Estado técnico de partida

### Arquitectura comprobada

| Elemento | Estado | Evidencia |
|---|---|---|
| Frontend | **VERIFICADO**: una aplicación Angular 21 | `pnmc-web`, rutas con carga diferida en `app.routes.ts`. |
| Backend | **VERIFICADO**: una API .NET Minimal API | `Program.cs`, grupo `/api/v1`, endpoints por archivo. |
| Persistencia | **VERIFICADO**: un `PnmcDbContext` y SQL Server fuera de pruebas | `DependencyInjection.cs`; SQLite se usa solo en entorno `Test`. |
| Dominios existentes | **PARCIAL** | Endpoints de mapa, catálogos, contenidos, externo, aliados, gobernanza y administración comparten proceso/API/DbContext. |
| Frontend público | **VERIFICADO** | PNMC, SIMUS, mapa, escuelas, agenda, noticias, editorial y galería. |
| Administración | **VERIFICADO** | Ruta `/admin`; `/colaboradores` carga el mismo shell. |
| Externo | **PARCIAL** | Registro/verificación API y paneles con partes mock; no existe ruta externa autenticada integral comprobada. |

### Identidad y seguridad actual

`Program.cs` configura un único esquema de cookie llamado `pnmc.admin`, `HttpOnly`, `SameSite=Lax`, con ocho horas de expiración deslizante. Hay autorización y limitadores específicos para registro externo y participación. Los endpoints sensibles usan `RequireAuthorization()` en varios grupos.

Esto **no materializa aún** dos ámbitos de autenticación: el flujo externo de registro/verificación no prueba una sesión externa independiente. En Angular las rutas `/admin` y `/colaboradores` no tienen `canActivate`; el `authGuard` existente permite continuar cuando no hay sesión. La API debe seguir siendo la autoridad efectiva. **VERIFICADO**: `pnmc-web/src/app/core/guards/auth.guard.ts`.

### Datos y gobierno actuales

`PnmcDbContext` concentra maestros, registros sectoriales (`FestivalRow`, `SchoolRow`, `MarketRow`, `OrganizationRow`, `SpaceInfrastructureRow`), contenidos, usuarios/roles, entidades, solicitudes, duplicados, alertas y auditoría. Existen estados y revisión, pero no está comprobada una proyección separada de versión pública y propuesta pendiente. Véanse diagnósticos [20](../diagnostico/20-modelo-de-datos.md), [31](../diagnostico/31-gobierno-del-dato-actual.md) y [35](../diagnostico/35-importacion-y-trazabilidad-actual.md).

### Capacidades aprovechables y cambios estructurales probables

| Se puede conservar inicialmente | Requiere evolución estructural |
|---|---|
| Angular por features, navegación pública, mapa Leaflet, API .NET, SQL Server, catálogos, endpoints de contenidos, auditoría y revisión existentes | Dos ámbitos de identidad, relación persona–organización con alcance, modelo proceso/edición/caracterización, versión aprobada/propuesta, procedencia y lote, aplicación real de vínculos/duplicados, lectura analítica y reglas de visibilidad. |

### Riesgos técnicos verificados o heredados

- La única cookie y la falta de fronteras de sesión externas/institucionales no satisfacen la decisión de separación estricta.
- Un mismo `DbContext` y API concentran cambios de dominios distintos; es manejable mientras se modularice internamente.
- El diagnóstico previo registra una vulnerabilidad de `SQLitePCLRaw`; su alcance, versión instalada y corrección deben validarse con inventario de dependencias antes de desplegar cambios. **TBC** en esta fase.
- El bootstrap y algunas estructuras se apoyan en lógica de inicialización; una migración futura debe confirmar el mecanismo de migraciones y restauración antes de tocar datos. **TBC**.

## Alternativas de arquitectura técnica

Todas las alternativas preservan: .NET, SQL Server, Angular existente, catálogos maestros, mapa y contenidos. La diferencia es el nivel de frontera entre experiencias. Ninguna es una decisión aprobada.

### Alternativa A — Aplicación única, monolito modular reforzado

#### Resumen y diagrama conceptual

```text
Angular único: público | externo | institucional (rutas y módulos aislados)
                         ↓
API .NET única: módulos internos y políticas por ámbito
                         ↓
SQL Server único: esquemas lógicos / tablas por dominio
```

#### Frontend, backend y datos

Se conserva un solo Angular, organizado en shells y áreas lazy-loaded: público, externo e institucional. La API sigue única, pero se ordena por módulos internos: identidad externa, identidad institucional, organizaciones/procesos, gobierno, contenido, catálogo, analítica e importación. Se mantiene una base con esquemas o convenciones lógicas y restricciones relacionales.

#### Autenticación, autorización y seguridad

Dos esquemas de autenticación y cookies con nombres, rutas y validación de ámbitos diferenciados, aun bajo un mismo host; políticas API exigen el esquema correspondiente. La autorización usa relación persona–recurso y alcance, no solo rol global. CSRF, rate limiting, auditoría, recuperación y MFA institucional se implementan en API. El frontend no es la barrera de seguridad.

#### Analítica, CMS, mapa e importaciones

Vistas SQL y tablas agregadas programadas para indicadores; lectura pública solo de datos aprobados. CMS y mapa permanecen features del mismo Angular/API. Importaciones se introducen como módulo con lote y registro de resultados. IA, si llega, opera como servicio asistivo que produce sugerencias revisables.

#### Impacto, migración y operación

Impacto inicial bajo: incorporar fronteras y nuevas rutas sin mover aplicaciones. Migración por cortes verticales y compatibilidad temporal de endpoints. Un despliegue único simplifica observabilidad, respaldos y operación; impide desplegar la administración de forma independiente mientras siga siendo una sola aplicación.

#### Ventajas

- Máxima reutilización y velocidad inicial.
- Integridad relacional simple para relaciones y gobierno del dato.
- Menor costo operativo y pruebas end-to-end directas.

#### Desventajas, riesgos y deuda técnica

- La separación de experiencias depende de disciplina de módulos, políticas y revisión de seguridad.
- Un despliegue común aumenta coordinación entre áreas.
- Riesgo de conservar acoplamientos si la modularización se queda solo en carpetas.

**Complejidad: MEDIA.** Deuda esperada: media si no se formalizan fronteras de API, esquemas, ownership y pruebas de autorización.

### Alternativa B — Dos frontends, API y base compartidas

#### Resumen y diagrama conceptual

```text
Angular público + externo        Angular institucional
              \                    /
               API .NET modular única
                         ↓
             SQL Server único con límites lógicos
```

#### Frontend, backend y datos

El frontend actual evoluciona para público y externo; un segundo Angular institucional aloja administración y CMS. Se conservan API, DbContext y base iniciales, con módulos y contratos diferenciados. Puede haber subdominios y despliegues independientes para las dos experiencias.

#### Autenticación, autorización y seguridad

La separación de frontends facilita cookies con dominio/ruta y navegación aislados. No es seguridad suficiente por sí misma: API mantiene dos esquemas, políticas por ámbito, validación de audiencia/claims, CSRF y auditoría. Una sesión externa nunca acepta endpoints institucionales, incluso si comparten host de API.

#### Analítica, CMS, mapa e importaciones

Mapa y analítica pública permanecen en público/externo; administración analítica, CMS e importaciones en institucional. Todos consumen APIs de lectura/escritura diferenciadas. La estrategia de vistas/agrupados sigue siendo común.

#### Impacto, migración y operación

Se extrae primero el shell administrativo y sus dependencias de UI, dejando contratos API estables. Dos pipelines y dos artefactos aumentan operación, pero habilitan despliegue y ciclo institucional independiente. Datos permanecen íntegros en una base común.

#### Ventajas

- Materializa la frontera operativa y de experiencia no negociable.
- Permite desplegar/recuperar administración sin afectar el sitio público.
- Conserva la mayor parte de backend y datos.

#### Desventajas, riesgos y deuda técnica

- Duplica configuración, librerías compartidas y pruebas de compatibilidad.
- Requiere decidir propiedad de componentes y contratos antes de extraer.
- Una API no modularizada haría que la separación fuese cosmética.

**Complejidad: MEDIA-ALTA.** Deuda esperada: controlada si se mantiene biblioteca compartida mínima y contratos versionados.

### Alternativa C — Tres frontends y API modular única

#### Resumen y diagrama conceptual

```text
Público       Externo autenticado       Institucional
   \                 |                  /
                API .NET modular
                       ↓
            SQL Server único / esquemas lógicos
```

#### Frontend, backend y datos

El sitio público, el entorno externo y la administración se convierten en tres Angular. API y SQL Server siguen compartidos. El mapa puede estar en público como feature; no se crea aplicación propia. Analítica mantiene endpoints/modelos de lectura por audiencia.

#### Autenticación, autorización y seguridad

La distinción externa/institucional es clara; el frontend público no necesita sesión. Persisten políticas API y dos emisores/esquemas de sesión. El ámbito externo soporta cambio de contexto entre persona y organización, registrado en auditoría; no representa privilegio administrativo.

#### Analítica, CMS, mapa e importaciones

CMS/operación quedan institucionales. Mapa y consulta pública se mantienen públicos. Directorios ampliados son externos. Importación, IA asistiva y calidad pertenecen al ámbito institucional aunque produzcan información consultable después de aprobación.

#### Impacto, migración y operación

Requiere extraer también la experiencia externa que hoy es parcial/mock. La migración debe esperar a que exista un primer vertical externo real; extraer antes aumentaría pantallas sin capacidad. Tres despliegues multiplican configuraciones, observabilidad y regresión.

#### Ventajas

- Máxima claridad de producto y navegación por audiencia.
- Ciclos y rendimiento independientes por experiencia.
- Reduce la posibilidad de mezclar UI y dependencias del dominio institucional con externo.

#### Desventajas, riesgos y deuda técnica

- Coste alto antes de que el entorno externo esté maduro.
- Duplicación de diseño, accesibilidad, configuración y pruebas.
- No resuelve por sí misma identidad, permisos ni publicación.

**Complejidad: ALTA.** Deuda esperada: alta si se extrae por adelantado; razonable solo tras estabilizar contratos y un flujo externo completo.

### Alternativa D — APIs y bases separadas por ámbitos

#### Resumen y diagrama conceptual

```text
Público / Externo / Institucional
      ↓           ↓          ↓
 API pública   API externa  API institucional
      \           |          /
         replicación / integración de datos
```

#### Frontend, backend y datos

Divide APIs y, posiblemente, bases por ámbitos. Requeriría sincronizar identidad, catálogos, relaciones, publicación y analítica. Es una arquitectura distribuida, no una extensión directa del estado actual.

#### Autenticación, autorización y seguridad

Puede aislar credenciales y redes, pero añade gestión de confianza entre servicios, consistencia y auditoría distribuida. El aislamiento físico no elimina la necesidad de políticas de autorización correctas.

#### Analítica, CMS, mapa e importaciones

Un almacén de lectura separado puede favorecer consultas públicas, pero importación, publicación y catálogos exigirían eventos, réplicas y conciliación. CMS y mapa sufrirían contratos remotos adicionales.

#### Impacto, migración y operación

Exige límites de dominio, contratos, sincronización, monitoreo, respaldos y despliegues que hoy no están comprobados. Migrar por estrangulamiento sería posible, pero no se justifica como primer paso.

#### Ventajas

- Aislamiento técnico y escalado independiente potenciales.
- Posible reducción futura de superficie expuesta por API.

#### Desventajas, riesgos y deuda técnica

- Muy alto costo operativo y de migración.
- Riesgo de inconsistencias entre publicación, permisos, procedencia y analítica.
- Desproporcionada para volumen inicial moderado y equipo en consolidación.

**Complejidad: MUY ALTA.** Deuda esperada: operativa alta y difícil de revertir.

## Matriz comparativa de arquitecturas

Escala cualitativa: **alta** favorece el criterio, salvo complejidad, costo, riesgo y deuda, donde alta indica mayor carga.

| Criterio | A: una app modular | B: dos frontends | C: tres frontends | D: APIs/bases separadas |
|---|---|---|---|---|
| Adecuación al producto | Media | Alta | Alta | Media |
| Reutilización del desarrollo | Alta | Alta | Media | Baja |
| Seguridad | Media-alta, depende de políticas | Alta, si API mantiene políticas | Alta, si API mantiene políticas | Alta potencial, compleja |
| Separación externo/institucional | Lógica | Clara y desplegable | Muy clara | Física potencial |
| Complejidad | Media | Media-alta | Alta | Muy alta |
| Velocidad de implementación | Alta | Media | Baja | Muy baja |
| Escalabilidad | Media-alta | Alta | Alta | Alta potencial |
| Mantenibilidad | Media-alta | Alta | Media | Baja-media inicialmente |
| Analítica | Alta con lecturas separadas | Alta | Alta | Alta, alto costo |
| Gobierno del dato | Alta por integridad común | Alta | Alta | Riesgo de consistencia |
| Facilidad de pruebas | Alta | Media-alta | Media | Baja |
| Despliegue | Simple | Independiente por dos ámbitos | Tres artefactos | Distribuido complejo |
| Costo operativo | Bajo | Medio | Medio-alto | Alto |
| Riesgo de migración | Bajo-medio | Medio | Alto | Muy alto |
| Deuda técnica | Media | Media controlable | Media-alta | Alta operativa |

### Lectura de la comparación

- **A** favorece rapidez y conservación, pero no ofrece aislamiento desplegable entre institucional y externo.
- **B** equilibra la separación no negociable con una evolución incremental: separa las dos experiencias que requieren sesión y administración diferentes, sin fragmentar datos ni API antes de tiempo.
- **C** sería pertinente cuando el entorno externo tenga volumen, autonomía o cadencia que justifiquen su propio producto técnico; hoy es prematuro.
- **D** solo tendría sentido con una necesidad demostrada de aislamiento regulatorio, operación independiente o escala no presente en la evidencia.

## Identidad, autenticación y seguridad

### Punto de partida verificable

Hay una cookie `pnmc.admin`, un esquema de autenticación y autorización .NET, endpoints administrativos protegidos y registro/verificación externos. No hay evidencia de una sesión externa independiente persistente ni de guardas Angular efectivas en rutas administrativas. **VERIFICADO/PARCIAL**.

### Alternativas de separación

| Alternativa | Cómo separa | Límite |
|---|---|---|
| Un frontend, dos ámbitos | shells/rutas y dos esquemas/cookies de API | mismo despliegue y mayor riesgo de mezcla de UI. |
| Dos frontends, API común | hosts/pipelines separados; dos esquemas/cookies/políticas en API | exige coordinar contratos y CORS. |
| APIs separadas | credenciales y superficie por API | costo y consistencia muy superiores. |

Separar frontends aporta aislamiento de experiencia, despliegue y superficie accidental; **no sustituye** autorización en backend. La recomendación preliminar es dos frontends cuando el vertical externo esté listo, API modular común y dos ámbitos de seguridad desde el primer corte.

### Diseño proporcionado propuesto

```text
Persona externa → cuenta externa → cookie/esquema externo → políticas externas
Funcionario/a   → cuenta institucional → cookie/esquema institucional → políticas institucionales
```

- Cookies distintas, `HttpOnly`, `Secure` en producción, `SameSite` definido según flujos reales; host y path restringidos cuando el despliegue lo permita.
- No compartir sesión, refresh ni selector de contexto entre ámbitos. La misma persona física puede tener dos identidades operativas auditables.
- La cuenta externa permite contexto personal u organización autorizada; cambiar contexto no otorga permisos, solo selecciona el recurso sobre el cual se reevalúa la política.
- Institucional: correo institucional verificable, MFA según evaluación de riesgo y futuro SSO mediante adaptador, no como dependencia del piloto.
- Externo: correo como credencial inicial; teléfono/documento solo tras evaluación jurídica, de privacidad y de verificación. Soy Cultura queda como integración futura mediante identificador externo no obligatorio.

### Controles transversales

| Riesgo | Control a exigir en API/operación |
|---|---|
| Escalamiento externo → institucional | Esquemas y políticas excluyentes; endpoints institucionales no aceptan principal externo. |
| CSRF con cookies | Antiforgery para mutaciones si el modelo final usa cookies entre origen/es; validar origen y no depender de CORS como control de autorización. |
| Fuerza bruta/recuperación | Rate limiting para login, registro, verificación y recuperación; códigos con vencimiento, uso único y auditoría. |
| Datos personales/exportaciones | Minimización, visibilidad por política, autorización por recurso, registro de exportación y límite de volumen. |
| Administración masiva | MFA institucional, confirmación reforzada, auditoría inmutable lógica y revisión de privilegios. |

La vulnerabilidad `SQLitePCLRaw` señalada en el diagnóstico debe entrar en inventario de dependencias y actualización controlada; no se infiere aquí la versión o explotabilidad. **TBC**.

## Autorización y alcances

### Problema a resolver

El rol global responde a “qué tipo de usuario es”, pero no a “sobre cuál organización o proceso puede actuar”. SIMUS requiere separar persona, organización, recurso, rol de relación, alcance, vigencia y decisión auditada.

```text
Persona ── Autorización ──> Organización
             └ alcance: toda organización | proceso específico | recurso futuro
Organización ── relación institucional ──> Proceso
```

La relación institucional (organizadora, aliada, cofinanciadora, patrocinadora) no concede permiso digital automáticamente.

### Alternativas

| Enfoque | Evaluación |
|---|---|
| RBAC global | Insuficiente: no expresa alcance ni varias organizaciones. |
| ABAC puro | Flexible, pero excesivo y difícil de auditar para el piloto. |
| Roles + scopes + relaciones | **PROPUESTA**: suficiente y explicable; políticas comprueban rol, vínculo, alcance y estado. |
| Motor externo de permisos | TBC; añade dependencia sin necesidad demostrada. |

### Modelo lógico propuesto

- `Persona` es el sujeto autenticado; `CuentaExterna` es su acceso.
- `Organizacion` tiene identidad propia; su creador obtiene una autorización inicial persistida.
- `AutorizacionOrganizacion` contiene persona, organización, rol (administrar, editar, consultar), vigencia y estado.
- `AutorizacionRecurso` limita o amplía a proceso/escuela/espacio específico; no reemplaza la autorización de organización cuando esta es necesaria.
- Las políticas API evalúan el recurso solicitado en servidor; el id de contexto enviado por cliente nunca basta.
- Alta, revocación, invitación, aceptación y cada decisión se registran en auditoría y generan notificación.

### Implicaciones de prueba

Pruebas de integración deben cubrir: usuario sin vínculo, editor de un proceso intentando editar otro, aliado sin autorización, revocación efectiva, cambio de contexto, sesión externa contra endpoint institucional y trazabilidad de acción. La UI solo oculta opciones conforme al resultado de API.

## Datos, versionado y gobierno

### Familias de cambio necesarias

No se definen tablas ni SQL definitivo. Probablemente se necesitan familias para: cuenta distinta de perfil de agente; persona, organización y sus relaciones; proceso y tipo de relación institucional; ediciones, eventos y caracterizaciones; autorización con alcance; visibilidad; propuesta de cambio/publicación; procedencia; lote de importación; solicitud de vinculación; duplicado/fusión; alerta de calidad y auditoría.

### Alternativas para versión publicada + propuesta pendiente + historial

| Alternativa | Ventajas | Riesgos |
|---|---|---|
| Snapshots completos versionados | Lectura/reversión simples; auditoría clara; adecuada para registros moderados | Más almacenamiento y copia de relaciones complejas. |
| Deltas de campo/eventos | Historial preciso y menor duplicación | Reconstrucción, migración y depuración más complejas. |
| Tablas de revisión paralelas | Introducción gradual sobre tablas existentes | Riesgo de divergencia y lógica duplicada por entidad. |
| Híbrida | Snapshot aprobado + propuesta estructurada/delta + historial | Requiere reglas explícitas de promoción. |

**PROPUESTA preliminar:** híbrida: conservar una lectura pública aprobada, almacenar una propuesta pendiente asociada al registro y capturar historial/auditoría. Para el piloto, snapshots por recurso o propuesta estructurada simplifican revisión y reversión frente a event sourcing completo.

### Ciclos diferenciados

```text
Registro: BORRADOR → EN REVISIÓN → AJUSTES SOLICITADOS → PUBLICADO / RECHAZADO / ARCHIVADO
Calidad: ABIERTA → RESUELTA / DESCARTADA
Duplicado: PENDIENTE → RESUELTO; decisión: fusionar / mantener / no es duplicado
```

Una fusión no es automática: preserva identificadores, fuentes, relaciones e historial. Aprobar una solicitud de vinculación crea el vínculo autorizado sin alterar la procedencia histórica. Una alerta de calidad es objeto aparte y su bloqueo de publicación solo ocurre si la política lo establece.

### Procedencia e importación

Cada registro debe identificar origen (autorregistro, administrativo, importación, integración). Todo lote conserva archivo/referencia, fuente, responsable, fecha, validaciones, creados, conflictos, advertencias y una reversión gobernada; la reversión no equivale a borrado masivo. Los importados empiezan en borrador.

## Arquitectura analítica

### Principio

Mapa ≠ analítica. El mapa es una lectura territorial y cartográfica que consume indicadores, filtros y registros aprobados. La analítica debe servir audiencias pública, externa e institucional sin exponer datos privados ni degradar la operación transaccional.

### Alternativas

| Alternativa | Cuándo aplica | Ventajas | Riesgos |
|---|---|---|---|
| Consultas directas transaccionales | Inicio o consultas poco costosas | Menor cambio | Afecta rendimiento y mezcla reglas de lectura. |
| Vistas SQL | Indicadores reutilizables | Contratos de lectura claros | Puede ser costosa con alto volumen. |
| Vistas materializadas/tablas agregadas | Filtros nacionales, series y mapa frecuentes | Rendimiento predecible | Requiere refresco, monitoreo y semántica de fecha. |
| Modelo de lectura / almacén separado | Volumen, latencia o cruces justificadamente altos | Aísla carga analítica | Sincronización, costo y consistencia eventual. |

**PROPUESTA preliminar:** API y base únicas; modelos de lectura primero mediante vistas y tablas agregadas refrescables. Separar almacén analítico solo cuando métricas de volumen, latencia o carga lo justifiquen. Es reversible y evita sobrearquitectura.

### Capas de lectura

```text
Datos transaccionales gobernados
        ↓ publicación / visibilidad / agregación
Modelos de lectura analítica
   ├─ pública: agregados aprobados, sin directorios restringidos
   ├─ externa: directorios y detalle permitido por política
   └─ institucional: cobertura, calidad, operación e histórico
```

Las definiciones de indicador, fecha de corte, filtros, denominadores y exportación permitida deben ser contratos versionados. Un resultado público no se obtiene de registros borrador, propuestas pendientes o atributos privados.

### Mapa y exportaciones

Se conserva Leaflet y el mapa actual como feature pública modular. Puede consumir endpoints de lectura específicos, no tablas directamente. Las capas siguen vinculadas a `DIVIPOLA`, `TerritoriosSonoros`, `PracticasMusicales` y estados publicados. Exportar exige autorización por audiencia, límite de campos/volumen, auditoría y protección contra reidentificación; política detallada **TBC**.

### Series y operación

Los cortes históricos deben registrar fecha, método de actualización y versión de catálogo. Los procesos de agregación necesitan ejecución idempotente, métricas de duración/error, reintento, respaldo y prueba de reconciliación con fuente transaccional. No se diseña infraestructura cloud en ausencia de evidencia.

## CMS, mapa y herramientas especializadas

### Estado y separación de responsabilidades

Los contenidos de PNMC/SIMUS (páginas, textos, noticias, agenda, editorial, galerías, archivos) coexisten con la administración de registros sectoriales. Esas responsabilidades pueden compartir infraestructura, pero su ciclo editorial no equivale al gobierno del dato sectorial. **VERIFICADO/PARCIAL**.

El mapa ya es una herramienta especializada relevante y depende de catálogos/territorio. Se recomienda conservarlo dentro del frontend público como feature modular, con API de lectura analítica; no hay evidencia que justifique una aplicación de mapa separada.

### Alternativas CMS

| Alternativa | Evaluación |
|---|---|
| CMS interno unificado | **PROPUESTA**: un módulo institucional común para tipos de contenido, archivos, estados editoriales y permisos, preservando entidades actuales. |
| Capacidades separadas, infraestructura común | Conserva endpoints/entidades por tipo; menor migración, mayor duplicación de reglas. |
| CMS SaaS externo | No recomendado sin necesidad contractual, operación editorial o costo demostrado; añade integración, privacidad y dependencia. |

La opción interna unificada debe ser gradual: no impone una tabla única de contenido. Primero formaliza contratos editoriales, estados, archivos y permisos; después decide convergencias por evidencia.

### Herramientas especializadas

Festivales, mercados, escuelas, talleres/espacios y mapa son capacidades de dominio sobre servicios compartidos. Una herramienta se vuelve aplicación independiente solo si requiere ciclo de despliegue, seguridad, audiencia, rendimiento u operación distintos de forma comprobable. Hoy el mapa puede evolucionar modularmente; las categorías “próximamente” no demuestran un portal especializado real.

## Importaciones, integraciones e IA asistiva

### Importación como capacidad gobernada

La importación no debe ser escritura directa de registros finales. Un módulo gradual debe administrar:

```text
Lote → archivo/referencia + fuente + responsable
     → perfil/mapeo + validación + normalización asistida
     → filas candidatas + conflictos/duplicados/advertencias
     → borradores + revisión + publicación
     → reversión gobernada y auditoría
```

El lote es la unidad de trazabilidad y reversión. Los catálogos reales se usan para mapeo validado; un valor libre no se convierte automáticamente en maestro.

### Alternativas de ejecución

| Alternativa | Evaluación |
|---|---|
| Proceso síncrono en endpoint | Aceptable para archivo pequeño; no apto para control, reintentos o trazabilidad amplia. |
| Trabajo en segundo plano dentro de API/base | **PROPUESTA inicial**: cola/lotes persistidos e idempotencia; conserva operación simple. |
| Servicio separado de importación | Solo cuando volumen, formatos o aislamiento lo justifiquen; añade operación y contratos. |

Los trabajos requieren estados claros, registro de errores sin datos sensibles innecesarios, reintentos seguros, métricas, límites de archivo, escaneo y permisos institucionales.

### Integraciones

Soy Cultura, SSO e integraciones futuras se tratan como **TBC**: no se asumen disponibles. Se recomienda un adaptador por proveedor, identificadores externos no exclusivos, mapeo versionado, procedimiento de reconciliación y procedencia. Ninguna integración obtiene privilegios internos por defecto.

### IA asistiva

La IA puede sugerir clasificación, normalización, coincidencias, mapeos o anomalías. Nunca publica, fusiona, aprueba ni asigna permisos. Técnicamente entrega una sugerencia con confianza, versión de modelo/regla, insumos mínimos, explicación disponible y decisión humana. Se conecta como adaptador o trabajo asíncrono, no como dependencia central de escritura. Cualquier uso de datos personales exige evaluación de privacidad, retención y proveedor antes de adopción. **TBC**.

### Notificaciones

Notificaciones internas son el registro de estado de usuario; correo es un canal adicional. Eventos como invitación, ajuste, aprobación, reclamación, permiso, importación y calidad producen notificación trazable, con preferencia de canal y reintentos. No se recomienda introducir un bus distribuido hasta que exista volumen o integración que lo requiera.

## Estrategia de migración

### Principios de transición

- No sustituir de golpe Angular, API, SQL Server, mapa, contenidos ni catálogos.
- Entregar cortes verticales con migración reversible, pruebas y observabilidad.
- Convivir temporalmente con rutas/endpoints actuales cuando exista consumidor real; retirar solo tras inventario y validación.
- Migrar datos mediante copia controlada, conciliación, respaldo y plan de restauración; nunca por reconstrucción manual sin procedencia.

### Secuencia propuesta

| Etapa | Objetivo | Conserva | Cambio introducido |
|---|---|---|---|
| 0. Línea base | Inventario, pruebas y respaldo | Repositorio, API, base, rutas actuales | Contratos, dependencias, datos y operación documentados; corregir hallazgos de seguridad aprobados aparte. |
| 1. Fronteras internas | Preparar evolución sin extracción | Angular/API/DB únicos | Módulos de dominio, políticas y contratos de lectura/escritura; sin cambiar comportamiento público. |
| 2. Vertical externo | Validar identidad y organización | Registro externo, entidades, auditoría existentes | Cuenta externa, organización, autorización inicial, proceso y propuesta revisable. |
| 3. Gobierno/publicación | Asegurar dato visible | Catálogos y consulta actual | Propuesta pendiente, revisión, publicación y versión pública anterior. |
| 4. Extracción institucional | Si se aprueba alternativa B | API/base compartidas | Segundo frontend institucional con sesiones y despliegue aislados. |
| 5. Analítica e importación | Escalar lecturas y carga | Mapa y SQL Server | Modelos de lectura, lotes, procedencia, notificaciones y métricas. |

### Migración de datos

Antes de cada familia: perfilado, regla de mapeo, respaldo verificable, migración de prueba, conteos/contenido conciliado, manejo de huérfanos y plan de reversión. Mantener identificadores fuente y relaciones. Los catálogos `PracticasMusicales` y `TerritoriosSonoros` se tratan como maestros existentes y se validan contra su inventario, no se regeneran.

### Operación y observabilidad

Cada corte debe incluir logs estructurados con correlación, auditoría de mutaciones, métricas de endpoint/trabajo, health checks existentes, alarmas de error, respaldo/restauración probado y migraciones repetibles. La plataforma de monitoreo y el destino de logs son **TBC**; no se prescribe infraestructura cloud.

### Repositorio

Conservar inicialmente el repositorio con `pnmc-web`, `pnmc-api` y `pnmc-database`. Si se adopta B, agregar el frontend institucional como proyecto del mismo repositorio, con librería compartida mínima o contratos explícitos. Separar repositorios solo ante equipos, permisos, cadencias o despliegues que lo requieran y después de estabilizar contratos.

## Primer corte vertical propuesto

### Alcance mínimo recomendado

**PROPUESTA — PENDIENTE DE APROBACIÓN.** Validar un flujo de organización y festival:

```text
Persona externa crea/verifica cuenta
→ registra Organización
→ obtiene autorización inicial sobre la organización
→ crea Festival en BORRADOR
→ solicita revisión
→ persona institucional independiente revisa
→ publica una versión aprobada
→ la consulta pública solo muestra esa versión
```

El corte debe incluir auditoría de acciones y una notificación de estado. No incluye todavía directorio de agentes/organizaciones, reclamación histórica, fusión de duplicados, importación completa, IA, SSO, analítica histórica ni extracción obligatoria de frontend.

### Decisiones que valida

| Decisión crítica | Evidencia de validación |
|---|---|
| Dos ámbitos de identidad | Sesiones/cookies y políticas excluyentes; una cuenta externa no consume administración. |
| Persona ≠ organización | Organización sin login propio y autorización inicial atribuida a persona. |
| Autorización por alcance | Solo administradores autorizados actúan sobre la organización/proceso. |
| Gobierno/publicación | Borrador/propuesta no reemplaza versión pública hasta aprobación. |
| Auditoría | Cada alta, cambio de contexto, revisión y publicación es atribuible. |
| Reutilización | Se usa .NET, SQL Server, catálogos y estructura Angular existentes, evolucionados. |

### Criterios de salida

- Pruebas de integración de autorización y publicación pasan.
- La consulta pública no expone borradores ni atributos privados.
- Se prueba recuperación de una propuesta fallida y se conserva la publicación anterior.
- Logs, auditoría, health checks y respaldo/restauración del cambio se verifican en entorno acordado.
- Se documentan contratos y decisiones descubiertas antes de ampliar entidades.

### Riesgo delimitado

El flujo no prueba aún ediciones recurrentes, caracterizaciones, reclamaciones o importación, pero evita crear una arquitectura genérica sin validar la separación más sensible: externo/institucional y dato publicado/propuesto.

## Recomendación técnica

> **PROPUESTA TÉCNICA — PENDIENTE DE APROBACIÓN.**

### Recomendación

Adoptar la **Alternativa B** de manera incremental: dos frontends (público+externo e institucional), una API .NET modular y una base SQL Server única con límites lógicos y modelos de lectura analítica. Mientras el vertical externo se consolida, la separación puede empezar dentro del Angular actual; la extracción institucional se realiza solo con contratos y pruebas estables.

Responde a la separación no negociable externo/institucional mediante experiencias y despliegues distintos, sin sacrificar la integridad relacional necesaria para organizaciones, procesos, publicación, procedencia y auditoría. API y base no se separan prematuramente.

### Qué se conserva y qué cambia

| Conservación | Evolución estructural |
|---|---|
| Angular, API .NET, SQL Server, mapa, catálogos, contenidos, endpoints y datos aprovechables | Dos esquemas de identidad, políticas de ámbito, modelo de autorización, publicación versionada, procedencia/lotes y lecturas analíticas. |

### Sacrificios aceptados

- Dos frontends añaden pipeline, configuración y pruebas de compatibilidad.
- API y base comunes no aíslan físicamente administración; exigen una disciplina fuerte de políticas, contratos y auditoría.
- La entrega es menos rápida que mantener todo en una app, pero evita mezclar permanentemente el dominio institucional con el externo.

### Hipótesis que deben validarse

1. Que la capacidad y operación del equipo sostienen dos artefactos Angular.
2. Que los requisitos institucionales permiten una API/base compartidas con políticas y auditoría reforzadas.
3. Que el volumen analítico inicial se resuelve con vistas/agrupados, no con almacén separado.
4. Que el modelo de organización, autorización y festival cubre el primer piloto antes de generalizarlo.
5. Versiones reales, impacto y remediación de `SQLitePCLRaw`; mecanismo efectivo de migraciones, backup y restauración. **TBC**.

### Reversibilidad

Reversibles: ordenar módulos, crear modelos de lectura, introducir contratos, mantener un repositorio y extraer frontend institucional tras estabilización. Costosas: dividir bases, publicar APIs distribuidas, cambiar identificadores maestros o migrar históricamente datos sin procedencia. Por ello no se recomiendan como primer movimiento.

### Qué no debe implementarse todavía

- Microservicios, bases separadas o almacén analítico sin métricas que los justifiquen.
- Integración obligatoria con Soy Cultura, SSO o proveedor de IA.
- Directorios públicos de agentes u organizaciones.
- Fusión automática de duplicados o publicación/decisión automática por IA.
- Renombrado masivo de tablas/clases ni refactor general previo al vertical.

### Primer paso condicionado

Si se aprueba, el primer trabajo técnico sería el corte descrito en [12](12-primer-corte-vertical-propuesto.md), precedido por inventario de contratos, dependencias, datos y plan de prueba/restauración. Esta documentación no autoriza su implementación.

## Resumen no técnico de arquitectura

> **PROPUESTA TÉCNICA — PENDIENTE DE APROBACIÓN.**

SIMUS ya cuenta con un sitio Angular, una API .NET y una base de datos SQL Server. Allí viven el portal PNMC, el mapa, contenidos, catálogos y una administración. También hay elementos para registro externo y gobierno del dato, pero todavía no conforman un entorno externo completo ni separado de la administración institucional.

Se compararon cuatro caminos: mantener una sola aplicación ordenada internamente; separar la administración institucional en un segundo frontend; tener tres aplicaciones para público, externo e institucional; o dividir también APIs y bases. El primer camino es el más rápido, pero deja una frontera operativa menos clara. Los dos últimos requieren una complejidad que hoy no está justificada.

La alternativa que parece más equilibrada es conservar la API y la base de datos por ahora, ordenar sus responsabilidades y llegar progresivamente a dos frontends: uno público y externo, y otro exclusivo para funcionarios y administración SIMUS. Esto ayuda a que una sesión externa no pueda convertirse en una sesión institucional, sin obligar a reconstruir todo el sistema.

El mayor trabajo estructural no es visual: es distinguir persona, cuenta, agente, organización y permisos; mantener una publicación aprobada mientras se revisan cambios; registrar procedencia e importaciones; y producir información analítica sin exponer datos privados. El mapa se conserva como herramienta pública y los contenidos se consolidan gradualmente dentro de la administración institucional.

El primer piloto recomendado no intenta resolver todo. Probaría que una persona externa cree una organización y un festival, que una persona institucional independiente lo revise y que solo la versión aprobada aparezca públicamente. Esa prueba aclara si funcionan las decisiones de seguridad, permisos, auditoría y publicación antes de ampliar el sistema.

Riesgos a gestionar: dos frontends requieren más coordinación; una API común necesita controles de seguridad reales; deben confirmarse dependencias, respaldo/restauración y el comportamiento de datos existentes. No se recomienda aún dividir bases, introducir microservicios, hacer directorios públicos ni automatizar decisiones con IA.
