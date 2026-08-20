# SIMUS — Funcionamiento integral, modelo de registro y circuito de información

**Documento explicativo del modelo funcional implementado y su evolución**

Fecha de referencia: 19 de agosto de 2026

Alcance: conceptualización actual de SIMUS, modelo de usuarios y organizaciones, gobierno de datos y circuito completo implementado con Festival como primer dominio de referencia.

---

## 1. ¿Qué es SIMUS?

SIMUS es el Sistema de Información de la Música.

No debe entenderse únicamente como una página web, un mapa, un directorio o una base de datos. Su propósito es integrar capacidades para registrar, organizar, relacionar, actualizar, gobernar, consultar y analizar información estructurada sobre el ecosistema musical colombiano.

Esto comprende progresivamente información sobre:

- agentes de la música;
- organizaciones;
- festivales;
- mercados;
- escuelas de música;
- talleres y procesos de lutería;
- espacios;
- territorios;
- prácticas musicales;
- Territorios Sonoros;
- agenda;
- publicaciones;
- datos y estadísticas;
- contenidos relacionados con el Plan Nacional de Música para la Convivencia.

El propio PNMC 2025–2035 incluye dentro de su componente de Información y Comunicación la actualización del SIMUS, orientada a facilitar el acceso a información reciente sobre políticas, actores y dinámicas del campo musical. También plantea que sistemas de medición y recopilación de información sectorial puedan ser consultados a través de SIMUS.

Por tanto, la relación general puede explicarse así:

```
PLAN NACIONAL DE MÚSICA PARA LA CONVIVENCIA
                 │
                 │ política pública
                 │ orientación
                 │ programas
                 │ contenidos
                 ▼
               SIMUS
                 │
                 │ Sistema de Información de la Música
                 │
                 ├── información sectorial
                 ├── registro del ecosistema
                 ├── conocimiento
                 ├── servicios digitales
                 ├── mapas
                 ├── analítica
                 ├── contenidos
                 └── gobierno del dato
```

El PNMC orienta y cobija institucionalmente esta actualización, pero la aspiración informacional de SIMUS es más amplia que registrar únicamente acciones realizadas directamente por el Plan.

Un Festival privado, una escuela comunitaria, una organización independiente o un proceso musical que nunca haya participado directamente en una acción del Ministerio puede hacer parte de SIMUS.

## 2. ¿Qué cambio fundamental se hizo?

La transformación principal consiste en dejar de pensar SIMUS como una colección de formularios, módulos y bases aisladas y empezar a entenderlo como un sistema coherente de identidades, relaciones, permisos, información, revisión, publicación y consulta.

Antes podían confundirse conceptos como:

```
usuario
organización
entidad
cuenta
registro
proceso
administrador
publicación
```

La actualización los separa.

El principio más importante es:

> Una persona inicia sesión. Una organización existe como una identidad independiente y es administrada por personas autorizadas.

Esto cambia completamente la forma de entender el registro.

## 3. Persona, cuenta, perfil y organización no son lo mismo

SIMUS separa conceptualmente:

```
PERSONA
↓
CUENTA DE ACCESO
↓
AUTORIZACIONES
↓
ORGANIZACIONES QUE PUEDE ADMINISTRAR
↓
PROCESOS DE ESAS ORGANIZACIONES
```

Una cuenta de acceso siempre representa a una persona identificable.

La organización, por su parte:

- tiene nombre propio;
- puede tener NIT u otro identificador;
- tiene ubicación;
- tiene información institucional;
- puede existir durante muchos años;
- puede tener diferentes administradores a lo largo del tiempo;
- puede tener varios procesos;
- no depende técnicamente de una sola persona.

La implementación del registro de organizaciones ya establece precisamente que la organización tiene identidad propia y que una persona verificada queda vinculada como su administradora inicial. La organización no inicia sesión ni tiene una contraseña compartida.

## 4. ¿Por qué la organización no tiene una contraseña compartida?

Porque una organización puede cambiar de equipo.

Por ejemplo, `Fundación Música Viva` puede ser administrada hoy por `Edder` y mañana por `María` sin que la Fundación deje de existir.

Un modelo basado en:

```
fundacion@gmail.com
contraseña conocida por cinco personas
```

genera problemas de:

- seguridad;
- trazabilidad;
- salida de colaboradores;
- responsabilidad;
- recuperación de cuenta;
- auditoría.

El modelo adoptado es:

