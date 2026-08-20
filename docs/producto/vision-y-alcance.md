# Visión y alcance

Referencia conceptual de SIMUS: qué es el sistema, qué información gobierna, para quién y
con qué límites. Es el documento del que dependen la arquitectura, la hoja de ruta y las
decisiones de producto; cuando algo se contradiga, este documento manda.

Estado: aprobado. Última revisión de contenido: agosto de 2026.

## Actualización y conceptualización del Sistema de Información de la Música — SIMUS

### Marco conceptual, modelo de información, gobierno del dato, experiencias y arquitectura

Versión: v02 · Estado: APR · Fecha: 2026-08-18  
Deriva de: diagnósticos 10–50, arquitectura 01–14 y decisiones institucionales aprobadas.  
Fuentes: `../diagnostico/`, `../arquitectura/`, código del repositorio solo para el estado técnico de partida.  
Destinatario: Grupo de Música, responsables institucionales, equipos de tecnología y de datos, y futuros equipos de desarrollo.

> **Documento de referencia aprobado.** Define el marco conceptual y la arquitectura objetivo de SIMUS. No es un roadmap, un backlog, una especificación de desarrollo ni una autorización para modificar código, datos, infraestructura o configuración.

### 1. Presentación y propósito

Este documento consolida el criterio institucional, funcional, informacional y técnico de SIMUS. Su propósito es dar un lenguaje común a quienes orientan la política pública, gestionan información sectorial, toman decisiones institucionales y construyen tecnología.

El documento distingue tres planos: las **decisiones aprobadas** que orientan SIMUS; el **estado actual**, respaldado por los diagnósticos y marcado cuando corresponde como VERIFICADO, PARCIAL, MOCK o TBC; y las **decisiones abiertas**, que no deben resolverse por inferencia.

### 2. Qué es SIMUS

SIMUS es el **Sistema de Información de la Música**: el sistema nacional de información del sector musical colombiano. No se define como portal, plataforma, aplicativo o ecosistema digital. Puede expresarse mediante portales, herramientas, módulos e interfaces, pero estos son manifestaciones del sistema.

SIMUS existe para recopilar, registrar, organizar, relacionar, actualizar, gobernar, analizar y proveer información estructurada sobre agentes, organizaciones, procesos, prácticas, territorios, estructuras, espacios, eventos y otros componentes del ecosistema musical colombiano. Apoya gestión del conocimiento, caracterización, seguimiento, investigación, evaluación, análisis, toma de decisiones y acceso ciudadano a información sectorial.

### 3. Relación entre SIMUS y PNMC

El Plan Nacional de Música para la Convivencia (PNMC) es la política pública que desarrolla, fortalece y utiliza SIMUS. En sentido inverso, SIMUS comunica y presenta información relevante del PNMC en sus experiencias digitales.

Esta relación no reduce SIMUS a los proyectos, acciones o beneficiarios directamente ejecutados por el PNMC. Su alcance aspira a representar el ecosistema musical colombiano en sentido amplio: festivales públicos y privados, mercados, escuelas, organizaciones, universidades, empresas, fundaciones, entidades territoriales, músicos, productores, docentes, gestores, investigadores, técnicos, luthiers, espacios y procesos comunitarios, entre otros.

Por tanto, el sitio no debe entenderse como “PNMC con SIMUS como herramienta secundaria”. PNMC y SIMUS se relacionan, pero SIMUS conserva identidad y alcance propios como sistema de información.

### 4. Propósito y alcance

SIMUS articula información sectorial y capacidades para mantenerla útil en el tiempo. Su alcance incluye información registrada por actores, información administrativa, información importada y futuras integraciones, bajo reglas de procedencia, calidad, visibilidad y publicación.

No todo dato del sector ni toda interacción debe incorporarse de inmediato. El alcance se amplía por evidencia, capacidades operativas y decisiones de gobierno. La autonomía del piloto es un principio: las futuras integraciones no son condición para que SIMUS funcione.

### 5. Principios rectores

