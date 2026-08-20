# Historias de usuario de la plataforma web PNMC

## 1. Objetivo

Este backlog traduce el alcance funcional de la plataforma del Plan Nacional de Música para la Convivencia (PNMC) en historias de usuario verificables. Incluye el portal público, el mapa ecosistémico, la participación ciudadana, el portal de entidades aliadas y la consola administrativa.

## 2. Perfiles

| Perfil | Necesidad principal |
| --- | --- |
| Público / ciudadanía | Consultar información, actividades, publicaciones y actores del ecosistema musical. |
| Colaborador externo | Registrar, actualizar y hacer seguimiento a sus propios procesos culturales. |
| Aliado lector | Consultar y exportar información autorizada de su entidad. |
| Aliado editor | Crear, importar, corregir y enviar registros de su entidad. |
| Aliado administrador | Gestionar registros, indicadores y usuarios de su entidad aliada. |
| Gestor interno | Revisar la calidad de los registros y moderar su ciclo editorial. |
| Webmaster | Administrar integralmente contenidos, usuarios, configuración, publicación y auditoría. |

## 3. Convenciones

- **Prioridad:** Must (indispensable), Should (importante), Could (deseable).
- **Entrega:** MVP (primera salida operativa), Evolutivo (iteración posterior).
- Los datos personales solo se muestran cuando el rol, la propiedad del registro y la entidad asociada lo permiten.

## Épica 1. Portal público y navegación

### HU-PUB-01 — Navegar por el portal

**Como** visitante, **quiero** acceder a las secciones principales desde una navegación clara y adaptable, **para** encontrar información desde cualquier dispositivo.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- Dado que estoy en cualquier página pública, cuando uso el menú, entonces puedo acceder a PNMC, Ejes, Editorial, Galería, Noticias, Agenda y Mapa Ecosistémico.
- Dado que uso una pantalla pequeña, cuando abro el menú, entonces las opciones son legibles, operables y el menú puede cerrarse.
- Dado que ingreso a una ruta inexistente, cuando la aplicación la procesa, entonces muestra una salida comprensible para volver al inicio.

### HU-PUB-02 — Conocer el PNMC y sus ejes

**Como** ciudadano, **quiero** consultar el propósito, los ejes y componentes del PNMC, **para** entender su oferta y enfoque territorial.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- La página presenta la información institucional y los ejes estratégicos con una jerarquía comprensible.
- Cada componente disponible permite abrir su página de detalle mediante una URL propia.
- Desde el detalle puedo volver al eje correspondiente sin perder el contexto de navegación.

### HU-PUB-03 — Consultar recursos editoriales

**Como** docente, investigador o músico, **quiero** buscar y filtrar publicaciones, **para** encontrar materiales útiles y acceder a sus archivos.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- Puedo buscar recursos por texto y filtrarlos por los metadatos disponibles, como eje, sección o año.
- El sistema informa claramente cuando no hay resultados o cuando ocurre un error de carga.
- Al seleccionar un recurso puedo consultar su ficha y abrir o descargar el archivo asociado mediante un enlace válido.

### HU-PUB-04 — Consultar noticias

**Como** visitante, **quiero** ver noticias y abrir su contenido completo, **para** mantenerme informado sobre el PNMC y sus territorios.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- Las noticias publicadas se presentan en orden cronológico con título, fecha y resumen.
- Al seleccionar una noticia puedo leer su contenido completo y regresar al listado.
- El contenido enriquecido se presenta sin ejecutar scripts ni atributos inseguros.

### HU-PUB-05 — Consultar la agenda cultural

**Como** ciudadano, **quiero** buscar eventos por fecha, categoría y territorio, **para** descubrir actividades musicales relevantes.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- Puedo filtrar los eventos con los criterios disponibles y limpiar los filtros aplicados.
- Cada evento muestra como mínimo nombre, fecha, ubicación y descripción disponible.
- Cuando un evento tiene ubicación geográfica, puedo abrirla en el mapa ecosistémico.
- Cuando el evento contiene la información requerida, puedo añadirlo a mi calendario mediante un archivo compatible.

### HU-PUB-06 — Explorar galerías

**Como** visitante, **quiero** recorrer álbumes de encuentros territoriales, **para** conocer visualmente las actividades del plan.

**Prioridad:** Should · **Entrega:** MVP

**Criterios de aceptación:**

- Puedo consultar el listado de álbumes publicados con su nombre y portada.
- Al abrir un álbum puedo recorrer sus imágenes y consultar la descripción disponible.
- Las imágenes incluyen una alternativa textual o una descripción administrable.

