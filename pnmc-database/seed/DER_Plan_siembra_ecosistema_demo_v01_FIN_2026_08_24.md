# Plan de siembra demostrativa del Ecosistema Musical

- **Versión:** v02
- **Estado:** FIN
- **Fecha:** 2026-08-24
- **Deriva de:** auditoría del modelo local y solicitud de siembra demostrativa.
- **Fuentes:** catálogos y esquema vigentes de SIMUS; fuentes públicas enlazadas abajo.
- **Destinatario:** equipo funcional y técnico de SIMUS.

## Propósito

Construir una muestra local, reproducible y reversible para evaluar exploración,
filtros, fichas, mapa y relaciones entre procesos. No representa un registro oficial
del Ministerio ni acredita titularidad, contacto o programación de las organizaciones
referenciadas.

## Resultado de la auditoría

| Módulo | Modelo disponible | Muestra piloto |
|---|---|---:|
| Festivales | Identidad, organización, estado, versión pública vigente y catálogos versionados | 5 |
| Escuelas de música | Directorio, territorio, responsable textual y relaciones comunes | 5 |
| Mercados musicales | Directorio, territorio, relación con Festival y relaciones comunes | 3 |
| Organizaciones | Entidad, relación con registro fuente y administración | 7 |
| Agenda | Evento, territorio y vínculo opcional a Festival | 6 |
| Noticias | Contenido editorial breve con categoría y URL de fuente | 5 |
| Editorial | Catálogo bibliográfico/editorial independiente | 5 |
| Escenarios | Persistencia disponible, sin directorio público consolidado | No en piloto |
| Agrupaciones y agentes | Sin modelo público consolidado | No en piloto |

Los datos amplios anteriores usan un script destructivo y Festivales sin
`VersionesFestival` vigentes. Por ello no se reutilizan como base para evaluar el
gobierno actual de Festival.

## Catálogos maestros

La semilla solo consulta valores ya existentes por `Slug`. No crea, modifica ni borra
Prácticas Musicales ni Territorios Sonoros.

- **Prácticas Musicales:** se emplean referencias existentes de músicas comunitarias,
  tradicionales y patrimoniales, afrocolombianas, urbanas, vocales y académicas.
- **Territorios Sonoros:** se emplean únicamente valores existentes como Rajaleña y
  Cucamba, Marimba, Comunidades Académicas y Músicas Urbanas, Alternativas e
  Independientes.

La asociación a estos catálogos es una clasificación demostrativa para probar filtros;
no es una caracterización oficial de los procesos referidos.

## Estrategia territorial

La muestra concentra registros en Ibagué, Medellín, Santiago de Cali, Ginebra,
Valledupar y Bogotá D. C. Estos municipios están presentes en el DIVIPOLA local y
permiten verificar tanto concentración territorial como filtros por departamento y
municipio.

## Referencias públicas verificadas

Los nombres, municipios y descripciones generales parten de fuentes públicas. Los
campos que el modelo exige pero que las fuentes no definen —por ejemplo, clasificación
en catálogos SIMUS, cobertura, métricas de escuela y contenidos narrativos— son datos
demostrativos originales.