| Principio | Significado para SIMUS |
|---|---|
| Sistema de información, no simple repositorio | Registra, relaciona, contextualiza y analiza; no se limita a guardar fichas aisladas. |
| Corresponsabilidad de la información | Los actores pueden registrar y mantener información bajo reglas; la carga institucional no es la única fuente. |
| Gobierno del dato | Informar o editar no equivale a publicar información sectorial. |
| Trazabilidad | Cada dato relevante conserva procedencia, historial y responsables de sus acciones. |
| Separación identidad–representación | Persona, cuenta, agente, organización y autorización son conceptos distintos. |
| Privacidad por diseño | La existencia de un dato no determina que sea público. |
| Interoperabilidad progresiva | Puede relacionarse con otros sistemas en el futuro sin depender de ellos hoy. |
| Evolución incremental | Conserva y mejora lo útil; evita reescrituras innecesarias. |
| Analítica como función central | La lectura de indicadores, series y cobertura es estructural, no un complemento posterior. |
| IA asistiva, no decisoria | La IA puede sugerir; las decisiones institucionales siguen siendo humanas. |

Estos principios conectan el modelo de información con las experiencias de usuario, el gobierno y la arquitectura técnica.

### 6. Capacidades funcionales

Las siguientes son capacidades funcionales; no equivalen automáticamente a aplicaciones o módulos técnicos independientes.

1. **Información y conocimiento sectorial:** reúne y relaciona registros, catálogos, contexto territorial e histórico.
2. **Registro y gestión del ecosistema:** permite crear, actualizar y vincular información bajo responsabilidades definidas.
3. **Experiencia pública y acceso al conocimiento:** presenta fichas aprobadas, contenidos, mapa, agenda, publicaciones y estadísticas.
4. **Herramientas especializadas:** ofrece experiencias de consulta o gestión para necesidades específicas, como el mapa.
5. **Administración del sistema:** permite operar usuarios, catálogos, contenidos, registros y configuraciones institucionales.
6. **Gobierno, calidad y trazabilidad del dato:** gestiona revisión, publicación, procedencia, alertas, duplicados y vínculos.
7. **Servicios, integraciones e inteligencia asistiva:** habilita intercambio futuro y apoyos automatizados con revisión humana.
8. **Analítica y estadísticas:** produce modelos de lectura, indicadores, filtros, series, visualizaciones y exportaciones autorizadas.

### 7. Modelo conceptual del ecosistema musical

El modelo conceptual representa entidades con identidades y temporalidades diferentes. No prescribe tablas SQL. Su función es evitar que un mismo concepto absorba indebidamente a los demás.

```text
Agentes ──────┐                 ┌── Ediciones ── Eventos
Organizaciones ─ relaciones ─ Procesos
      │                           │
      ├── autorizaciones           ├── caracterizaciones
      │                           │
Estructuras / espacios ─ territorios, prácticas y otras clasificaciones
```

#### Agentes individuales

Un agente es una persona natural vinculada al sector musical. Puede ejercer varios roles u oficios —por ejemplo, intérprete, compositor, productor, docente, gestor, investigador, técnico o luthier— y relacionarse con prácticas musicales, instrumentos, expresiones o géneros, territorios, organizaciones, procesos y especialidades. Ser agente no es sinónimo de tener cuenta; ambos conceptos se explican más adelante.

#### Organizaciones

Una organización tiene identidad institucional propia y puede ser fundación, asociación, empresa, universidad, alcaldía, secretaría, instituto, entidad pública u organización comunitaria formal, entre otras. No se usa “organización del sector musical” como categoría general, porque su objeto institucional puede ser más amplio. La organización persiste aunque cambien las personas autorizadas para actuar en su nombre.

#### Procesos

Un proceso representa una actividad o trayectoria organizada que puede tener identidad propia, relaciones, temporalidad y resultados. Festival, mercado musical, proceso formativo o proceso de lutería son ejemplos. Sus relaciones con organizaciones pueden ser estables o propias de una edición.

#### Estructuras, unidades y espacios

Una escuela de música es una estructura o unidad de formación: puede ser autónoma, depender de una organización, tener sedes, desarrollar procesos formativos y ser caracterizada periódicamente. No se fuerza a ser organización ni proceso.