## Épica 2. Mapa ecosistémico

### HU-MAP-01 — Explorar actores y procesos en el mapa

**Como** ciudadano, **quiero** visualizar los procesos musicales georreferenciados, **para** comprender su distribución en Colombia.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- El mapa representa únicamente registros aptos para publicación.
- Los registros se diferencian visualmente por tipo y la leyenda explica cada categoría.
- Al seleccionar un marcador o agrupación puedo acercarme y consultar información pública del registro.

### HU-MAP-02 — Filtrar el mapa territorialmente

**Como** usuario del mapa, **quiero** filtrar por tipo, departamento y municipio, **para** concentrarme en el territorio y los actores que me interesan.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- Al elegir un departamento se habilitan únicamente sus municipios según DIVIPOLA.
- Al cambiar un filtro, el mapa y el conteo de resultados se actualizan de forma coherente.
- Puedo restablecer todos los filtros y volver a la vista nacional.

### HU-MAP-03 — Cambiar la representación geográfica

**Como** investigador o tomador de decisiones, **quiero** alternar entre marcadores, densidad y agregación territorial, **para** analizar patrones del ecosistema musical.

**Prioridad:** Should · **Entrega:** Evolutivo

**Criterios de aceptación:**

- Puedo identificar y cambiar el modo de visualización activo.
- Cada modo utiliza la misma selección de filtros y explica su escala o leyenda.
- El cambio de modo no altera los datos de origen ni expone registros no publicados.

### HU-MAP-04 — Proteger los datos personales en la consulta pública

**Como** titular de datos, **quiero** que mi información privada no aparezca en el mapa público, **para** evitar usos no autorizados.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- La respuesta pública no entrega correos, teléfonos, direcciones exactas ni otros datos restringidos sin autorización.
- El control se aplica en el backend y no depende de ocultar campos en la interfaz.
- Un usuario autorizado solo obtiene datos completos cuando el registro pertenece a su ámbito permitido.

## Épica 3. Acceso y participación del colaborador externo

### HU-EXT-01 — Crear y activar una cuenta

**Como** actor cultural independiente, **quiero** registrarme y activar mi cuenta, **para** gestionar mis procesos culturales.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- El registro solicita los datos mínimos, aceptación del tratamiento de datos y una contraseña válida.
- El sistema impide registrar dos cuentas activas con el mismo correo.
- La cuenta no puede operar como colaborador hasta completar el mecanismo de activación definido.

### HU-EXT-02 — Iniciar y cerrar sesión

**Como** usuario registrado, **quiero** iniciar y cerrar sesión de forma segura, **para** acceder únicamente a mis funciones y datos.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- Con credenciales válidas accedo al portal correspondiente a mi rol.
- Con credenciales inválidas recibo un mensaje comprensible que no revela información sensible.
- Al cerrar sesión se invalida el acceso a las rutas protegidas.

### HU-EXT-03 — Completar mi caracterización

**Como** colaborador externo, **quiero** completar una caracterización guiada, **para** aportar los datos básicos de mi proceso y su territorio.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- El formulario divide la captura en pasos comprensibles e indica el avance.
- Los campos obligatorios y sus errores se identifican antes de avanzar o enviar.
- Departamento y municipio se validan contra el catálogo DIVIPOLA.
- La aceptación de tratamiento de datos queda registrada con fecha y versión del texto aceptado.

### HU-EXT-04 — Ubicar un proceso en el mapa

**Como** colaborador, **quiero** señalar la ubicación arrastrando un marcador, **para** registrar coordenadas sin tener que conocerlas previamente.

**Prioridad:** Should · **Entrega:** MVP

**Criterios de aceptación:**

- El mapa se centra en el territorio seleccionado cuando existe información suficiente.
- Al hacer clic o mover el marcador se actualizan latitud y longitud.
- El sistema valida que las coordenadas tengan formato y rango geográfico válidos.

### HU-EXT-05 — Guardar y continuar un borrador

**Como** colaborador, **quiero** guardar una ficha incompleta, **para** continuarla posteriormente sin perder mi trabajo.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- Puedo guardar una ficha en estado `borrador` sin completar los campos exigidos para envío.
- Al volver a ingresar encuentro el último contenido guardado de mis propios registros.
- Un borrador no aparece en el portal ni en el mapa público.

### HU-EXT-06 — Enviar un registro a revisión