- [Festival de Música Andina Colombiana Mono Núñez — Funmúsica](https://funmusica.org/mono-nunez/)
- [Festival de la Leyenda Vallenata — Fundación Festival de la Leyenda Vallenata](https://festivalvallenato.com/que-es/)
- [Festival Petronio Álvarez — Alcaldía de Santiago de Cali](https://www.cali.gov.co/publicaciones/festival_petronio_lvarez_pub)
- [Festival de Música Colombiana — Alcaldía de Ibagué](https://ibague.gov.co/portal/noticias/21871-entre-homenajes-y-grandes-conciertos-se-vivio-la-edicion-40-del-festival-de-musi)
- [Festival Folclórico Colombiano — sitio del Festival](https://www.festivalfolcloricocolombiano.com.co/festival-folclorico-2025/)
- [Red de Músicas de Medellín — Alcaldía de Medellín](https://www.medellin.gov.co/es/secretaria-cultura-ciudadana/red-de-practicas-artisticas-y-culturales/red-de-musicas-de-medellin/)
- [BOmm — Bogotá Music Market](https://bogota.gov.co/que-hacer/cultura/bogota-music-market-bomm-de-la-camara-de-comercio-de-bogota)
- [Circulart](https://circulart.org/2026/que-es-circulart/)
- [Mercado Musical del Pacífico — Ministerio de las Culturas](https://celebralamusica.mincultura.gov.co/Paginas/noticias/noticia7.aspx)

## Estrategia técnica

`V20260824_02__muestra_piloto_ecosistema_demo.sql` es aditiva e idempotente. Crea la
tabla técnica `SemillasDatosDemo` para identificar los registros insertados sin alterar
el modelo de dominio. Nunca elimina ni actualiza un registro existente.

`V20260824_03__reversion_muestra_piloto_ecosistema_demo.sql` elimina únicamente los
registros rastreados bajo el código de esta siembra, respetando el orden de relaciones.
Ambos scripts son exclusivamente para ambientes locales o de demostración, nunca para
producción.

## Validación prevista

1. Ejecutar la siembra en la base local.
2. Comprobar versiones vigentes y relaciones M:N de Festival.
3. Consultar API de Festivales, Escuelas y Mercados.
4. Verificar filtros territoriales y de catálogos, fichas y mapa.
5. Ejecutar la reversión en una copia local y reconciliar conteos.

## Resultado de la muestra piloto

La muestra se aplicó sobre `PNMC_LOCAL`, se ejecutó una segunda vez sin duplicar
registros, se revirtió completamente y se aplicó de nuevo. El entorno quedó poblado
con:

- 7 organizaciones demostrativas;
- 5 Festivales publicados, cada uno con una `VersionesFestival` vigente;
- 5 Escuelas de música;
- 3 Mercados musicales;
- 6 eventos de Agenda;
- 5 Noticias y 5 recursos de Editorial;
- 13 registros de lectura común con relaciones a catálogos existentes.

Los catálogos permanecieron con 16 Prácticas Musicales y 14 Territorios Sonoros.

La consulta pública de Festivales respondió correctamente después de la carga. Las
pruebas API (49), la compilación .NET y el build Angular también finalizaron sin
errores. Las advertencias preexistentes de Angular y de `SQLitePCLRaw.lib.e_sqlite3`
no forman parte de esta siembra.

## Alcance pendiente

Esta es una muestra piloto, no el escalado a treinta registros por módulo. Antes de
escalar se debe revisar visualmente la experiencia y decidir si los módulos que aún no
tienen directorio público consolidado —Escenarios, Agrupaciones y Agentes— requieren
primero trabajo de modelo o de interfaz.

## Cambios que deben reflejarse en la matriz y el documento funcional

1. **Datos demostrativos trazables:** SIMUS necesita distinguir técnicamente las
   siembras locales de los registros institucionales. La marca se resuelve mediante
   rastreo técnico y no se presenta como acreditación pública.
2. **Catálogos maestros:** Prácticas Musicales y Territorios Sonoros se consumen por
   referencia estable; su modificación o ampliación requiere una decisión de gobierno
   de datos distinta a cualquier siembra.
3. **Relaciones comunes:** la lectura de relaciones debe usar el código del tipo de
   registro, no identificadores numéricos de una tabla. Así los filtros permanecen
   estables ante cambios de orden o de ambientes.
4. **Alcance por módulo:** Escenarios, Agrupaciones y Agentes no pasan todavía a una
   siembra amplia porque no cuentan con el mismo directorio público consolidado de
   Festivales, Escuelas y Mercados.
5. **Arquitectura pública de información:** la navegación principal distingue entre
   directorios disponibles, rutas próximas y modelos internos. Agrupaciones y Agentes
   permanecen en el modelo, pero se retiran de la navegación pública principal hasta
   que cuenten con una experiencia de consulta consolidada.
6. **Puerta de entrada:** `/ecosistema-musical` se consolida como guía pública del
   Sistema de Información de la Música: explica el alcance de SIMUS y articula los
   recorridos por directorios, mapa, agenda y contenidos sin duplicar accesos de
   gestión en la apertura.

## Registro de versiones

| Versión | Estado | Fecha | Cambio |
|---|---|---|---|
| v01 | FIN | 2026-08-24 | Auditoría, diseño, aplicación y reversión validada de la muestra piloto. |
| v02 | FIN | 2026-08-24 | Consolidación de navegación pública y decisiones de arquitectura de información asociadas a la muestra. |