```
PERSONA A ──────┐
                │ administrador
PERSONA B ──────┼──────────────► ORGANIZACIÓN
                │ editor
PERSONA C ──────┘
```

Cada persona tiene su propia identidad de acceso. La organización permanece independiente.

## 5. Entonces, ¿cómo se siente el registro para la persona?

Aunque técnicamente la organización necesita una persona responsable, la interfaz no obliga al ciudadano a entender primero toda esta arquitectura.

La experiencia presenta dos caminos claros:

```
¿QUÉ QUIERES HACER?

[ Registrarme ]

[ Registrar una organización o entidad ]
```

Esta decisión ya quedó incorporada en la experiencia de registro.

## 6. Camino A — "Registrarme"

Este camino está pensado para una persona. La primera etapa debe ser deliberadamente sencilla.

Por ejemplo:

```
Nombre
Documento
Correo
Teléfono
Contraseña
Verificación
```

No es necesario exigir desde el primer segundo una hoja de vida musical completa.

La lógica es:

```
Persona
↓
crea cuenta
↓
verifica correo
↓
cuenta activa
↓
entra al entorno externo de SIMUS
```

El registro externo fue corregido expresamente para que la cuenta represente solamente una persona y no pueda crearse una "cuenta organización".

## 7. El perfil de agente de la música

La cuenta de acceso y el futuro perfil de agente de la música son dos cosas diferentes. Una persona puede tener una cuenta básica para administrar una organización sin necesariamente haber completado todavía un gran perfil profesional.

A futuro, el perfil de agente permitirá estructurar información como:

- identidad;
- ubicación;
- territorio;
- roles u oficios;
- experiencia;
- instrumentos;
- prácticas;
- géneros;
- especialidades;
- información profesional;
- contacto;
- relaciones con organizaciones.

Su propósito será permitir un directorio nacional especializado del sector musical. Sin embargo, este desarrollo no es actualmente condición para registrar una organización.

En otras palabras:

```
CUENTA
≠
PERFIL DE AGENTE
```

## 8. Camino B — "Registrar una organización o entidad"

La interfaz puede iniciar desde la organización porque esa es la intención de la persona. Por ejemplo: *quiero registrar mi Fundación*.

La experiencia puede preguntar primero:

```
Nombre de la organización
NIT o identificación
Tipo
Ubicación
Correo institucional
Información básica
```

y después explicar:

> Las organizaciones de SIMUS son administradas por personas identificadas. Necesitamos saber quién realizará la administración inicial.

Entonces se identifica o crea la cuenta personal.

Conceptualmente:

```
QUIERO REGISTRAR MI ORGANIZACIÓN
              ↓
    datos de la organización
              ↓
¿Quién realiza este registro?
              ↓
       identificar persona
              ↓
    verificar cuenta personal
              ↓
     crear organización
              ↓
 persona = administrador inicial
```

Para el ciudadano parece un único recorrido. Técnicamente siguen existiendo dos identidades distintas.

## 9. La organización no necesita aprobación del Ministerio para existir

Esta fue una decisión importante.

Cuando una persona registra `Fundación X`, la Fundación no necesita pasar primero por una bandeja ministerial para convertirse en una organización de su entorno. La organización queda registrada, lo que permite que rápidamente pueda empezar a gestionar información.

La implementación actual crea la organización activa, con estado `registrada`, sin aprobación ministerial previa. Tampoco implica crear automáticamente un directorio público de organizaciones.

## 10. Registrar una organización no significa hacerla pública para toda la ciudadanía

Esta diferenciación también es fundamental. Actualmente:

```
Visitante público
→ NO consulta directorio general de personas
→ NO consulta directorio general de organizaciones
```

En cambio, los usuarios autenticados podrán progresivamente trabajar con esas identidades.

Además, una organización puede aparecer mencionada dentro de la ficha pública de un proceso, por ejemplo:

> Festival X — Organización responsable: Fundación Y

Eso no equivale a publicar un directorio general de organizaciones.

## 11. ¿Qué puede hacer una organización dentro de SIMUS?

Una organización puede convertirse en responsable de diferentes elementos del ecosistema:

```
FUNDACIÓN MÚSICA VIVA
│
├── Festival Río Sonoro
├── Mercado Musical del Sur
├── Escuela Música Viva
├── Taller de lutería
└── Sede cultural
```

No todos estos objetos necesariamente tendrán exactamente el mismo modelo. Festival fue seleccionado como primer dominio de referencia precisamente para probar el circuito completo antes de replicarlo mecánicamente en mercados, escuelas o talleres.