**Como** colaborador, **quiero** enviar una ficha completa al Ministerio, **para** solicitar su validación y publicación.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- El sistema valida todos los campos obligatorios antes del envío.
- Tras confirmar, el estado cambia de `borrador` a `en_revision` y la acción queda registrada.
- Mientras está en revisión no puedo modificar la ficha, salvo que el flujo autorizado indique lo contrario.

### HU-EXT-07 — Corregir ajustes solicitados

**Como** colaborador, **quiero** conocer y corregir las observaciones del revisor, **para** volver a presentar un registro conforme.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- Una ficha en `ajustes_solicitados` muestra las observaciones generales y por campo disponibles.
- Puedo editar los campos habilitados y reenviar el registro a `en_revision`.
- El historial conserva las observaciones y los cambios de estado anteriores.

### HU-EXT-08 — Reclamar un registro histórico

**Como** responsable de un proceso cultural, **quiero** revisar y reclamar una posible coincidencia histórica, **para** actualizarla en vez de crear un duplicado.

**Prioridad:** Should · **Entrega:** Evolutivo

**Criterios de aceptación:**

- Después de definir mi municipio, el sistema puede mostrar registros sin responsable que coincidan territorialmente.
- Puedo previsualizar datos suficientes para reconocer el proceso sin acceder indebidamente a datos personales.
- Al reclamar, el registro queda bloqueado frente a reclamaciones simultáneas y pasa a `reclamacion_en_revision`.
- Puedo ignorar una coincidencia sin eliminarla ni impedir que otro usuario legítimo la reclame.

### HU-EXT-09 — Consultar el estado de mis procesos

**Como** colaborador, **quiero** ver mis registros y su estado, **para** saber qué acciones debo realizar.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- Mi panel lista solo los registros que me pertenecen y muestra su estado actualizado.
- Cada estado ofrece únicamente las acciones permitidas por el flujo editorial.
- Puedo distinguir registros que requieren ajustes de aquellos que están en revisión, publicados o cerrados.

## Épica 4. Portal de entidades aliadas

### HU-ALI-01 — Consultar el tablero de la entidad

**Como** aliado administrador, **quiero** ver indicadores de mi entidad, **para** acompañar su cobertura y actividad territorial.

**Prioridad:** Should · **Entrega:** MVP

**Criterios de aceptación:**

- Los indicadores se calculan únicamente con registros asociados al ámbito autorizado de la entidad.
- El tablero permite identificar totales por estado, tipo de registro y territorio disponibles.
- Los filtros aplicados se reflejan de forma consistente en indicadores y listados.

### HU-ALI-02 — Gestionar registros de la entidad

**Como** aliado editor, **quiero** crear, editar y enviar registros de mi entidad, **para** mantener actualizada su información.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- Puedo crear y editar registros de mi entidad cuando están en `borrador` o `ajustes_solicitados`.
- No puedo consultar ni modificar datos privados de otra entidad.
- Al enviar una ficha completa, su estado cambia a `en_revision`.

### HU-ALI-03 — Consultar como aliado lector

**Como** aliado lector, **quiero** explorar los registros autorizados sin modificarlos, **para** realizar seguimiento institucional.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- Puedo consultar mapa, fichas y datos autorizados de mi entidad.
- La interfaz no ofrece acciones de creación, edición, importación ni envío.
- Una solicitud directa de escritura es rechazada también por el backend.

### HU-ALI-04 — Importar registros en lote

**Como** aliado editor, **quiero** cargar registros mediante una plantilla, **para** incorporar información institucional eficientemente.

**Prioridad:** Should · **Entrega:** MVP

**Criterios de aceptación:**

- Puedo descargar o consultar la plantilla y los campos esperados para el módulo elegido.
- Antes de confirmar, el sistema informa filas válidas, advertencias y errores sin guardar parcialmente datos no confirmados.
- Los registros importados quedan asociados a mi entidad, con trazabilidad de usuario y estado inicial controlado.

### HU-ALI-05 — Exportar información autorizada

**Como** aliado autorizado, **quiero** exportar los registros de mi entidad, **para** analizarlos y apoyar la gestión territorial.

**Prioridad:** Should · **Entrega:** MVP

**Criterios de aceptación:**

- La exportación respeta filtros, alcance de entidad y permisos del usuario.
- Los datos personales solo se incluyen cuando el convenio y el rol conceden acceso.
- El archivo generado identifica la fecha de corte y mantiene encabezados comprensibles.

### HU-ALI-06 — Gestionar usuarios de la entidad

**Como** aliado administrador, **quiero** invitar, activar o desactivar editores y lectores, **para** controlar el equipo de mi organización.

**Prioridad:** Should · **Entrega:** MVP

**Criterios de aceptación:**