Un taller de lutería es principalmente un establecimiento o unidad especializada. Puede estar asociado a un agente o una organización y conserva información vigente —responsable, ubicación, servicios, especialidades, instrumentos, contacto, imágenes y trayectoria— junto con su historial. Un proceso de lutería, como formación o transmisión, es diferente del taller.

Otros espacios incluyen estudios, salas, escenarios y lugares de práctica. Todos se relacionan con territorio, prácticas, responsables y, cuando corresponda, procesos.

#### Ediciones, eventos y caracterizaciones

Las ediciones corresponden a procesos recurrentes como festivales y mercados. Los eventos son ocurrencias puntuales: conciertos, talleres, charlas, encuentros, showcases o ruedas. Agenda es una experiencia editorial y de difusión; un evento puede existir como dato sin estar publicado en agenda.

Las caracterizaciones o mediciones describen cómo estaba una estructura o proceso en un momento. Son especialmente necesarias para escuelas: personal, estudiantes, infraestructura, dotación, prácticas y resultados periódicos no deben sobrescribirse como atributos permanentes.

#### Relaciones explícitas

Las relaciones son objetos con tipo, alcance, vigencia y trazabilidad. Permiten expresar, por ejemplo, la relación de una organización con un festival, una persona con una organización o un proceso con una práctica. Esta explicitud evita confundir una relación institucional con un permiso digital.

### 8. Temporalidad

SIMUS usa cinco formas de temporalidad:

1. **Identidad persistente:** aquello que sigue siendo el mismo agente, organización, proceso, escuela o taller.
2. **Ediciones:** instancias recurrentes de un festival o mercado.
3. **Caracterizaciones periódicas:** estado observado de una estructura o proceso en una fecha o periodo.
4. **Eventos puntuales:** actividades que ocurren en un momento delimitado.
5. **Historial, versiones y vigencia de relaciones:** cambios, publicación y duración de vínculos.

La regla conceptual es: “¿Qué es?” corresponde a identidad; “¿Qué ocurrió?” a edición o evento; “¿Cómo estaba en un momento?” a caracterización o historial. Un festival conserva identidad estable y tiene ediciones; un mercado hace lo mismo; una escuela conserva identidad, sedes y dependencias, pero sus mediciones cambian por periodo; un taller mantiene información vigente con historial.

### 9. Procesos: festivales y mercados musicales

Un festival es un proceso recurrente con identidad estable y ediciones. Su información estable puede incluir nombre, historia, misión, propósito, organización principal, territorio principal, periodicidad, prácticas y contacto general. Cada edición puede incorporar año, fechas, lema, programación, lugares, participantes, aliados, patrocinadores, cofinanciadores, métricas, financiación y piezas o medios.

Un mercado musical tiene lógica recurrente equivalente, pero una función distintiva de articulación, circulación, networking, formación, showcases, ruedas de negocio y fortalecimiento profesional. Puede ser independiente o relacionarse con un festival sin perder identidad propia.

Esta distinción evita multiplicar festivales o mercados por año, y permite separar relaciones estables de relaciones específicas de cada edición.

### 10. Territorio y clasificaciones

#### Territorio

SIMUS diferencia ubicación, sede, territorio principal y territorios adicionales de actuación. DIVIPOLA es la referencia territorial administrativa. Los **Territorios Sonoros** son un catálogo estructurado con un propósito distinto; la estrategia PNMC llamada “Territorios Sonoros” tampoco es equivalente a DIVIPOLA ni al catálogo. Estas distinciones evitan que una clasificación cultural reemplace una localización administrativa.

#### Prácticas y otros maestros

Existen catálogos estructurados reales de **PracticasMusicales** y **TerritoriosSonoros**, identificados en el diagnóstico y tratados como maestros que se conservan. No se sustituyen por texto libre. También deben diferenciarse práctica musical, expresión o género, instrumento, rol u oficio y especialidad. No se crea una jerarquía institucional entre géneros y prácticas cuando dicha jerarquía no existe aprobada.

### 11. Identidad, cuentas, perfiles y organizaciones