## 12. Permisos dentro de una organización

La organización puede tener varias personas relacionadas:

```
Fundación Música Viva
│
├── Edder
│   └── administrador general
│
├── Ana
│   └── editora del Festival
│
└── Carlos
    └── responsable de otro proceso
```

Esto introduce una idea central:

```
ROL
+
ALCANCE
```

No basta decir que alguien es "editor". Hay que saber: ¿editor de qué?

El modelo conceptual distingue permisos sobre `toda la organización` o, posteriormente, sobre `un proceso específico`. La arquitectura aprobada reconoce precisamente que un rol global no es suficiente para responder sobre qué organización o recurso puede actuar una persona.

## 13. Relaciones entre organizaciones y procesos

Un proceso puede tener:

- organizador principal;
- organizaciones aliadas;
- cofinanciadores;
- patrocinadores;
- otras relaciones institucionales.

Pero esas relaciones no significan automáticamente permisos digitales. Por ejemplo:

```
Festival X

Organizador principal:
Fundación A

Aliado:
Universidad B

Patrocinador:
Empresa C
```

Que la Universidad B figure como aliada no significa que cualquier usuario de la Universidad pueda editar el Festival.

Una cosa es `RELACIÓN INSTITUCIONAL` y otra `AUTORIZACIÓN DIGITAL`. Esta separación forma parte de los principios de arquitectura adoptados.

## 14. Festival como primer circuito completo

Festival fue utilizado como el primer caso para comprobar si toda esta arquitectura funciona de extremo a extremo. La ruta construida es:

```
PERSONA
↓
ORGANIZACIÓN
↓
FESTIVAL
↓
REVISIÓN
↓
PUBLICACIÓN
↓
CONSULTA
↓
ACTUALIZACIÓN
↓
NUEVA VERSIÓN
↓
MAPA + ANALÍTICA
```

## 15. Crear un Festival

Una persona autenticada que tenga relación activa como administradora de una organización puede seleccionar esa organización y registrar un Festival. El Festival queda inicialmente en `Borrador`.

La implementación conserva su identidad independiente, lo relaciona con una organización responsable e incorpora información estructurada como territorio, periodicidad, Prácticas Musicales y Territorios Sonoros.

Ejemplo:

```
Fundación Música Viva
↓
Registrar Festival
↓
Festival Río Sonoro
↓
Borrador
```

## 16. ¿Qué información puede tener un Festival?

El modelo de Festival se concentra en la identidad estable del proceso:

- nombre;
- descripción o propósito;
- organización responsable;
- territorio principal;
- periodicidad;
- correo público de contacto;
- Prácticas Musicales;
- Territorios Sonoros.

Está ligado a DIVIPOLA para territorialidad.

## 17. Festival no es igual a Edición

Esta diferenciación es fundamental.

```
FESTIVAL
≠
EDICIÓN
```

Un Festival puede existir durante veinte años. `Festival Internacional X` es la identidad estable, mientras que `Festival Internacional X — edición 2026` es una ocurrencia temporal.

En una futura estructura de Ediciones podrían existir:

- fechas;
- programación;
- conciertos;
- invitados;
- lema o eslogan anual;
- boletería;
- métricas de asistencia;
- actividades;
- patrocinadores de esa edición.

Estos datos no deben mezclarse indiscriminadamente con la identidad estable del Festival.

## 18. Enviar el Festival a revisión

Mientras está en Borrador, la organización puede trabajar sobre él. Cuando considera que la información está lista:

```
Borrador
↓
Enviar a revisión
↓
EnRevision
```

La API, no el frontend, controla esta transición. El envío verifica, entre otras condiciones, que:

- existe organización principal;
- la organización está activa;
- la persona tiene autorización;
- existe información territorial válida cuando corresponde;
- el registro cumple condiciones mínimas.

Una vez en `EnRevision`, la organización ya no puede sobrescribirlo mientras la institución lo está revisando.

## 19. Dos accesos completamente separados

SIMUS separa estrictamente el `ÁMBITO EXTERNO` y el `ÁMBITO INSTITUCIONAL`.

La sesión externa utiliza una cookie independiente:

```
pnmc.external
```

y la institucional:

```
pnmc.admin
```

La API exige el esquema apropiado. Una sesión externa no autentica rutas institucionales y una institucional no sirve como sesión externa.

Por tanto:

```
PERSONA DEL SECTOR
≠
FUNCIONARIO SIMUS
```

aunque físicamente pudieran ser la misma persona en algún caso. No existe un botón para "convertirse en administrador".

## 20. ¿Qué ve el funcionario?

El funcionario entra por el ámbito institucional y tiene una bandeja de revisión:

```
FESTIVALES EN REVISIÓN

Festival Río Sonoro
Fundación Música Viva
Enviado: 19/08/2026

[ Revisar ]
```

Al entrar puede revisar los datos enviados.

## 21. ¿Qué puede decidir el funcionario?

Sobre un Festival en `EnRevision`, puede realizar tres decisiones:

```
                EnRevision
                    │
        ┌───────────┼────────────┐
        ▼           ▼            ▼
Solicitar       Rechazar      Publicar
 ajustes
    │               │             │
    ▼               ▼             ▼
Ajustes          Rechazado     Publicado
Solicitados
```

Este flujo está implementado y cada decisión conserva historia funcional, auditoría y notificación interna.

## 22. Solicitar ajustes

Si la información requiere correcciones:

```
EnRevision
↓
AjustesSolicitados
```

El funcionario debe dejar una observación. La organización ve algo como:

> SIMUS solicita ajustar la descripción territorial del Festival.

Entonces puede corregir la propuesta:

```
AjustesSolicitados
↓
corrección
↓
reenviar
↓
EnRevision
```

## 23. Rechazar

También puede ocurrir:

```
EnRevision
↓
Rechazado
```

El registro no se borra. Se conserva:

- Festival;
- información;
- decisión;
- funcionario;
- fecha;
- motivo;
- auditoría.

## 24. Publicar

Si la información cumple las condiciones:

```
EnRevision
↓
Publicado
```

Para este primer circuito no se creó un estado artificial adicional denominado "Aprobado". La decisión funcional es: si el funcionario decide que el registro es apto para publicación, se publica.

Publicar significa *información aceptada para mostrarse públicamente en SIMUS*. No significa *certificación jurídica absoluta de todos los datos reportados*.

## 25. ¿Qué ve la ciudadanía?

Una vez publicado, el Festival tiene una experiencia pública específica. Actualmente existen:

```
/simus/festivales
/simus/festivales/:festivalId
```

Además, existe una API pública específica de Festivales.

La ficha puede mostrar:

```
Festival Río Sonoro

Organización responsable:
Fundación Música Viva

Territorio:
Tolima — Ibagué

Periodicidad:
Anual

Descripción:
...

Prácticas Musicales:
...

Territorios Sonoros:
...

Contacto:
...
```

## 26. ¿Qué NO se muestra públicamente?

La ficha pública está expresamente limitada. No se publican automáticamente:

- persona administradora;
- correo de inicio de sesión;
- identificadores técnicos;
- permisos;
- historial de revisión;
- motivos internos;
- auditoría;
- notificaciones;
- datos privados.

La implementación de CV-008 creó precisamente una proyección pública específica en lugar de devolver indiscriminadamente todos los campos de la base.

## 27. Publicado no puede editarse directamente

Este fue uno de los cambios arquitectónicos más importantes.

Supongamos que la ciudadanía está viendo:

```
Festival Río Sonoro

Descripción:
Festival anual dedicado a las músicas tradicionales.
```

Si la organización quiere cambiarlo por *"Festival nacional dedicado a músicas tradicionales y contemporáneas"*, SIMUS no puede hacer:

```
UPDATE
↓
texto público cambia inmediatamente
```

Eso rompería el gobierno del dato.

## 28. Se crea una propuesta de cambio

El modelo correcto es:

```
FESTIVAL
│
├── VERSIÓN PÚBLICA ACTUAL
│
└── PROPUESTA DE CAMBIO
```

CV-009 implementó esa separación mediante estructuras específicas para versiones públicas y propuestas privadas. Entonces:

```
CIUDADANÍA
ve versión N

ORGANIZACIÓN
trabaja propuesta
```

simultáneamente.

## 29. La propuesta no altera lo público

Mientras la propuesta está en `Borrador`, `EnRevision`, `AjustesSolicitados` o `Rechazada`, la ciudadanía sigue viendo la `Versión N`.

Incluso si la propuesta modifica:

- nombre;
- descripción;
- territorio;
- periodicidad;
- contacto;
- Prácticas Musicales;
- Territorios Sonoros.

Nada cambia públicamente hasta la aprobación.

## 30. Gobierno de la propuesta