- Solo el aliado administrador puede gestionar usuarios de su propia entidad.
- Solo puede asignar roles `aliado_editor` y `aliado_lector`.
- Toda alta, cambio de rol o desactivación queda registrada para auditoría.

## Épica 5. Moderación y calidad

### HU-MOD-01 — Consultar la cola de revisión

**Como** gestor interno, **quiero** ver los registros pendientes de revisión, **para** priorizar la validación ministerial.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- La cola muestra registros en `en_revision` con módulo, territorio, autor y fecha de envío.
- Puedo filtrar y ordenar la cola con los criterios operativos disponibles.
- Al abrir un elemento consulto la ficha completa y su historial relevante.

### HU-MOD-02 — Solicitar ajustes específicos

**Como** gestor interno, **quiero** marcar campos y dejar observaciones, **para** explicar con precisión las correcciones requeridas.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- No puedo solicitar ajustes sin registrar al menos una observación válida.
- Al confirmar, el estado pasa de `en_revision` a `ajustes_solicitados`.
- El autor puede ver las observaciones asociadas y el sistema conserva revisor y fecha.

### HU-MOD-03 — Aprobar o rechazar un registro

**Como** gestor interno, **quiero** aprobar o rechazar una ficha revisada, **para** cerrar su evaluación de calidad.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- Solo un registro en `en_revision` puede pasar a `aprobado` o `rechazado`.
- Un rechazo exige una justificación y no expone el registro en el portal público.
- Cada decisión registra usuario, fecha, estado anterior, estado nuevo y comentario.

### HU-MOD-04 — Detectar posibles duplicados

**Como** gestor interno, **quiero** consultar alertas de calidad y coincidencias, **para** evitar registros duplicados o inconsistentes.

**Prioridad:** Should · **Entrega:** Evolutivo

**Criterios de aceptación:**

- El sistema puede señalar coincidencias por nombre, territorio u otros criterios definidos sin fusionarlas automáticamente.
- Puedo comparar los registros relacionados antes de decidir.
- La resolución de una alerta queda trazada y no elimina información sin una acción autorizada.

## Épica 6. Administración integral

### HU-ADM-01 — Acceder según rol

**Como** usuario administrativo, **quiero** ver únicamente los módulos y acciones de mi rol, **para** operar de forma segura y enfocada.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- El gestor interno no accede a usuarios globales, textos del sitio, auditoría técnica ni configuración de sistema reservada.
- El webmaster puede acceder a la administración integral.
- Ocultar una opción en la interfaz no sustituye la autorización del backend.

### HU-ADM-02 — Administrar registros por módulo

**Como** administrador autorizado, **quiero** crear, consultar y actualizar registros de los módulos habilitados, **para** mantener la base operativa de la plataforma.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- Cada módulo presenta los campos, validaciones y catálogos correspondientes a su tipo de información.
- Las operaciones muestran confirmación de éxito o un error recuperable sin perder silenciosamente los cambios.
- Toda modificación conserva autoría, fecha y estado editorial.

### HU-ADM-03 — Publicar y archivar contenido

**Como** webmaster, **quiero** publicar registros aprobados y archivar registros publicados, **para** controlar su visibilidad pública.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- Solo un registro `aprobado` puede pasar a `publicado`.
- Solo un registro `publicado` puede pasar a `archivado`.
- El portal público refleja el cambio sin incluir estados no publicables.

### HU-ADM-04 — Gestionar agenda, noticias, galería y editorial

**Como** administrador de contenidos, **quiero** mantener los contenidos de comunicaciones, **para** actualizar el portal sin modificar el código.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- Puedo crear y editar los metadatos y recursos requeridos por cada módulo.
- Un contenido no publicado no aparece en las consultas públicas.
- Los archivos y enlaces se validan antes de quedar disponibles al público.

### HU-ADM-05 — Editar textos del sitio

**Como** webmaster, **quiero** modificar textos configurables y previsualizarlos, **para** actualizar mensajes institucionales sin despliegues de código.

**Prioridad:** Should · **Entrega:** MVP

**Criterios de aceptación:**

- Los textos se organizan por sección y clave única.
- Puedo previsualizar el resultado antes de guardar cuando el componente lo soporte.
- Al guardar, el valor queda disponible para el portal y el cambio se registra.
- Solo el webmaster puede modificar textos globales.

### HU-ADM-06 — Administrar usuarios internos

**Como** webmaster, **quiero** crear, invitar, suspender y asignar roles internos, **para** controlar el acceso administrativo.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- Solo el webmaster puede gestionar cuentas `webmaster` y `gestor_interno`.
- No se puede asignar un rol inexistente o incompatible con el tipo de cuenta.
- Los cambios de acceso se aplican en el backend y quedan auditados.

