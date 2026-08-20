# Respaldo y restauración

Procedimiento de respaldo y restauración de SIMUS: qué se respalda, con qué periodicidad, cómo se verifica y cómo se restaura.

## Respaldo y restauración de SIMUS

> Este procedimiento prepara un ensayo institucional. No certifica un respaldo existente ni autoriza una operación sobre producción.

### 1. Alcance de respaldo

Antes de una migración, normalización de históricos o despliegue se debe respaldar, como mínimo:

- base SQL Server completa, incluidos datos, esquema, índices y metadatos;
- artefacto de despliegue y versión Git que se pretende instalar;
- configuración no secreta necesaria para reproducir el entorno;
- inventario de variables y secretos bajo custodia institucional, sin copiarlos en esta documentación;
- conteos de control de `Festivales`, `VersionesFestival`, propuestas, relaciones M:N y auditoría.

La modalidad concreta de respaldo —SQL Server nativo, servicio administrado o política de la infraestructura institucional— queda **TBC** con infraestructura. Debe permitir restaurar una copia aislada y conservar el punto temporal inmediatamente anterior a la intervención.

### 2. Procedimiento previo obligatorio

1. Designar responsable técnico, responsable de datos y responsable de autorización institucional.
2. Registrar versión de la aplicación, hash del commit, scripts/cambios de esquema y ventana de intervención.
3. Ejecutar el diagnóstico institucional de normalización de Festivales históricos y guardar su resultado como evidencia.
4. Obtener respaldo verificable de la base productiva y registrar identificador, fecha y responsable.
5. Restaurar el respaldo en una copia aislada sin conexión a servicios ciudadanos ni envío de comunicaciones reales.
6. Verificar que la copia contiene los conteos de control definidos y que la aplicación puede conectarse a ella con configuración de ensayo.

### 3. Ensayo de migración o normalización

En la copia restaurada:

1. aplicar los cambios de esquema en el orden del documento `02-ensayo-migraciones-festival.md`;
2. ejecutar el diagnóstico de históricos; no escribir todavía;
3. ejecutar la normalización institucional solo tras autorización del ensayo;
4. reconciliar conteos: candidatos, versiones vigentes creadas, relaciones de Prácticas Musicales, relaciones de Territorios Sonoros y eventos de auditoría;
5. comprobar ficha, listado, mapa y analítica de una muestra de Festivales antes/después;
6. volver a ejecutar la normalización y confirmar idempotencia;
7. documentar duración, errores, exclusiones y plan de reversión.

### 4. Restauración y verificación

Una restauración exitosa exige:

- que SQL Server complete la operación sin errores;
- que los conteos críticos coincidan con el respaldo seleccionado;
- que el circuito Festival pueda consultarse en la copia restaurada;
- que las credenciales y datos de prueba usados no apunten a producción;
- que se conserve evidencia de fecha, responsable, origen y resultado.

Si falla la migración o la normalización durante una ventana productiva, se debe detener el despliegue y restaurar el punto previo según la política institucional. La reversión de código no reemplaza una restauración de datos.

### 5. Responsabilidades y condiciones pendientes

| Elemento | Estado |
|---|---|
| Procedimiento documental | PREPARADO |
| Método concreto de backup SQL Server | REQUIERE ENTORNO INSTITUCIONAL |
| Ensayo de restauración sobre copia representativa | REQUIERE ENTORNO INSTITUCIONAL |
| Responsables y ventana operativa | REQUIERE DECISIÓN INSTITUCIONAL |
| Ejecución productiva | FUERA DE ALCANCE |