La propuesta tiene su propio ciclo:

```
Borrador
↓
EnRevision
↓
┌────────────────┬───────────┬────────────┐
▼                ▼           ▼
Ajustes       Rechazada   Publicada
Solicitados
│
▼
corregir
│
▼
EnRevision
```

Este flujo es diferente del estado general del Festival. Por ejemplo:

```
Festival:
PUBLICADO

Propuesta:
EN REVISIÓN
```

Esto es perfectamente válido.

## 31. Comparación "actual vs propuesto"

El funcionario puede revisar:

```
VERSIÓN ACTUAL             PROPUESTA
------------------------------------------------
Descripción A              Descripción B
Tolima                     Tolima + Huila
Práctica X                 Práctica X + Y
```

Esto hace que la revisión de una modificación sea mucho más clara que sobrescribir directamente una fila.

## 32. Publicar una modificación genera N+1

Si el funcionario aprueba la propuesta:

```
Versión N
↓
se conserva

Propuesta aprobada
↓
se convierte en

Versión N+1
↓
nueva versión vigente
```

Por ejemplo:

```
Festival Río Sonoro

Versión 1
publicada en 2026

Versión 2
publicada posteriormente
← VIGENTE
```

La versión 1 no desaparece. CV-010 completó precisamente este gobierno: una propuesta aprobada genera una nueva versión pública y conserva la anterior.

## 33. Una sola fuente de verdad

Después del cierre del circuito se tomó otra decisión fundamental: no mantener diferentes copias autoritativas del mismo Festival.

Para registros gobernados, el contenido público vigente vive en:

```
VersionesFestival
donde EsVigente = true
```

Esta es la fuente canónica. La arquitectura queda:

```
FESTIVALES
│
└── identidad estable
     organización responsable
     estado operativo
          │
          ▼
VERSIONES FESTIVAL
│
├── versión 1
├── versión 2
└── versión N vigente
        │
        ├── ficha
        ├── listado
        ├── mapa
        └── analítica
```

Y aparte:

```
PROPUESTAS CAMBIO FESTIVAL
└── contenido todavía no publicado
```

## 34. ¿Por qué es tan importante la fuente única?

Porque antes podría ocurrir:

```
tabla Festival dice A
mapa dice B
ficha dice C
analítica cuenta D
```

Ahora el principio es:

```
UNA VERSIÓN PÚBLICA VIGENTE
           │
   ┌───────┼─────────┐
   ▼       ▼         ▼
 ficha    mapa    analítica
```

La implementación de CV-011 centralizó precisamente esa lectura para la ficha/listado, el contrato utilizado por el mapa y la analítica.

## 35. El mapa no es otra base de datos

El mapa debe entenderse como una herramienta de representación. No crea una verdad independiente. El mapa pregunta al sistema *cuáles son los Festivales públicos vigentes y dónde están*, y los representa territorialmente.

Por tanto:

```
Propuesta pendiente
→ mapa no cambia

Nueva versión publicada
→ mapa cambia
```

sin tener que mantener manualmente otra copia del dato.

## 36. Analítica

La misma regla aplica para estadísticas. SIMUS puede responder:

- cuántos Festivales públicos existen;
- cuántos por departamento;
- cuántos por municipio;
- distribución por Práctica Musical;
- distribución por Territorio Sonoro;
- distribución por periodicidad.

Pero:

```
Festival X
versión 1
versión 2
versión 3
```

no cuenta como tres Festivales. Cuenta `1 Festival`, usando la `versión 3 vigente`. CV-011 estableció ese comportamiento y la lectura analítica gobernada.

## 37. ¿Qué ocurre con los registros históricos?

SIMUS ya tenía información antes de construir este circuito. Un `Festival antiguo` podía estar en una base de datos y aparecer en el mapa sin haber pasado por:

```
persona
→ organización
→ borrador
→ revisión
→ publicación
```

No sería correcto afirmar retroactivamente que ese Festival fue aprobado por el Ministerio. Por eso se diseñó una transición: los históricos pueden normalizarse técnicamente hacia el nuevo modelo creando una instantánea inicial, pero sin inventar una revisión institucional que nunca ocurrió.

La preparación preproducción contempla precisamente una normalización controlada, idempotente y auditable de estos registros.

## 38. ¿Qué significa "normalizar históricos"?

Significa transformar técnicamente:

```
Festival histórico
contenido heredado
```

en:

```
Festival histórico
↓
VersiónFestival inicial heredada
```