```text
Persona ≠ Cuenta ≠ Perfil de agente ≠ Organización ≠ Autorización
```

Una persona puede tener una cuenta solo para administrar una organización, sin perfil público de agente. Puede existir un registro histórico de agente sin cuenta activa y, a futuro, podrá vincularse o adoptarse bajo revisión. El documento de identidad puede apoyar deduplicación o identificación, pero no es autenticación suficiente por sí solo.

La organización no inicia sesión ni tiene usuario/contraseña. Personas concretas reciben autorizaciones para actuar en ella. Quien crea una organización queda como administrador inicial, pero esa autorización puede cambiar o finalizar. El registro de una organización no requiere aprobación previa del Ministerio y queda activo de inmediato en el entorno autenticado. Las organizaciones no son consultables por visitantes públicos en esta fase; el directorio corresponde a usuarios autenticados. Una futura diferencia entre organización registrada y verificada queda abierta.

### 12. Relaciones, autorizaciones y contextos

Las relaciones organización–proceso incluyen inicialmente organizador principal, aliado, cofinanciador, patrocinador u otro tipo justificado. Pueden ser estables del proceso o específicas de una edición. **Relación institucional no equivale a autorización digital.** Una organización aliada no recibe permiso de edición por esa sola condición.

Dentro del entorno externo, una persona puede actuar por sí misma, por una organización o sobre un proceso específico autorizado. Seleccionar contexto no escala privilegios:

```text
Edder
├── Yo mismo
├── Fundación X
└── Festival Y
```

Las autorizaciones pueden abarcar organización completa, proceso específico o recurso futuro. Su orientación técnica aprobada es roles + alcances + relaciones: la API evalúa persona, relación, recurso, alcance y vigencia antes de permitir una acción. No basta un RBAC global, ni se justifica un ABAC complejo para el piloto.

### 13. Experiencias de usuario y visibilidad

SIMUS organiza sus experiencias según audiencia y responsabilidad:

| Experiencia | Alcance aprobado |
|---|---|
| Visitante público | PNMC, mapa, festivales, mercados, escuelas, talleres/espacios, agenda, noticias, publicaciones, estadísticas y fichas públicas aprobadas. No consulta directorios de agentes ni organizaciones. |
| Usuario externo autenticado | Cuenta, perfil de agente, directorios de agentes y organizaciones, invitaciones, notificaciones y relaciones permitidas. |
| Persona por organización | Perfil institucional, equipo, autorizaciones, procesos, escuelas, espacios, ediciones, eventos, solicitudes y cambios en revisión. |
| Editor delegado | Solo recursos para los cuales tiene alcance. |
| Administrador institucional SIMUS | Gobierno del dato, usuarios, organizaciones, registros, CMS, catálogos, importaciones, auditoría, configuración y analítica administrativa. |

La consulta analítica avanzada es una capacidad y experiencia, no necesariamente un rol técnico independiente. La visibilidad se regula por políticas según tipo de información, tipo de registro, audiencia y finalidad: público, privado del titular o interno/restringido. No se delega arbitrariamente campo por campo a cada usuario.

### 14. Gobierno del dato, publicación y versionado

Existir en la base de datos no equivale a publicación pública. Para registros sectoriales con efecto público, el ciclo aprobado es:

```text
BORRADOR → EN REVISIÓN → AJUSTES SOLICITADOS
                         ↘ PUBLICADO
                         ↘ RECHAZADO
PUBLICADO → eventualmente ARCHIVADO
```

Aprobar equivale a publicar; no se añade un estado principal independiente llamado “aprobado”. Archivado conserva la historia. Cuando un registro publicado se actualiza, la versión pública sigue visible, se crea una propuesta pendiente, esta se revisa y, si se aprueba, se convierte en nueva versión pública. El principio es:

```text
versión publicada + propuesta pendiente + historial
```

La arquitectura técnica favorece inicialmente un enfoque híbrido pragmático de versión aprobada, propuesta estructurada e historial, antes que modelos más complejos como event sourcing. Esta es una decisión de arquitectura aprobada; las tablas concretas siguen abiertas.

