# Propuesta de piloto de organizaciones

> **No aprobada.** Se conserva como antecedente de las decisiones de alcance. El piloto que se ejecutó fue el del circuito Festival.

## Piloto funcional de organizaciones

> **PROPUESTA PRELIMINAR — NO APROBADA.** Se conserva como antecedente; debe leerse junto con `diagnostico/` antes de tomar decisiones.

Versión: v01  
Estado: REV  
Fecha: 2026-08-18  
Autor: Codex  
Deriva de: auditoría SIMUS v0.0 y objetivo de piloto  
Fuentes: línea base; modelo de producto preliminar.  
Destinatario: equipo de producto y técnico.

### Alcance recomendado

El piloto debe comprobar un flujo completo y persistido, no cuatro pantallas aisladas. Se inicia con un único tipo de proceso —recomiendo festival, porque ya existe catálogo y soporte en API— y se deja preparada la extensión a escuela, mercado y taller sin forzar los mismos campos.

### Historias mínimas

| ID | Historia | Estado actual |
|---|---|---|
| HU-E01-001 | Como organización quiero registrar y verificar mi cuenta para acceder de forma segura. | API parcial; UI TBC. |
| HU-E02-001 | Como usuario verificado quiero crear o completar el perfil de mi organización. | Requiere diseño e implementación. |
| HU-E02-002 | Como organización quiero acceder a un panel propio, separado de administración. | Requiere rutas, layout y guard. |
| HU-E03-001 | Como organización quiero crear y editar un festival vinculado a mi organización. | API/catálogo parcial; UI requiere slice. |
| HU-E06-001 | Como organización quiero ver candidatos históricos explicados por señales de coincidencia. | Requiere servicio y UX; no simular automatización como resultado definitivo. |
| HU-E06-002 | Como organización quiero solicitar el vínculo de un registro aportando evidencia. | Endpoint disponible; UI y alcance por organización requieren integración. |
| HU-E06-003 | Como administrador quiero revisar y decidir una solicitud de vínculo. | API disponible; consolidar UI y auditoría. |

### Datos de prueba controlados

Preparar únicamente datos sintéticos con: coincidencia exacta, coincidencia parcial, ausencia, duplicado, solicitud pendiente, solicitud aprobada y registro ya vinculado. Cada registro debe indicar que es de prueba, fuente sintética y fecha de creación. No mezclar datos institucionales reales en este piloto sin autorización y reglas de tratamiento.

### Orden de cortes verticales

1. Ruta, sesión y perfil de organización.
2. Festival administrado por la organización.
3. Registros históricos y visualización de candidatos.
4. Solicitud y revisión de vínculo.
5. Trazabilidad, pruebas de permisos y evaluación.

### Criterios de salida

La organización no accede a administración; un usuario sin sesión no accede al panel; cada escritura queda asociada a usuario/organización; la aprobación solo la realiza el rol autorizado; un registro vinculado no se duplica. Se validará con API y pruebas de navegación antes de extender tipos de proceso.