para que toda lectura futura pueda utilizar la misma arquitectura. No significa cambiar su historia institucional.

## 39. Gobierno del dato

El circuito construido separa cuatro conceptos:

| Concepto | Qué registra |
|---|---|
| **Versiones** | qué contenido estuvo publicado |
| **Historial de revisión** | qué decisión institucional se tomó |
| **Auditoría** | quién hizo técnicamente qué |
| **Notificaciones** | qué se comunicó a la persona |

No son lo mismo. Esta separación permite reconstruir posteriormente quién envió el Festival, quién lo revisó, qué decidió, por qué, qué versión quedó publicada y qué veía la ciudadanía en determinado momento.

## 40. Administración institucional

El funcionario institucional puede progresivamente gestionar:

- bandejas de revisión;
- decisiones;
- usuarios institucionales;
- registros;
- gobierno del dato;
- contenidos;
- importaciones;
- calidad;
- duplicados;
- vínculos;
- configuración;
- CMS;
- analítica.

Pero existe una regla:

```
FUNCIONARIO
≠
USUARIO EXTERNO
```

La separación de autenticación es estricta.

## 41. CMS y gobierno de información no son lo mismo

Editar el `texto de la página de inicio` no tiene el mismo ciclo que `aprobar un Festival`, aunque ambas funciones puedan estar disponibles para funcionarios.

Por tanto, el `CMS` gestiona contenidos editoriales, mientras el `GOBIERNO DEL DATO` gestiona registros sectoriales y sus decisiones. La arquitectura ya había identificado que contenidos PNMC/SIMUS y registros sectoriales comparten infraestructura, pero tienen responsabilidades y ciclos distintos.

## 42. ¿Qué cambió respecto del SIMUS inicial?

La línea base tenía:

- un Angular;
- una API .NET;
- SQL Server;
- mapa;
- contenidos;
- administración;
- datos de Festivales, escuelas, mercados y otros;
- estructuras de usuarios y entidades;
- mecanismos parciales de gobierno.

Pero existían problemas como:

- organización confundida con cuenta;
- una sola sesión administrativa;
- externos sin sesión completa;
- flujos privados parcialmente simulados;
- administración y colaboradores mezclados;
- publicaciones sin regla homogénea;
- registros que podían sobrescribirse;
- datos visibles sin versionamiento;
- permisos poco claros;
- importaciones con trazabilidad parcial;
- mapa y datos con acoplamientos heredados.

La línea base técnica documentó precisamente varios de estos riesgos, incluida la dependencia vulnerable de SQLite utilizada en pruebas.

## 43. Evolución resumida de los cortes

Aunque para una presentación institucional no hace falta explicar cada código, técnicamente la transformación siguió esta secuencia:

| Corte | Alcance |
|---|---|
| CV-002 | Separación de sesiones externa / institucional |
| CV-003 | Cuenta externa = persona |
| CV-004 | Organización independiente + administrador inicial |
| CV-005 | Festival en Borrador |
| CV-006 | Enviar Festival a revisión |
| CV-007 | Revisión institucional |
| CV-008 | Ficha pública de Festival |
| CV-009 | Propuesta privada sobre Festival publicado |
| CV-010 | Gobierno de propuesta + nueva versión |
| CV-011 | Fuente canónica + mapa + analítica |

El catálogo documenta esta construcción incremental y mantiene Festival como primer dominio de referencia.

## 44. El circuito completo en una sola imagen conceptual

```
                    CIUDADANÍA / SECTOR
                           │
                           ▼
                       REGISTRO
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
             Persona              Organización
                │                     ▲
                │ administra          │
                └─────────────────────┘
                                      │
                                      ▼
                                  Festival
                                      │
                                   Borrador
                                      │
                              Enviar a revisión
                                      │
                                      ▼
                                  EnRevision
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
              Solicitar ajustes    Rechazar          Publicar
                    │                 │                 │
                    ▼                 ▼                 ▼
               corregir          Rechazado          Versión 1
                    │                                   │
                    └──► reenviar                       ▼
                                                  FICHA PÚBLICA
                                                       │
                                          ┌────────────┼────────────┐
                                          ▼            ▼            ▼
                                        MAPA       ANALÍTICA     CONSULTA


ORGANIZACIÓN QUIERE MODIFICAR
             │
             ▼
     Propuesta de cambio
             │
           Borrador
             │
         EnRevision
             │
      ┌──────┼─────────┐
      ▼      ▼         ▼
 Ajustes  Rechazar  Publicar
                     │
                     ▼
                  Versión 2
                     │
                     ▼
               NUEVA VIGENTE
                     │
          ┌──────────┼───────────┐
          ▼          ▼           ▼
        Ficha       Mapa      Analítica
```

