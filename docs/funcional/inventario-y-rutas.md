# Inventario funcional y mapa de rutas

Qué hace hoy la plataforma, para qué usuarios, en qué estado de implementación y sobre qué
rutas. Es el inventario de referencia para decidir qué se reutiliza y qué se rehace.

## Inventario funcional

| Función | Usuarios | Estado observado | Dependencias y límites |
|---|---|---|---|
| Contenidos PNMC | ciudadanía | Implementado en web pública | Datos de configuración y endpoints de contenido. |
| Noticias, agenda, editorial, galería | ciudadanía | Implementado | API pública; algunos estados vacíos y fallback deben validarse en ejecución. |
| Mapa ecosistémico | ciudadanía | Implementado | Leaflet, TopoJSON, catálogos y datos territoriales; depende de datos disponibles. |
| Catálogo SIMUS y escuelas | ciudadanía | Parcial | Escuela tiene listado/ficha; otros tipos caen en página de próxima disponibilidad. |
| Participación | ciudadanía | API implementada; UI debe confirmarse por caso | Solicitudes y compatibilidad heredada. |
| Registro externo | persona u organización | API implementada | Valida correo, territorio DIVIPOLA, contraseña y consentimientos; no se encontró ruta o página Angular pública para ese flujo. |
| Administración de contenidos y registros | roles internos | Parcialmente implementado | Shell único, paneles, importación XLSX/CSV y fallbacks mock. |
| Aliados/colaboradores | aliados | Parcial | API de aliados y dashboard dentro del mismo shell de administración. |
| Vínculos, duplicados y calidad | usuarios autenticados y revisores | API implementada; UI parcial/mock | Solicitudes con revisión humana; no se verificó motor automático de coincidencias. |
| IA de apoyo | administración | Prototipo local | Panel de carga, mapeo y observaciones; no debe considerarse decisión automatizada ni capacidad productiva validada. |

### Datos mock identificados

El shell administrativo, el dashboard externo, el panel de gobernanza y la importación contienen arreglos locales o rutas de fallback. Esto es útil para demostración, pero impide afirmar que el flujo completo persiste, tiene auditoría o refleja permisos reales hasta probarlo contra una base configurada.

### Interfaz y sistema visual

La aplicación ya tiene patrones compartidos para hero, contenedores, etiquetas y estados remotos. `styles.css` define variables globales y fuentes, pero se observan colores, tamaños, utilidades Tailwind y estilos específicos repetidos entre pantallas. El bloque público es editorial y visual; el bloque administrativo usa tablas, formularios y consola. La distinción de propósito es adecuada, pero ambos dependen de convenciones no formalizadas: aún no existe un inventario de tokens para color, tipografía, espaciado, elevación, estados, formularios o tablas. La migración debe comenzar con esos tokens y componentes base, no con una reescritura visual de todas las páginas.

### Herramientas de importación

El frontend procesa carga masiva y mapea encabezados, campos importables y claves de posible duplicado; luego llama a `/admin/data/records/{moduleId}/bulk`. La API posee altas administrativas y estructuras para vínculos, duplicados y alertas de calidad. Los scripts SQL aportan validaciones y semillas. No se encontró, en el alcance auditado, un flujo completo documentado de reversión por lote ni metadatos obligatorios de archivo/fuente/responsable para cada importación; queda como brecha a confirmar.

## Mapa de rutas actual

| URL | Página | Tipo de usuario | Protección | Propósito |
|---|---|---|---|---|
| `/`, `/pnmc`, `/ejes`, `/ejes/componentes/:componentId` | Inicio y contenidos PNMC | Público | Ninguna | Presentación del Plan y contenidos. |
| `/noticias`, `/noticias/:articleId`, `/agenda`, `/editorial`, `/galeria` | Módulos de contenido | Público | Ninguna | Consulta pública. |
| `/mapa` | Mapa ecosistémico | Público | Ninguna | Exploración territorial. |
| `/simus`, `/simus/escuelas`, `/simus/escuelas/:schoolId` | SIMUS y escuelas | Público | Ninguna | Catálogo SIMUS. |
| `/simus/:section` | Próximamente | Público | Ninguna | Captura secciones SIMUS no implementadas. |
| `/estrategia/circulacion`, `/estrategia/investigacion` | Estrategia | Público | Ninguna | Contenido temático. |
| `/admin` | `AdminShellPageComponent` | Administración | Ninguna en router | Consola completa, login incluido. |
| `/colaboradores` | `AdminShellPageComponent` | Colaboradores | Ninguna en router | Mismo shell y componente que administración. |
| `/ecosistema/*`, `/home`, `/mapa/participa` | Redirecciones | Público | Ninguna | Compatibilidad de enlaces. |
| `/**` | No encontrado | Público | Ninguna | Error 404. |

### Ambigüedades y mezcla

No hay rutas frontend para `/login`, `/registro`, `/organizacion` ni un área de organización separada. `authGuard` existe, pero no está conectado a ninguna ruta y permite navegar cuando la sesión es nula. `/admin` y `/colaboradores` cargan el mismo componente. El parámetro comodín `/simus/:section` puede ocultar rutas futuras si se añade un segmento sin definir explícitamente.