### 15. Procedencia, importación, vinculación, duplicados y calidad

Cada registro debe poder responder quién lo informó, de dónde vino, cuándo, por qué mecanismo, quién lo modificó y quién aprobó su publicación. Los tipos conceptuales de procedencia son autorregistro, registro administrativo, importación e integración.

La importación es un proceso gobernado:

```text
lote → archivo/fuente → validación → normalización → coincidencias/duplicados
     → borradores → revisión → publicación
```

El lote conserva responsable, fecha, fuente, archivo o referencia, resultados, errores, conflictos y registros asociados. La reversión es gobernada, no un borrado masivo.

Cuando una organización identifica un registro histórico relacionado, solicita su vinculación; SIMUS y el Ministerio revisan y, tras aprobación, se crea una relación persistente que permite gestionarlo. Se mantiene la procedencia histórica y se evita lenguaje de “reclamar propiedad”.

Los duplicados tienen estado pendiente o resuelto; sus decisiones son fusionar, mantener separados o no es duplicado. Reglas o IA pueden proponer candidatos, pero una fusión nunca es automática y debe conservar fuentes, identificadores, relaciones, historial y auditoría. Las alertas de calidad son objetos independientes con estado abierta, resuelta o descartada; no son estados de publicación.

### 16. Analítica, mapa, CMS, interoperabilidad e IA

La analítica es central. La analítica pública ofrece indicadores nacionales y territoriales, filtros, estadísticas, visualizaciones, series y exportaciones autorizadas. La externa ofrece directorios y consultas permitidas. La institucional observa cobertura, calidad, actualización, estados, importaciones, vinculaciones, duplicados, evolución histórica y operación.

La capacidad analítica debe desarrollarse desde los primeros cortes de implementación del nuevo SIMUS y no condicionarse a la culminación de todos los procesos de registro y gobierno del dato. Su evolución será progresiva a medida que se consoliden fuentes y modelos de información. El fortalecimiento posterior incorpora modelos de lectura avanzados, series, agregados y exportaciones; no representa el inicio de la analítica.

**Mapa no equivale a analítica.** El mapa es una herramienta de representación territorial que usa capacidades analíticas. Se conserva como feature especializada del entorno público y debe consumir progresivamente modelos o endpoints de lectura analítica.

La evolución analítica aprobada es datos transaccionales → modelos de lectura → vistas y agregados → analítica pública, externa e institucional. No se crea inicialmente un data warehouse, arquitectura distribuida o infraestructura analítica separada sin métricas que lo justifiquen.

El CMS pertenece a la administración institucional y gestiona PNMC, páginas, textos, noticias, agenda, editorial/publicaciones, galerías y archivos. Gobierno editorial y gobierno del dato sectorial son responsabilidades diferentes, aunque puedan compartir infraestructura.

SIMUS debe poder relacionarse a futuro con Soy Cultura, otros sistemas del Ministerio, sistemas territoriales, observatorios y otras fuentes. No se asumen APIs disponibles. Una posible relación futura entre identidad/perfil cultural general y perfil especializado musical es una línea de interoperabilidad, no dependencia del piloto.

La IA asistiva puede clasificar, sugerir, normalizar, detectar coincidencias, recomendar mapeos e identificar anomalías. No publica, aprueba, rechaza, fusiona automáticamente ni asigna permisos. Toda decisión institucional conserva revisión humana.

### 17. Arquitectura de producto aprobada

```text
SIMUS
├── Experiencia pública
├── Entorno autenticado externo
│   └── Espacio de organización
└── Administración institucional

Analítica: capacidad transversal
```

La experiencia pública reúne PNMC, ecosistema, mapa, procesos, agenda, contenidos y estadísticas. El entorno externo reúne cuenta, perfil de agente, directorios, relaciones, invitaciones y notificaciones. El espacio de organización vive dentro del ámbito externo e incorpora perfil institucional, equipo, autorizaciones, procesos, escuelas, espacios, ediciones, eventos y solicitudes. La administración institucional, con acceso separado, opera gobierno, CMS, usuarios, catálogos, importaciones, auditoría, configuración y analítica administrativa.