## 45. Ejemplo práctico completo

Imaginemos que `Edder` quiere registrar la `Fundación Sonidos del Sur`, y esa Fundación realiza el `Festival Sonidos del Sur`.

1. Edder entra a *Registrar una organización o entidad*.
2. Registra nombre, NIT, municipio, departamento y correo institucional.
3. SIMUS identifica quién está realizando el registro. Edder crea o utiliza su cuenta personal.
4. Queda: `Fundación Sonidos del Sur` — administrador inicial: Edder.
5. Dentro de la organización: *Registrar Festival*.
6. Crea `Festival Sonidos del Sur`, estado `Borrador`.
7. Completa la información.
8. Pulsa *Enviar a revisión*. Queda en `EnRevision`.
9. Un funcionario entra por el acceso institucional y ve el Festival.
10. Puede solicitar ajustar la descripción.
11. Edder corrige y reenvía.
12. El funcionario publica.
13. El Festival aparece en `/simus/festivales`, tiene ficha pública y puede alimentar el mapa y las estadísticas.
14. Seis meses después la Fundación cambia la descripción. No modifica directamente lo publicado: crea una `Propuesta de cambio`.
15. Mientras se revisa, la ciudadanía sigue viendo la Versión 1.
16. El Ministerio aprueba. SIMUS crea la Versión 2.
17. A partir de ese instante, ficha, mapa y analítica leen la Versión 2, mientras la Versión 1 permanece en historial.

## 46. ¿Qué queda construido como patrón reutilizable?

Festival no debe convertirse en una plantilla rígida para todo SIMUS. Lo reutilizable es el patrón:

```
IDENTIDAD ESTABLE
+
ORGANIZACIÓN RESPONSABLE
+
PERSONAS AUTORIZADAS
+
BORRADOR
+
REVISIÓN
+
PUBLICACIÓN
+
VERSIÓN PÚBLICA
+
PROPUESTA DE CAMBIO
+
NUEVA VERSIÓN
+
LECTURA PÚBLICA GOBERNADA
```

Este patrón puede adaptarse posteriormente a mercados, determinados tipos de escuela, talleres, espacios y otros procesos. Pero cada uno necesita estudiar su propia temporalidad.

## 47. Una Escuela no necesariamente funciona exactamente como un Festival

Festival suele tener:

```
Festival
↓
Ediciones
```

Una Escuela puede necesitar:

```
Escuela
↓
Sedes
↓
Caracterizaciones periódicas
```

Por ejemplo, el número de docentes y estudiantes en 2026 no debe necesariamente sobrescribir el dato de 2025. Por eso Festival valida el patrón de gobierno, pero no define todos los objetos del SIMUS.

## 48. Territorio

Otra decisión importante es separar la `ubicación` del `territorio de actuación`. Una organización puede tener su sede en Bogotá y trabajar en varios departamentos.

Los territorios se relacionan con DIVIPOLA, lo que permite análisis territorial consistente.

## 49. Prácticas Musicales y Territorios Sonoros

SIMUS ya dispone de catálogos estructurados para clasificar información musical, que permiten evitar depender únicamente de textos libres.

Un Festival puede relacionarse con múltiples `Prácticas Musicales` y múltiples `Territorios Sonoros`, y esas relaciones hacen posible posteriormente:

- filtrar;
- mapear;
- analizar;
- comparar;
- producir estadísticas.

## 50. El gran cambio conceptual

**Antes**

```
Tengo registros.
Tengo páginas.
Tengo mapa.
Tengo administración.
Tengo usuarios.
```

**Ahora**

```
Sé quién actúa.
Sé sobre qué organización puede actuar.
Sé qué proceso administra.
Sé en qué estado está la información.
Sé quién la revisó.
Sé qué versión es pública.
Sé qué cambio está pendiente.
Sé qué ve la ciudadanía.
Sé qué alimenta el mapa.
Sé qué alimenta la analítica.
```

Ese es el salto principal.

## 51. Estado actual del circuito Festival

La revisión técnica de cierre determinó:

```
Circuito Festival:
SÍ CON CONDICIONES
```

Esto significa que funcionalmente está recorrido de extremo a extremo:

```
persona
→ organización
→ Festival
→ revisión
→ publicación
→ consulta pública
→ modificación
→ nueva versión
→ mapa
→ analítica
```

La documentación de cierre confirma además que para contenido gobernado la fuente canónica es `VersionesFestival` y que ficha, listado, mapa y analítica consumen la misma lectura.

## 52. ¿Está listo para producción?

No todavía. La revisión concluyó:

```
Listo para producción:
NO
```

No porque el modelo funcional de Festival esté incompleto, sino porque faltan condiciones operativas institucionales.

## 53. Saneamiento preproducción realizado

Después del cierre funcional se realizó un bloque separado de saneamiento. Entre otras cosas:

- se cerró la posibilidad de modificar Festivales gobernados mediante rutas administrativas genéricas;
- se delimitó la importación;
- se añadió diagnóstico de históricos;
- se reforzó la trazabilidad de la normalización;
- se prepararon procedimientos de respaldo y restauración;
- se preparó un ensayo de cambios de esquema.

Este bloque se documentó expresamente como mantenimiento/preproducción, no como un nuevo dominio funcional.

## 54. Qué queda antes de producción institucional

Todavía deben realizarse en un entorno institucional real:

- respaldo real de SQL Server;
- prueba de restauración;
- ensayo de migraciones sobre copia institucional;
- diagnóstico de históricos;
- normalización controlada de históricos;
- verificación posterior;
- configuración definitiva de HTTPS;
- CORS productivo;
- secretos institucionales;
- monitoreo;
- observabilidad;
- políticas de autenticación institucional;
- eventual MFA o SSO;
- actualización controlada de dependencias vulnerables;
- pruebas de aceptación con datos reales.

El procedimiento de respaldo/restauración ya está preparado, pero expresamente aclara que no certifica todavía una infraestructura institucional existente.

## 55. Versionamiento del propio desarrollo

Otro cambio metodológico importante fue dejar de modificar indefinidamente una "versión base". Desde CV-004 los cortes validados tienen:

```
commit
+
tag Git recuperable
```

Esto permite volver a un estado exacto anterior. La documentación distingue `recuperar una versión` de `revertir un cambio`, y mantiene además una línea separada para saneamiento/preproducción.

## 56. Cómo se explica en dos minutos

SIMUS está evolucionando hacia un sistema en el que la información del ecosistema musical no se administra simplemente como registros sueltos. Primero se identifica quién está actuando. Una persona crea su cuenta y puede administrar una organización; la organización tiene identidad propia y puede tener varios administradores. Desde esa organización se registran procesos, como un Festival.

El Festival se crea como borrador y no aparece inmediatamente en la web. La organización lo envía a revisión y un funcionario, desde un acceso institucional completamente separado, puede solicitar ajustes, rechazarlo o publicarlo. Solo después de publicarse entra a la consulta pública.

Si posteriormente la organización quiere modificarlo, tampoco cambia directamente lo que ve la ciudadanía. Se crea una propuesta independiente. Mientras esa propuesta se revisa, la versión publicada sigue intacta. Si se aprueba, SIMUS genera una nueva versión y conserva la anterior.

Esa versión vigente es la única fuente que utilizan la ficha pública, el mapa y la analítica. De esa manera evitamos tener varios datos diferentes diciendo cosas distintas sobre el mismo Festival.

Festival es el primer dominio con el que probamos este circuito completo. El siguiente objetivo no es copiarlo exactamente a todo SIMUS, sino reutilizar este patrón de identidad, permisos, gobierno, publicación y versionamiento adaptándolo a mercados, escuelas, talleres y otros objetos del ecosistema.

## 57. Cómo se explica en una sola frase

SIMUS está pasando de ser una plataforma que contiene información a convertirse en un verdadero sistema de información gobernado: sabemos quién aporta el dato, quién puede modificarlo, qué organización responde por él, qué revisa el Ministerio, qué versión está publicada y qué información alimenta las consultas, el mapa y la analítica.

## 58. Idea central para presentar institucionalmente

No presentar el desarrollo como *"hicimos un formulario de Festival"*, sino como:

> Construimos y validamos con Festival el primer circuito completo de incorporación, administración, gobierno, publicación, actualización, versionamiento y aprovechamiento de información sectorial de SIMUS.

Eso cambia el significado del piloto. Festival es el caso demostrativo. El verdadero producto que se está consolidando es el modelo de funcionamiento del Sistema de Información de la Música.