### HU-ADM-07 — Consultar auditoría y estado del sistema

**Como** webmaster, **quiero** consultar eventos de auditoría y señales operativas, **para** investigar cambios y fallos de la plataforma.

**Prioridad:** Should · **Entrega:** MVP

**Criterios de aceptación:**

- Puedo filtrar eventos por usuario, fecha, módulo, registro o tipo de acción disponible.
- Los eventos de auditoría no pueden ser alterados desde la interfaz ordinaria.
- Los datos sensibles se omiten o protegen según su clasificación.

### HU-ADM-08 — Recibir notificaciones de flujo

**Como** usuario participante o revisor, **quiero** recibir avisos sobre cambios relevantes, **para** atender oportunamente revisiones y correcciones.

**Prioridad:** Could · **Entrega:** Evolutivo

**Criterios de aceptación:**

- El sistema genera una notificación al enviar a revisión, solicitar ajustes, aprobar, rechazar o publicar.
- Cada usuario recibe únicamente notificaciones relacionadas con sus registros o responsabilidades.
- Puedo distinguir notificaciones leídas y pendientes; canales externos requieren configuración y consentimiento aplicables.

## Épica 7. Requisitos transversales

### HU-NFR-01 — Usar la web con tecnologías de asistencia

**Como** persona con discapacidad, **quiero** navegar y operar la plataforma con teclado y lector de pantalla, **para** acceder al servicio en igualdad de condiciones.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- Las funciones esenciales son operables con teclado y el foco visible sigue un orden lógico.
- Controles, formularios, estados y errores tienen nombre y relación semántica accesible.
- El contenido mantiene contraste suficiente y no depende solo del color para comunicar significado.
- El objetivo de conformidad es WCAG 2.1 nivel AA.

### HU-NFR-02 — Mantener seguridad y privacidad

**Como** usuario de la plataforma, **quiero** que mis datos y acciones estén protegidos, **para** confiar en el servicio.

**Prioridad:** Must · **Entrega:** MVP

**Criterios de aceptación:**

- Toda ruta y operación protegida valida sesión, rol, propiedad y ámbito de entidad en el backend.
- Las entradas se validan y el contenido enriquecido se sanitiza antes de representarse.
- Las respuestas y registros técnicos no exponen contraseñas, secretos ni datos personales innecesarios.
- Las acciones sensibles relevantes generan evidencia de auditoría.

### HU-NFR-03 — Recuperarse de fallos de red

**Como** usuario que diligencia información, **quiero** recibir estados claros y conservar mi trabajo ante fallos recuperables, **para** evitar repetir la captura.

**Prioridad:** Should · **Entrega:** MVP

**Criterios de aceptación:**

- Toda consulta remota diferencia carga, vacío, éxito y error.
- Ante un fallo recuperable puedo reintentar sin recargar toda la aplicación.
- Los formularios extensos advierten sobre cambios no guardados o conservan un borrador seguro cuando esté habilitado.
- Un reintento no crea duplicados cuando la primera respuesta fue incierta.

### HU-NFR-04 — Mantener desempeño y compatibilidad

**Como** visitante, **quiero** que las páginas y el mapa respondan con fluidez, **para** consultar la plataforma incluso en conexiones limitadas.

**Prioridad:** Should · **Entrega:** MVP

**Criterios de aceptación:**

- Las páginas no bloquean toda la interfaz mientras cargan recursos remotos.
- Imágenes, listados y capas geográficas evitan transferir elementos innecesarios para la vista actual.
- La experiencia esencial funciona en las versiones soportadas de navegadores modernos y en resoluciones móviles y de escritorio.

## 4. Orden sugerido de implementación

1. Seguridad, autenticación, roles y catálogos territoriales.
2. Portal público y módulos de contenido.
3. Mapa público con protección de datos.
4. Captura, borradores y ciclo de revisión.
5. Portal aliado y administración por entidad.
6. CMS, importación/exportación, auditoría y endurecimiento transversal.
7. Evolutivos: reclamaciones, análisis geográfico avanzado, duplicados y notificaciones multicanal.

## 5. Definición de terminado común

Una historia se considera terminada cuando cumple sus criterios de aceptación, tiene controles de autorización en backend cuando aplican, contempla estados de carga/error/vacío, cuenta con pruebas proporcionales al riesgo, no introduce fallos de accesibilidad críticos y su comportamiento relevante queda documentado.