“Aliados” y “colaboradores” son conceptos o relaciones heredadas del desarrollo actual; no se mantienen como productos principales separados en esta arquitectura.

### 18. Arquitectura técnica objetivo aprobada

La arquitectura objetivo aprobada es la **Alternativa B**, implementada de modo incremental. Ambos frontends consumen la API .NET común; ningún frontend accede directamente a SQL Server.

```text
┌──────────────────────────┐     ┌──────────────────────────┐
│ Frontend público +       │     │ Frontend institucional   │
│ externo                  │     │ separado                 │
└─────────────┬────────────┘     └─────────────┬────────────┘
              │                                │
              └───────────────┬────────────────┘
                              ▼
                    ┌───────────────────┐
                    │ API .NET modular  │
                    │ común             │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ SQL Server único  │
                    └───────────────────┘
```

El frontend público + externo contiene experiencia pública, login externo, cuenta, perfil de agente, directorios autenticados, organizaciones, procesos gestionables, mapa y analítica pública/externa. El frontend institucional contiene login institucional independiente, gobierno del dato, CMS, usuarios, catálogos, importaciones, auditoría, analítica administrativa y configuración.

La API .NET es común, pero se modulariza internamente con contratos y políticas claras por ámbito. SQL Server es común inicialmente y puede usar límites o esquemas lógicos; no se aprueba una separación física de bases. La decisión equilibra separación institucional/externa, reutilización del desarrollo, seguridad, mantenibilidad y complejidad. No ordena separar todo de inmediato.

### 19. Seguridad arquitectónica

Dos frontends no son seguridad por sí solos. El backend debe garantizar dos esquemas de autenticación, sesiones y cookies separadas, políticas excluyentes, autorización por recurso, protección contra escalamiento, CSRF cuando corresponda, rate limiting, auditoría, recuperación segura y controles institucionales reforzados, incluido MFA institucional si la evaluación posterior lo define.

Una sesión externa nunca puede consumir acciones administrativas. Aunque sea la misma persona física, cuenta externa e identidad institucional son distintas: autenticaciones, sesiones, políticas, navegación y auditoría diferenciadas. La protección del frontend mejora la experiencia; la API mantiene la autoridad efectiva.

### 20. Relación con el desarrollo actual

