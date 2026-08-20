# PORTAL PÚBLICO Y SISTEMA DE ADMINISTRACIÓN DE CONTENIDO (CMS)

Este sub-documento detalla los componentes del **Portal Público** de la ciudadanía y el funcionamiento del **CMS de Textos Dinámicos** que permite actualizar los copies principales de la web sin necesidad de escribir código.

---

## 1. EL MOTOR DEL CMS DE TEXTOS DINÁMICOS (`WebTexts`)

Para evitar textos rígidos quemados (*hardcoded*) en el frontend, el PNMC cuenta con un motor CMS centralizado. Este sistema lee una tabla de la base de datos llamada `WebTexts` que mapea llaves únicas a valores textuales y los inyecta dinámicamente en los componentes de la interfaz pública.

### 1.1 Estructura Clave-Valor del CMS
Los textos se catalogan en la base de datos mediante la siguiente convención:

```
[Módulo / Página] ──► [Llave Única de Texto] ──► [Valor Textual Dinámico]
```

* **Ejemplo**: Llave `nav.aboutUs` ──► Valor `"Sobre el PNMC"`
* **Ejemplo**: Llave `home.hero.title` ──► Valor `"La música es motor de vida, paz y justicia social"`

### 1.2 Interfaz de Edición del Webmaster (`/admin`)
El panel de "Administración de Textos" ofrece:
* **Filtros por Secciones**: Organización limpia por pestañas (Home, Navegación, Ejes, Agenda/Galería).
* **Campos Editables en Vivo**: Cajas de texto enriquecido y entradas de texto tradicionales.
* **Previsualización de Alta Fidelidad (HiFi)**: Una maqueta a escala en tiempo real integrada en el panel que simula exactamente cómo se verá el banner superior de navegación o la tarjeta estática en el portal público tras guardar los cambios.

---

## 2. DESCRIPCIÓN FUNCIONAL DE LAS PÁGINAS PÚBLICAS

La web orientada a la ciudadanía cuenta con los siguientes módulos de consulta interactiva:

### 2.1 Home (Página de Inicio)
* **Hero Banner**: Mensaje estratégico configurable por el CMS con un enlace directo a la sección de "Participación".
* **Estrategias del PNMC**: Carrusel interactivo que desglosa las **8 Rutas de Acción Territorial** del Plan (ej. Celebra la Música, Territorios Sonoros, Saberes Musicales, etc.). La descripción y el título de cada tarjeta se cargan directamente de la base de datos.

### 2.2 Catálogo Editorial (Biblioteca Digital)
* **Funcionalidad**: Buscador de libros, metodologías formativas y cartillas de partituras publicadas por el Ministerio.
* **Filtros Avanzados**: Permite clasificar la búsqueda por Eje Estratégico, Año de publicación y Sección.
* **Descarga Segura**: Enlace directo para abrir o descargar archivos en formato PDF almacenados en el servidor o en depósitos de Azure Blobs.

### 2.3 Agenda y Eventos Culturales
* **Funcionalidad**: Calendario nacional que consolida festivales y conciertos.
* **Filtros de Búsqueda**: Permite buscar eventos por rango de fechas, categoría musical y municipio DIVIPOLA.
* **Integración del Mapa**: Cada evento dispone de un botón para geolocalizar directamente su ubicación geográfica en el Mapa Ecosistémico.

### 2.4 Módulo de Noticias y Boletines
* **Funcionalidad**: Listado ordenado cronológicamente con comunicados de prensa y crónicas territoriales.
* **Render Seguro**: El frontend interpreta el HTML enriquecido del backend a través de un parseador seguro que sanitiza enlaces, scripts inseguros e imágenes para proteger al visitante.

### 2.5 Galería de Encuentros Territoriales
* **Funcionalidad**: Álbumes fotográficos interactivos con imágenes de los encuentros de música tradicional.
* **Gestión CMS**: El Webmaster puede dar de alta nuevos álbumes, cargar descripciones y asociar carruseles fotográficos de manera rápida.

---

## 3. NOMENCLATURA DE BANNERS / HEROES

El portal público utiliza distintos tratamientos de banner superior según la jerarquía de la página. Esta nomenclatura se usa como vocabulario compartido de diseño y desarrollo; no corresponde a variantes formales del componente `app-page-hero` salvo donde se indica.

| Nombre | Dónde vive | Descripción |
|---|---|---|
| **Hero Home** | `/` (Home) | `app-page-hero` en modo `fullScreen`: imagen ampliada (`scale-124%`), ocupa la pantalla completa, incluye 2 CTAs. Único en todo el sitio. |
| **PageHero Nivel 1** (estándar) | Sobre el PNMC, Ejes, Noticias, Agenda, Editorial, Galería, Escuelas, Ficha de escuela, Ecosistema, SIMUS, páginas "próximamente" | Forma normal (no `fullScreen`) de `app-page-hero`: imagen en grayscale + overlay morado, tag/eyebrow, título con acento verde en cursiva, descripción, botón "Volver" opcional, slots `[buttons]`/`[visual]` opcionales. |
| **PageHero Nivel 2** | Ficha de componente (`/ejes/componentes/:id`) | Hero personalizado, plano y compacto: sin imagen de fondo ni degradado. Solo link "Volver", título del componente y etiqueta sutil del eje debajo. |
| **PageHero Nivel 3** | Estrategias (`/estrategia/circulacion`, `/estrategia/investigacion`) | Hero personalizado de gran altura (`min-h-78vh`): imagen de fondo con degradado horizontal, contenido centrado verticalmente, título de gran tamaño, CTA inline, sin botón "Volver". |

Quedan fuera de esta escala: la página **404** (hero propio de página completa, sin imagen) y las páginas **sin banner** (Mapa Ecosistémico, Admin/Colaboradores).