El diagnóstico registra como reutilizables el Angular actual, la API .NET, SQL Server, el mapa Leaflet, DIVIPOLA, los catálogos de prácticas y territorios sonoros, contenidos, funcionalidades administrativas reales y componentes de auditoría y revisión susceptibles de evolución. **VERIFICADO/PARCIAL**: una aplicación Angular, una API .NET con `PnmcDbContext` y SQL Server fuera de pruebas; véanse [02](../tecnico/arquitectura.md#estado-tecnico-de-partida) y diagnósticos 20–25.

Las brechas estructurales son una experiencia externa incompleta, mezcla de administración y colaboradores, un solo ámbito de autenticación actual, ausencia comprobada de publicación versionada/propuesta, permisos por alcance incompletos, gobierno parcial, importación sin lote completo y analítica limitada. El diagnóstico también señala rutas privadas sin guarda Angular efectiva y partes MOCK en experiencias externas. Esto no invalida el desarrollo existente: constituye una base evolutiva que requiere fronteras explícitas para el siguiente alcance.

### 21. Principios de evolución futura

La arquitectura objetivo se alcanza de forma progresiva: línea base, fronteras internas, primer vertical externo real, consolidación de gobierno/publicación, extracción del frontend institucional y fortalecimiento de analítica e importaciones. La analítica inicial acompaña los primeros cortes; la etapa posterior corresponde a su fortalecimiento progresivo. Esta secuencia orienta la evolución, pero no constituye un roadmap detallado.

Toda implementación posterior debe evitar reescrituras desde cero, priorizar cortes verticales, favorecer cambios reversibles, incluir pruebas de autorización y publicación, auditoría, observabilidad, respaldo/restauración y compatibilidad temporal cuando sea necesaria. Las decisiones evolucionan por evidencia.

### 22. Decisiones cerradas y abiertas

#### Decisiones cerradas

Quedan aprobados: identidad de SIMUS; su relación con PNMC; principios rectores; capacidades; modelo conceptual y temporalidad; separación persona/cuenta/agente/organización; autorizaciones por alcance; separación externo/institucional; audiencias y visibilidad; gobierno, publicación y procedencia; prioridad analítica; rol de mapa y CMS; IA asistiva; arquitectura de producto; y Alternativa B como arquitectura técnica objetivo incremental.

#### Decisiones todavía por precisar

Permanecen abiertas: campos definitivos de fichas; catálogo futuro de géneros/expresiones; reglas de verificación de organizaciones; políticas de visibilidad campo a campo; exportaciones; proveedor y estrategia MFA; Soy Cultura; SSO institucional; infraestructura de despliegue; monitoreo; conflicto de interés; y umbrales de volumen que justificarían infraestructura analítica separada. No se completan estos vacíos con decisiones implícitas.

### 23. Conclusión

SIMUS se consolida como un sistema nacional de información de la música, gobernado, trazable, analítico y construido con participación de sus actores. Su arquitectura objetivo preserva las capacidades existentes y ordena su evolución: separa con rigor lo externo de lo institucional, mantiene una API y una base comunes mientras sea proporcionado, y protege la publicación, la privacidad y la responsabilidad sobre el dato.

Este documento fija el criterio previo a roadmap, épicas y desarrollo. Ninguna de esas fases se activa por este documento.

## Modelo de producto SIMUS

> **PROPUESTA PRELIMINAR — NO APROBADA.** Se conserva como antecedente; debe leerse junto con `diagnostico/` antes de tomar decisiones.

Versión: v01  
Estado: REV  
Fecha: 2026-08-18  
Autor: Codex  
Deriva de: auditoría de código y marco SIMUS  
Fuentes: repositorio; [Contexto · SIMUS](https://app.notion.com/p/3ad3799e122b8114b880f5a35295bd48).  
Destinatario: Grupo de Música y equipo de producto.

### Propósito

Organizar los hallazgos de código en un modelo de producto. Es una propuesta preliminar, no una definición institucional cerrada.

### Actores y dominios

| Actor | Dominio principal | Capacidades actuales observadas |
|---|---|---|
| Visitante | Ecosistema público | Consulta de mapa, catálogos, contenidos, agenda, noticias, editorial y galería. |
| Organización | Identidad y gestión institucional | Registro externo de cuenta en API; interfaz propia aún no separada. |
| Colaborador o aliado | Aporte y gestión delegada | Roles y endpoints de aliados; dashboard aún dentro del shell administrativo. |
| Administrador SIMUS | Moderación y gobierno | Usuarios, contenidos, registros, entidades, importación, revisión, calidad, duplicados y solicitudes de vínculo. |

### Modelo conceptual recomendado

```text
Organización ── administra ──> Proceso/registro
Usuario ── tiene rol y alcance ──> Organización o SIMUS
Registro histórico ── puede estar sin organización ──> huérfano
Solicitud de vínculo ── revisa ──> administrador SIMUS
Fuente/lote de importación ── origina ──> registro histórico
```

El código actual ya usa entidades, procesos, relaciones proceso-entidad, solicitudes de vínculo, candidatos de duplicado y alertas de calidad. Falta consolidar el concepto de organización como ámbito explícito de autorización en frontend y completar procedencia/lotes de importación.

### Límites de publicación

Cada tipo de proceso debe definir atributos públicos, de ficha pública y privados. No se recomienda un formulario universal: festival, escuela, mercado y taller pueden compartir identidad, territorio, contactos, estado y procedencia, pero requieren atributos específicos por tipo.

### Flujos prioritarios

1. Cuenta externa verificada → perfil de organización.
2. Organización → detección explicable de candidatos históricos.
3. Organización → solicitud de vínculo con evidencia.
4. Revisión humana → aprobación, rechazo o solicitud de ajuste.
5. Organización autorizada → edición de su proceso; administración SIMUS conserva moderación y trazabilidad.
