import { 
  Component, 
  OnInit, 
  OnDestroy, 
  AfterViewInit, 
  inject, 
  signal, 
  computed, 
  effect, 
  ElementRef,
  ViewChild,
  PLATFORM_ID,
  HostListener
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideArrowRight, 
  LucideBarChart3, 
  LucideCircleHelp, 
  LucideDatabase, 
  LucideDownload, 
  LucideEye, 
  LucideFileDown, 
  LucideFilter, 
  LucideInfo, 
  LucideLayers3, 
  LucideLoader2, 
  LucideMail, 
  LucideMapPin, 
  LucidePrinter, 
  LucideRotateCcw, 
  LucideSearch, 
  LucideX, 
  LucideGlobe, 
  LucidePlus, 
  LucideCompass, 
  LucideZoomIn, 
  LucideZoomOut 
} from '@lucide/angular';
import { MapDataService } from '../../../../core/services/map-data.service';
import { NavigationService, PAGE_IDS } from '../../../../core/services/navigation.service';
import { WebTextsService } from '../../../../core/services/web-texts.service';
import * as MapDomain from '../../domain/map-domain';
import * as L from 'leaflet';
import 'leaflet.markercluster';

// Configuración y objetos de mapeo del dominio.
import { MAP_LAYERS_CONFIG, MAP_PANEL_IDS } from '../../config/mapLayersConfig';
import { ECOSYSTEM_LAYERS, WORLD_COUNTRY_LABELS, countryLabelIcon } from '../../domain/mapLayers';

const TERRITORIO_MAPPING: Record<string, { depts: any[]; color: string }> = {
  'Cantos, Pitos y Tambores': { depts: [], color: '#bae6fd' },
  'Canta y Torbellino': { depts: [], color: '#ddd6fe' },
  'Rajaleña y Cucamba': { depts: [], color: '#fef08a' },
  'Marimba': { depts: [], color: '#d8b4fe' },
  'Flautas, Cuerdas y Tambores Sureños': { depts: [], color: '#c5f2f5' },
  'Chirimía': { depts: [], color: '#a5f3fc' },
  'Joropo': { depts: [], color: '#fde68a' },
  'Trova y Parranda': { depts: [], color: '#fed7aa' },
  'Amazonas': { depts: [], color: '#bbf7d0' },
  'Insular': { depts: [], color: '#fed7aa' },
  'Prácticas de Pueblos Indígenas': { depts: [], color: '#a7f3d0' },
  'Músicas Urbanas, Alternativas e Independientes - MUAI': { depts: [], color: '#cbd5e1' },
  'Comunidades Académicas': { depts: [], color: '#cbd5e1' },
  'Rrom': { depts: [], color: '#fbcfe8' }
};

const PRACTICA_MAPPING: Record<string, { depts: any[]; color: string }> = {
  'Expresiones sonoras de pueblos originarios': { depts: [], color: '#a7f3d0' },
  'Músicas de comunidades negras, afrocolombianas, raizales y palenqueras': { depts: [], color: '#d8b4fe' },
  'Músicas campesinas, rurales y de raíz territorial': { depts: [], color: '#fed7aa' },
  'Músicas populares tradicionales, regionales y patrimoniales': { depts: [], color: '#bae6fd' },
  'Músicas comunitarias y procesos colectivos de práctica musical': { depts: [], color: '#fde68a' },
  'Músicas de frontera, diásporas, migraciones e interculturalidad': { depts: [], color: '#c5f2f5' },
  'Músicas urbanas, alternativas e independientes': { depts: [], color: '#cbd5e1' },
  'Músicas populares de amplia circulación, tropicales, bailables y comerciales': { depts: [], color: '#fef08a' },
  'Músicas vocales, corales y de tradición cantada': { depts: [], color: '#bae6fd' },
  'Músicas sinfónicas, bandas, orquestas y grandes formatos instrumentales': { depts: [], color: '#ddd6fe' },
  'Bandas de marcha, batucadas, comparsas y colectivos sonoros en movimiento': { depts: [], color: '#fbcfe8' },
  'Músicas académicas, de cámara, contemporáneas, experimentales y de vanguardia': { depts: [], color: '#cbd5e1' },
  'Músicas electrónicas, digitales, producción sonora y nuevas tecnologías': { depts: [], color: '#a5f3fc' },
  'Músicas religiosas, rituales, espirituales y devocionales': { depts: [], color: '#fbcfe8' },
  'Músicas para escena, danza, audiovisual e interdisciplinariedad': { depts: [], color: '#fde68a' },
  'Prácticas sonoras, arte sonoro, archivo, investigación-creación y paisajes sonoros': { depts: [], color: '#fbcfe8' }
};

@Component({
  selector: 'app-mapa-ecosistemico-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideArrowRight,
    LucideBarChart3,
    LucideCircleHelp,
    LucideDatabase,
    LucideDownload,
    LucideEye,
    LucideFileDown,
    LucideFilter,
    LucideInfo,
    LucideLayers3,
    LucideLoader2,
    LucideMail,
    LucideMapPin,
    LucidePrinter,
    LucideRotateCcw,
    LucideSearch,
    LucideX,
    LucideGlobe,
    LucidePlus,
    LucideCompass,
    LucideZoomIn,
    LucideZoomOut
  ],
  templateUrl: './mapa-ecosistemico-page.component.html'
})
export class MapaEcosistemicoPageComponent implements OnInit, OnDestroy, AfterViewInit {
  private mapDataService = inject(MapDataService);
  private navigationService = inject(NavigationService);
  private webTexts = inject(WebTextsService);
  private platformId = inject(PLATFORM_ID);
  protected readonly Boolean = Boolean;

  mapContainer?: ElementRef;

  @ViewChild('mapContainer', { static: false })
  set mapContainerRef(value: ElementRef | undefined) {
    this.mapContainer = value;
    this.mapContainerReady.set(Boolean(value));
  }

  // Map reference
  private map?: L.Map;
  private geoJsonLayer?: L.GeoJSON;
  private hitLayer?: L.GeoJSON;
  private municipalitiesLayer?: L.GeoJSON;
  private archipelagoLayer?: L.GeoJSON;
  private thematicMarkers: L.CircleMarker[] = [];
  private heatMapLayers: L.Circle[] = [];

  // Reactive UI State Signals
  activeCategory = signal<string>('General');
  activePanel = signal<string | null>(null);
  sidebarTab = signal<string>('resumen');
  directoryCategory = signal<string>('Todos');
  directoryQuery = signal<string>('');
  directoryLimit = signal<number>(12);
  selectedDept = signal<string>('Nacional');
  hoveredDepartmentCard = signal<any | null>(null);
  selectedRecordDetail = signal<any | null>(null);
  selectedSonorousTerritory = signal<string>('Todos');
  selectedPractice = signal<string>('Todas');
  visualizationMode = signal<string>('cobertura');
  activeThematicOption = signal<string>('territorio');
  influenceDisplayType = signal<string>('puntos');
  isTutorialOpen = signal<boolean>(false);
  tutorialStep = signal<number>(0);
  mapResetToken = signal<number>(0);
  mapContainerReady = signal<boolean>(false);

  // Raw Data Signals
  geoData = signal<any>(null);
  allMunicipalities = signal<any[]>([]);
  baseDepartmentCounts = signal<any>({});
  festivalRecords = signal<any[]>([]);
  schoolRecords = signal<any[]>([]);
  marketRecords = signal<any[]>([]);
  redesRecords = signal<any[]>([]);
  lutieresRecords = signal<any[]>([]);
  festivalCounts = signal<any>({});
  schoolCounts = signal<any>({});
  marketCounts = signal<any>({});
  redesCounts = signal<any>({});
  lutieresCounts = signal<any>({});
  schoolLayerReady = signal<boolean>(false);
  marketLayerReady = signal<boolean>(false);
  isLoading = signal<boolean>(true);
  mapError = signal<string | null>(null);

  // Opciones estáticas del dominio
  TOOLBAR_ITEMS = [
    { id: MAP_PANEL_IDS.layers, label: 'Capas', iconClass: 'layers-3' },
    { id: MAP_PANEL_IDS.filters, label: 'Filtros', iconClass: 'filter' },
    { id: MAP_PANEL_IDS.insights, label: 'Modos', iconClass: 'eye' },
    { id: MAP_PANEL_IDS.registration, label: 'Ser parte del SIMUS', iconClass: 'plus' },
    { id: MAP_PANEL_IDS.export, label: 'Exportar', iconClass: 'download' },
    { id: MAP_PANEL_IDS.tutorial, label: 'Ayuda', iconClass: 'circle-help' },
  ];

  LAYER_ACCENTS: Record<string, string> = {
    General: '#059669',
    Festivales: '#9333ea',
    'Escuelas de Música': '#0284c7',
    'Mercados Musicales': '#d97706',
    'Redes de Documentación': '#db2777',
    Lutieres: '#0d9488',
  };

  SELECTED_DEPARTMENT_STYLE = {
    fillColor: '#00DA5E',
    fillOpacity: 0.86,
    color: 'rgba(41, 18, 66, 0.9)',
    opacity: 1,
    weight: 2.8,
  };

  MUTED_DEPARTMENT_STYLE = {
    fillColor: '#d8d3df',
    fillOpacity: 0.48,
    color: 'rgba(41, 18, 66, 0.4)',
    opacity: 1,
    weight: 1.2,
  };

  TERRITORIOS_SONOROS_LIST = [
    'Cantos, Pitos y Tambores',
    'Canta y Torbellino',
    'Rajaleña y Cucamba',
    'Marimba',
    'Flautas, Cuerdas y Tambores Sureños',
    'Chirimía',
    'Joropo',
    'Trova y Parranda',
    'Amazonas',
    'Insular',
    'Prácticas de Pueblos Indígenas',
    'Músicas Urbanas, Alternativas e Independientes - MUAI',
    'Comunidades Académicas',
    'Rrom'
  ];

  PRACTICAS_MUSICALES_LIST = [
    'Expresiones sonoras de pueblos originarios',
    'Músicas de comunidades negras, afrocolombianas, raizales y palenqueras',
    'Músicas campesinas, rurales y de raíz territorial',
    'Músicas populares tradicionales, regionales y patrimoniales',
    'Músicas comunitarias y procesos colectivos de práctica musical',
    'Músicas de frontera, diásporas, migraciones e interculturalidad',
    'Músicas urbanas, alternativas e independientes',
    'Músicas populares de amplia circulación, tropicales, bailables y comerciales',
    'Músicas vocales, corales y de tradición cantada',
    'Músicas sinfónicas, bandas, orquestas y grandes formatos instrumentales',
    'Bandas de marcha, batucadas, comparsas y colectivos sonoros en movimiento',
    'Músicas académicas, de cámara, contemporáneas, experimentales y de vanguardia',
    'Músicas electrónicas, digitales, producción sonora y nuevas tecnologías',
    'Músicas religiosas, rituales, espirituales y devocionales',
    'Músicas para escena, danza, audiovisual e interdisciplinariedad',
    'Prácticas sonoras, arte sonoro, archivo, investigación-creación y paisajes sonoros'
  ];

  TUTORIAL_STEPS = [
    {
      title: "Bienvenido al Geovisor Ecosistémico",
      description: "Este recorrido interactivo te guiará paso a paso para que explores los procesos, infraestructuras y la influencia cultural de la música en Colombia de manera profesional.",
      iconClass: 'Globe'
    },
    {
      title: "1. Capas y Registros de Procesos",
      description: "Usa este panel para encender y apagar las capas del ecosistema: Festivales, Escuelas de Música, Mercados, Lutieres y Redes de Documentación.",
      iconClass: 'Layers3'
    },
    {
      title: "2. Filtros de Influencia Regional",
      description: "Refina la visualización en el mapa seleccionando prácticas musicales específicas o territorios sonoros (como la Marimba o los Cantos de comunidades negras).",
      iconClass: 'Filter'
    },
    {
      title: "3. Modo Cobertura (Densidad)",
      description: "Este modo tiñe los departamentos según la cantidad total de procesos registrados, dándote una lectura rápida y comparativa de la densidad nacional de la capa activa.",
      iconClass: 'BarChart3'
    },
    {
      title: "4. Modo Influencia (Puntos y Zonas)",
      description: "Proyecta en el mapa las zonas de influencia directa de las prácticas seleccionadas. Verás círculos en los municipios y departamentos coloreados por predominancia.",
      iconClass: 'MapPin'
    },
    {
      title: "5. Visualización: Mapa de Calor",
      description: "El Mapa de Calor proyecta hermosos halos concéntricos desenfocados que se fusionan en tiempo real para reflejar el flujo y la fuerza de la música colombiana.",
      iconClass: 'Eye'
    },
    {
      title: "6. Resumen y Registros Recientes",
      description: "En el panel derecho puedes alternar entre las pestañas 'Resumen' para ver estadísticas agregadas y 'Registros Recientes' para explorar la lista de procesos locales.",
      iconClass: 'CircleHelp'
    }
  ];

  MAP_LAYERS_CONFIG_REF = MAP_LAYERS_CONFIG;
  MAP_PANEL_IDS_REF = MAP_PANEL_IDS;

  // Computed signals
  departmentsList = computed(() => ['Nacional', ...MapDomain.getSortedDepartmentNames()]);
  selectedNormalized = computed(() => MapDomain.normalizeDepartmentName(this.selectedDept()));
  selectedDepartmentDisplayName = computed(() => this.selectedDept() === 'Nacional' ? 'Nacional' : MapDomain.getDepartmentDisplayName(this.selectedDept()));

  isGeneralLayer = computed(() => this.activeCategory() === 'General');
  isFestivalsLayer = computed(() => this.activeCategory() === 'Festivales');
  isSchoolsLayer = computed(() => this.activeCategory() === 'Escuelas de Música');
  isMarketsLayer = computed(() => this.activeCategory() === 'Mercados Musicales');
  isRedesLayer = computed(() => this.activeCategory() === 'Redes de Documentación');
  isLutieresLayer = computed(() => this.activeCategory() === 'Lutieres');

  activeLayerConfig = computed(() => {
    return MAP_LAYERS_CONFIG.find((layer) => layer.layerKey === this.activeCategory()) || MAP_LAYERS_CONFIG[0];
  });

  festivalRecordsByDepartment = computed(() => {
    const records = this.festivalRecords();
    const selectedSonorousTerritory = this.selectedSonorousTerritory();
    const selectedPractice = this.selectedPractice();
    
    return records.reduce((acc: any, record: any) => {
      const deptRaw = record?.fields?.dpt ?? record?.fields?.dpto ?? record?.fields?.departamento ?? record?.fields?.department;
      const deptName = Array.isArray(deptRaw) ? deptRaw[0] : (deptRaw || 'Desconocido');
      const normalized = MapDomain.normalizeDepartmentName(MapDomain.resolveDepartmentNameFromRecord(record, deptName));
      if (!normalized || normalized === 'DESCONOCIDO') return acc;

      const genre = record?.fields?.género_musical || record?.fields?.genero_musical || '';
      const desc = record?.fields?.descripción || record?.fields?.descripcion || record?.fields?.desc || '';

      // Apply Filters
      if (selectedSonorousTerritory !== 'Todos') {
        const textToCheck = `${genre} ${desc}`;
        if (!MapDomain.matchesSonorousTerritory(selectedSonorousTerritory, textToCheck)) return acc;
      }
      if (selectedPractice !== 'Todas') {
        const textToCheck = `${genre} ${desc}`;
        if (!MapDomain.matchesPracticeMusical(selectedPractice, textToCheck)) return acc;
      }

      if (!acc[normalized]) acc[normalized] = [];
      acc[normalized].push({
        department: MapDomain.resolveDepartmentNameFromRecord(record, deptName),
        departmentCode: MapDomain.normalizeDepartmentCode(record?.fields?.departmentCode || record?.fields?.DepartmentCode || record?.fields?.dpto_ccdgo),
        municipalityCode: MapDomain.normalizeMunicipalityCode(record?.fields?.municipalityCode || record?.fields?.divipola || record?.fields?.mpio_cdpmp),
        name: MapDomain.getFestivalRecordName(record),
        municipality: record?.fields?.municipio || '',
        description: desc,
        genre: genre,
        month: record?.fields?.mes_de_realización || record?.fields?.mes_de_realizacion || '',
        versions: record?.fields?.versiones || '',
        organizer: record?.fields?.organizador || record?.fields?.organizer || record?.fields?.responsable || record?.fields?.entidad_responsable || '',
        contactEmail: record?.fields?.contacto_email || record?.fields?.email || '',
        contactPhone: record?.fields?.contacto_telefono || record?.fields?.telefono || '',
        websiteUrl: record?.fields?.sitio_web || '',
        coverageLevel: record?.fields?.coverageLevel || record?.fields?.cobertura_nivel || '',
        specificLocation: record?.fields?.ubicacion_especifica || '',
        contact: [record?.fields?.contacto_email || record?.fields?.email || '', record?.fields?.contacto_telefono || record?.fields?.telefono || ''].filter(Boolean).join(' · '),
      });
      return acc;
    }, {});
  });

  schoolRecordsByDepartment = computed(() => {
    const records = this.schoolRecords();
    const selectedSonorousTerritory = this.selectedSonorousTerritory();
    const selectedPractice = this.selectedPractice();

    return records.reduce((acc: any, record: any) => {
      const normalized = MapDomain.normalizeDepartmentName(record?.department);
      if (!normalized || normalized === 'DESCONOCIDO') return acc;

      const sonorous = record?.linkedSonorousTerritories || '';
      const practices = record?.practices || '';
      const desc = record?.description || '';

      // Apply Filters
      if (selectedSonorousTerritory !== 'Todos') {
        const textToCheck = `${sonorous} ${practices} ${desc}`;
        if (!MapDomain.matchesSonorousTerritory(selectedSonorousTerritory, textToCheck)) return acc;
      }
      if (selectedPractice !== 'Todas') {
        const textToCheck = `${practices} ${desc}`;
        if (!MapDomain.matchesPracticeMusical(selectedPractice, textToCheck)) return acc;
      }

      if (!acc[normalized]) acc[normalized] = [];
      acc[normalized].push(record);
      return acc;
    }, {});
  });

  marketRecordsByDepartment = computed(() => {
    const records = this.marketRecords();
    const selectedSonorousTerritory = this.selectedSonorousTerritory();
    const selectedPractice = this.selectedPractice();

    return records.reduce((acc: any, record: any) => {
      const normalized = MapDomain.normalizeDepartmentName(record?.department);
      if (!normalized || normalized === 'DESCONOCIDO') return acc;

      const desc = record?.description || '';
      const linked = record?.linkedFestival || '';

      // Apply Filters
      if (selectedSonorousTerritory !== 'Todos') {
        const textToCheck = `${desc} ${linked}`;
        if (!MapDomain.matchesSonorousTerritory(selectedSonorousTerritory, textToCheck)) return acc;
      }
      if (selectedPractice !== 'Todas') {
        const textToCheck = `${desc}`;
        if (!MapDomain.matchesPracticeMusical(selectedPractice, textToCheck)) return acc;
      }

      if (!acc[normalized]) acc[normalized] = [];
      acc[normalized].push(record);
      return acc;
    }, {});
  });

  redesRecordsByDepartment = computed(() => {
    const records = this.redesRecords();
    const selectedSonorousTerritory = this.selectedSonorousTerritory();
    const selectedPractice = this.selectedPractice();

    return records.reduce((acc: any, record: any) => {
      const normalized = MapDomain.normalizeDepartmentName(record?.department);
      if (!normalized || normalized === 'DESCONOCIDO') return acc;

      const sonorous = record?.linkedSonorousTerritories || '';
      const desc = record?.description || '';

      // Apply Filters
      if (selectedSonorousTerritory !== 'Todos') {
        const textToCheck = `${sonorous} ${desc}`;
        if (!MapDomain.matchesSonorousTerritory(selectedSonorousTerritory, textToCheck)) return acc;
      }
      if (selectedPractice !== 'Todas') {
        const textToCheck = `${desc} ${record.centerType}`;
        if (!MapDomain.matchesPracticeMusical(selectedPractice, textToCheck)) return acc;
      }

      if (!acc[normalized]) acc[normalized] = [];
      acc[normalized].push(record);
      return acc;
    }, {});
  });

  lutieresRecordsByDepartment = computed(() => {
    const records = this.lutieresRecords();
    const selectedSonorousTerritory = this.selectedSonorousTerritory();
    const selectedPractice = this.selectedPractice();

    return records.reduce((acc: any, record: any) => {
      const normalized = MapDomain.normalizeDepartmentName(record?.department);
      if (!normalized || normalized === 'DESCONOCIDO') return acc;

      const oficio = record?.oficio || '';
      const desc = record?.description || '';

      // Apply Filters
      if (selectedSonorousTerritory !== 'Todos') {
        const textToCheck = `${oficio} ${desc}`;
        if (!MapDomain.matchesSonorousTerritory(selectedSonorousTerritory, textToCheck)) return acc;
      }
      if (selectedPractice !== 'Todas') {
        const textToCheck = `${oficio} ${desc}`;
        if (!MapDomain.matchesPracticeMusical(selectedPractice, textToCheck)) return acc;
      }

      if (!acc[normalized]) acc[normalized] = [];
      acc[normalized].push(record);
      return acc;
    }, {});
  });

  departmentSummaryByDepartment = computed(() => {
    return MapDomain.buildDepartmentSummaryMap(
      this.baseDepartmentCounts(),
      this.festivalRecordsByDepartment(),
      this.schoolRecordsByDepartment(),
      this.marketRecordsByDepartment(),
      this.redesRecordsByDepartment(),
      this.lutieresRecordsByDepartment()
    );
  });

  generalCounts = computed(() => {
    return Object.entries(this.departmentSummaryByDepartment()).reduce((acc: any, [departmentName, stats]: any) => {
      acc[departmentName] = stats.totalRecords;
      return acc;
    }, {});
  });

  festivalAnalytics = computed(() => MapDomain.buildLayerAnalytics(this.festivalCounts(), this.festivalRecords(), this.selectedDept()));
  schoolAnalytics = computed(() => MapDomain.buildLayerAnalytics(this.schoolCounts(), this.schoolRecords(), this.selectedDept()));
  marketAnalytics = computed(() => MapDomain.buildLayerAnalytics(this.marketCounts(), this.marketRecords(), this.selectedDept()));
  redesAnalytics = computed(() => MapDomain.buildLayerAnalytics(this.redesCounts(), this.redesRecords(), this.selectedDept()));
  lutieresAnalytics = computed(() => MapDomain.buildLayerAnalytics(this.lutieresCounts(), this.lutieresRecords(), this.selectedDept()));
  generalAnalytics = computed(() => MapDomain.buildLayerAnalytics(this.generalCounts(), [], this.selectedDept()));

  activeAnalytics = computed(() => {
    if (this.isGeneralLayer()) return this.generalAnalytics();
    if (this.isSchoolsLayer()) return this.schoolAnalytics();
    if (this.isMarketsLayer()) return this.marketAnalytics();
    if (this.isRedesLayer()) return this.redesAnalytics();
    if (this.isLutieresLayer()) return this.lutieresAnalytics();
    return this.festivalAnalytics();
  });

  activeDepartmentCounts = computed(() => {
    if (this.isGeneralLayer()) return this.generalCounts();
    if (this.isSchoolsLayer()) return this.schoolCounts();
    if (this.isMarketsLayer()) return this.marketCounts();
    if (this.isRedesLayer()) return this.redesCounts();
    if (this.isLutieresLayer()) return this.lutieresCounts();
    return this.festivalCounts();
  });

  thematicPoints = computed(() => {
    const points: any[] = [];
    const activeThematicOption = this.activeThematicOption();
    const selectedSonorousTerritory = this.selectedSonorousTerritory();
    const selectedPractice = this.selectedPractice();

    const allRecords = [
      ...this.festivalRecords().map(r => {
        const deptRaw = r?.fields?.dpt ?? r?.fields?.dpto ?? r?.fields?.departamento ?? r?.fields?.department;
        const deptName = Array.isArray(deptRaw) ? deptRaw[0] : (deptRaw || 'Desconocido');
        return {
          ...r,
          id: r.id || `fest-${Math.random()}`,
          category: 'Festivales',
          name: r.fields?.name || r.fields?.nombre || 'Festival',
          department: MapDomain.resolveDepartmentNameFromRecord(r, deptName),
          description: r.fields?.descripción || r.fields?.descripcion || r.fields?.desc || '',
          linkedSonorousTerritories: r.fields?.['Territorios sonoros'] || r.fields?.género_musical || r.fields?.genero_musical || '',
          practices: r.fields?.['Prácticas musicales'] || r.fields?.género_musical || r.fields?.genero_musical || ''
        };
      }),
      ...this.schoolRecords().map(r => {
        return {
          ...r,
          id: r.id || `school-${Math.random()}`,
          category: 'Escuelas de Música',
          name: r.name || 'Escuela',
          department: r.department || 'Desconocido',
          description: r.description || '',
          linkedSonorousTerritories: r.linkedSonorousTerritories || '',
          practices: r.practices || ''
        };
      }),
      ...this.marketRecords().map(r => {
        return {
          ...r,
          id: r.id || `market-${Math.random()}`,
          category: 'Mercados Musicales',
          name: r.name || 'Mercado',
          department: r.department || 'Desconocido',
          description: r.description || '',
          linkedSonorousTerritories: r.linkedSonorousTerritories || '',
          practices: r.practices || ''
        };
      }),
      ...this.redesRecords().map(r => {
        return {
          ...r,
          id: r.id || `net-${Math.random()}`,
          category: 'Redes de Documentación',
          name: r.name || 'Red',
          department: r.department || 'Desconocido',
          description: r.description || '',
          linkedSonorousTerritories: r.linkedSonorousTerritories || '',
          practices: r.practices || ''
        };
      }),
      ...this.lutieresRecords().map(r => {
        return {
          ...r,
          id: r.id || `lut-${Math.random()}`,
          category: 'Lutieres',
          name: r.name || 'Lutier',
          department: r.department || 'Desconocido',
          description: r.description || '',
          linkedSonorousTerritories: r.linkedSonorousTerritories || '',
          practices: r.practices || ''
        };
      })
    ];

    allRecords.forEach((record, index) => {
      const normalized = MapDomain.normalizeDepartmentName(record.department);
      if (!normalized || normalized === 'DESCONOCIDO') return;

      let centroid = MapDomain.COLOMBIA_DEPARTMENT_CENTROIDS[normalized.toLowerCase() as keyof typeof MapDomain.COLOMBIA_DEPARTMENT_CENTROIDS];
      if (!centroid && normalized.includes('SAN ANDRES')) {
        centroid = MapDomain.COLOMBIA_DEPARTMENT_CENTROIDS['san andres'];
      }
      if (!centroid) return;

      const sonorous = record.linkedSonorousTerritories || '';
      const desc = record.description || '';
      const practices = record.practices || '';

      let matchColor: string | null = null;
      let matchLabel: string | null = null;

      if (activeThematicOption === 'territorio') {
        let match: string | undefined = undefined;
        if (selectedSonorousTerritory !== 'Todos') {
          if (MapDomain.matchesSonorousTerritory(selectedSonorousTerritory, `${sonorous} ${desc}`)) {
            match = selectedSonorousTerritory;
          }
        } else {
          match = this.TERRITORIOS_SONOROS_LIST.find(t => 
            MapDomain.matchesSonorousTerritory(t, `${sonorous} ${desc}`)
          );
        }
        
        if (match) {
          matchColor = TERRITORIO_MAPPING[match]?.color || '#cbd5e1';
          matchLabel = match;
        }
      } else {
        let match: string | undefined = undefined;
        if (selectedPractice !== 'Todas') {
          if (MapDomain.matchesPracticeMusical(selectedPractice, `${practices} ${desc}`)) {
            match = selectedPractice;
          }
        } else {
          match = this.PRACTICAS_MUSICALES_LIST.find(p => 
            MapDomain.matchesPracticeMusical(p, `${practices} ${desc}`)
          );
        }

        if (match) {
          matchColor = PRACTICA_MAPPING[match]?.color || '#cbd5e1';
          matchLabel = match;
        }
      }

      if (matchColor && matchLabel) {
        const angle = (index * 0.72) % (2 * Math.PI);
        const radius = 0.08 + ((index * 0.03) % 0.14);
        const lat = centroid[0] + Math.sin(angle) * radius;
        const lng = centroid[1] + Math.cos(angle) * radius;

        points.push({
          id: `${record.id || index}-${activeThematicOption}`,
          lat,
          lng,
          color: matchColor,
          label: matchLabel,
          recordName: record.name || 'Proceso Ecosistémico',
          category: record.category || 'Registro',
          department: normalized
        });
      }
    });

    return points;
  });

  activeLegendItems = computed(() => {
    const visualizationMode = this.visualizationMode();
    const activeThematicOption = this.activeThematicOption();
    const selectedSonorousTerritory = this.selectedSonorousTerritory();
    const selectedPractice = this.selectedPractice();
    const activeCategory = this.activeCategory();

    if (visualizationMode === 'practicas_territorios') {
      if (activeThematicOption === 'territorio') {
        if (selectedSonorousTerritory === 'Todos') {
          const uniqueLabels = [...new Set(this.thematicPoints().map(p => p.label))].sort();
          return uniqueLabels.map(label => ({
            label,
            color: TERRITORIO_MAPPING[label]?.color || '#cbd5e1'
          }));
        }
        const mapping = TERRITORIO_MAPPING[selectedSonorousTerritory];
        return [
          { label: selectedSonorousTerritory, color: mapping?.color || '#cbd5e1' }
        ];
      } else {
        if (selectedPractice === 'Todas') {
          const uniqueLabels = [...new Set(this.thematicPoints().map(p => p.label))].sort();
          return uniqueLabels.map(label => ({
            label,
            color: PRACTICA_MAPPING[label]?.color || '#cbd5e1'
          }));
        }
        const mapping = PRACTICA_MAPPING[selectedPractice];
        return [
          { label: selectedPractice, color: mapping?.color || '#cbd5e1' }
        ];
      }
    }
    return MapDomain.MAP_LAYER_CHOROPLETH_STEPS[activeCategory] || MapDomain.MAP_LAYER_CHOROPLETH_STEPS['General'];
  });

  selectedFestivalRecords = computed(() => {
    return this.selectedDept() === 'Nacional' ? [] : (this.festivalRecordsByDepartment()[this.selectedNormalized()] || []);
  });
  selectedSchoolRecords = computed(() => {
    return this.selectedDept() === 'Nacional' ? [] : (this.schoolRecordsByDepartment()[this.selectedNormalized()] || []);
  });
  selectedMarketRecords = computed(() => {
    return this.selectedDept() === 'Nacional' ? [] : (this.marketRecordsByDepartment()[this.selectedNormalized()] || []);
  });
  selectedRedesRecords = computed(() => {
    return this.selectedDept() === 'Nacional' ? [] : (this.redesRecordsByDepartment()[this.selectedNormalized()] || []);
  });
  selectedLutieresRecords = computed(() => {
    return this.selectedDept() === 'Nacional' ? [] : (this.lutieresRecordsByDepartment()[this.selectedNormalized()] || []);
  });

  activeMunicipalityCounts = computed(() => {
    if (this.selectedDept() === 'Nacional') return {};
    
    const records = this.isGeneralLayer()
      ? [
          ...this.selectedFestivalRecords(),
          ...this.selectedSchoolRecords(),
          ...this.selectedMarketRecords(),
          ...this.selectedRedesRecords(),
          ...this.selectedLutieresRecords(),
        ]
      : this.isSchoolsLayer()
      ? this.selectedSchoolRecords()
      : this.isMarketsLayer()
      ? this.selectedMarketRecords()
      : this.isRedesLayer()
      ? this.selectedRedesRecords()
      : this.isLutieresLayer()
      ? this.selectedLutieresRecords()
      : this.selectedFestivalRecords();

    const counts: Record<string, number> = {};
    records.forEach((record: any) => {
      const munName = (record.municipality || record.municipio || '').toLowerCase().trim();
      const munCode = record.municipalityCode || record?.fields?.municipalityCode || '';
      
      if (munCode) {
        counts[munCode] = (counts[munCode] || 0) + 1;
      }
      if (munName) {
        counts[munName] = (counts[munName] || 0) + 1;
      }
    });
    return counts;
  });

  focusedDepartmentStats = computed(() => {
    return this.selectedDept() === 'Nacional' ? null : (this.departmentSummaryByDepartment()[this.selectedNormalized()] || MapDomain.EMPTY_DEPARTMENT_SUMMARY);
  });

  schoolCapacityTotals = computed(() => {
    return MapDomain.buildSchoolCapacityTotals(this.selectedDept() === 'Nacional' ? this.schoolRecords() : this.selectedSchoolRecords());
  });

  marketCapacityTotals = computed(() => {
    return MapDomain.buildMarketTotals(this.selectedDept() === 'Nacional' ? this.marketRecords() : this.selectedMarketRecords());
  });

  territorialPulse = computed(() => {
    if (this.selectedDept() === 'Nacional') {
      const summary = {
        totalRecords: Object.values(this.departmentSummaryByDepartment()).reduce((sum, s: any) => sum + (s.totalRecords || 0), 0),
        festivalCount: Object.values(this.departmentSummaryByDepartment()).reduce((sum, s: any) => sum + (s.festivalCount || 0), 0),
        schoolCount: Object.values(this.departmentSummaryByDepartment()).reduce((sum, s: any) => sum + (s.schoolCount || 0), 0),
        marketCount: Object.values(this.departmentSummaryByDepartment()).reduce((sum, s: any) => sum + (s.marketCount || 0), 0),
        redesCount: Object.values(this.departmentSummaryByDepartment()).reduce((sum, s: any) => sum + (s.redesCount || 0), 0),
        lutierCount: Object.values(this.departmentSummaryByDepartment()).reduce((sum, s: any) => sum + (s.lutierCount || 0), 0),
      };
      
      const activeDepts = Object.values(this.departmentSummaryByDepartment()).filter((s: any) => s.totalRecords > 0).length;

      return {
        totalRecords: summary.totalRecords,
        impactedCount: activeDepts,
        impactedLabel: 'Departamentos impactados',
        layerItems: [
          { key: 'festivals', label: 'Festivales', value: summary.festivalCount, color: this.LAYER_ACCENTS['Festivales'] },
          { key: 'schools', label: 'Escuelas', value: summary.schoolCount, color: this.LAYER_ACCENTS['Escuelas de Música'] },
          { key: 'markets', label: 'Mercados', value: summary.marketCount, color: this.LAYER_ACCENTS['Mercados Musicales'] },
          { key: 'redes', label: 'Redes Doc.', value: summary.redesCount, color: this.LAYER_ACCENTS['Redes de Documentación'] },
          { key: 'lutieres', label: 'Lutieres', value: summary.lutierCount, color: this.LAYER_ACCENTS['Lutieres'] },
        ],
      };
    } else {
      const summary = this.focusedDepartmentStats() || MapDomain.EMPTY_DEPARTMENT_SUMMARY;
      const municipalitiesWithRecords = new Set([
        ...(this.selectedFestivalRecords() || []).map((item: any) => item.municipality),
        ...(this.selectedSchoolRecords() || []).map((item: any) => item.municipality),
        ...(this.selectedMarketRecords() || []).map((item: any) => item.municipio || item.municipality),
        ...(this.selectedRedesRecords() || []).map((item: any) => item.municipio || item.municipality),
        ...(this.selectedLutieresRecords() || []).map((item: any) => item.municipio || item.municipality)
      ].filter(Boolean));

      return {
        totalRecords: summary.totalRecords,
        impactedCount: municipalitiesWithRecords.size,
        impactedLabel: 'Municipios impactados',
        layerItems: [
          { key: 'festivals', label: 'Festivales', value: summary.festivalCount, color: this.LAYER_ACCENTS['Festivales'] },
          { key: 'schools', label: 'Escuelas', value: summary.schoolCount, color: this.LAYER_ACCENTS['Escuelas de Música'] },
          { key: 'markets', label: 'Mercados', value: summary.marketCount, color: this.LAYER_ACCENTS['Mercados Musicales'] },
          { key: 'redes', label: 'Redes Doc.', value: summary.redesCount, color: this.LAYER_ACCENTS['Redes de Documentación'] },
          { key: 'lutieres', label: 'Lutieres', value: summary.lutierCount, color: this.LAYER_ACCENTS['Lutieres'] },
        ],
      };
    }
  });

  technicalDepartmentRows = computed(() => {
    return Object.keys(this.baseDepartmentCounts())
      .map((departmentKey) => {
        const summary = this.departmentSummaryByDepartment()[departmentKey] || MapDomain.EMPTY_DEPARTMENT_SUMMARY;
        const festivals = this.festivalRecordsByDepartment()[departmentKey] || [];
        const schools = this.schoolRecordsByDepartment()[departmentKey] || [];
        const markets = this.marketRecordsByDepartment()[departmentKey] || [];
        const schoolTotals = MapDomain.buildSchoolCapacityTotals(schools);
        const marketTotals = MapDomain.buildMarketTotals(markets);

        return {
          departmentKey,
          departmentLabel: MapDomain.getDepartmentDisplayName(departmentKey),
          totalRecords: summary.totalRecords,
          festivalCount: festivals.length,
          schoolCount: schools.length,
          marketCount: markets.length,
          totalStudents: schoolTotals.totalStudents,
          totalTeachers: schoolTotals.totalTeachers,
          totalInstruments: schoolTotals.totalInstruments,
          totalMarketProjects: marketTotals.totalProjects,
          totalMarketBuyers: marketTotals.totalBuyers,
          municipalities: MapDomain.countDistinctValues(festivals, (item) => item.municipality),
        };
      })
      .sort((left, right) => {
        const isGeneral = this.isGeneralLayer();
        const isSchools = this.isSchoolsLayer();
        const isMarkets = this.isMarketsLayer();
        const sortKey = isGeneral
          ? 'totalRecords'
          : isSchools
          ? 'schoolCount'
          : isMarkets
          ? 'marketCount'
          : 'festivalCount';
        const delta = (right[sortKey] || 0) - (left[sortKey] || 0);
        return delta || left.departmentLabel.localeCompare(right.departmentLabel, 'es-CO');
      });
  });

  summaryCards = computed(() => {
    const isDept = this.selectedDept() !== 'Nacional' && this.focusedDepartmentStats();
    const summary = isDept ? this.focusedDepartmentStats()! : MapDomain.EMPTY_DEPARTMENT_SUMMARY;

    if (this.isGeneralLayer()) {
      return [
        { 
          label: 'Formación Musical', 
          value: isDept ? summary.totalStudents : this.schoolCapacityTotals().totalStudents, 
          note: `${this.formatMetric(isDept ? summary.schoolCount : this.schoolRecords().length)} escuelas, ${this.formatMetric(isDept ? summary.totalTeachers : this.schoolCapacityTotals().totalTeachers)} docentes y ${this.formatMetric(isDept ? summary.totalInstruments : this.schoolCapacityTotals().totalInstruments)} instrumentos registrados.` 
        },
        {
          label: 'Festivales y Encuentros',
          value: isDept ? summary.festivalCount : this.festivalRecords().length,
          note: 'Celebraciones y circuitos de circulación de música en vivo.'
        },
        { 
          label: 'Proyectos en Mercados', 
          value: isDept ? summary.totalMarketProjects : this.marketCapacityTotals().totalProjects, 
          note: `Conexión profesional con ${this.formatMetric(isDept ? summary.totalMarketBuyers : this.marketCapacityTotals().totalBuyers)} compradores registrados.` 
        },
        { 
          label: 'Centros de Documentación', 
          value: isDept ? summary.redesCount : this.redesRecords().length, 
          note: 'Archivos históricos y redes de memoria musical activas.' 
        },
        { 
          label: 'Talleres de Lutería', 
          value: isDept ? summary.lutierCount : this.lutieresRecords().length, 
          note: 'Constructores tradicionales y saberes locales del oficio.' 
        },
      ];
    }

    if (this.isSchoolsLayer()) {
      return [
        { label: 'Escuelas visibles', value: isDept ? summary.schoolCount : this.schoolRecords().length, note: `${this.activeAnalytics().activeDepartments} departamentos con registros.` },
        { label: 'Estudiantes', value: isDept ? summary.totalStudents : this.schoolCapacityTotals().totalStudents, note: 'Suma nacional o territorial visible.' },
        { label: 'Docentes', value: isDept ? summary.totalTeachers : this.schoolCapacityTotals().totalTeachers, note: 'Capacidad pedagógica reportada.' },
        { label: 'Instrumentos', value: isDept ? summary.totalInstruments : this.schoolCapacityTotals().totalInstruments, note: 'Dotación registrada.' },
        { label: 'Con internet', value: this.schoolCapacityTotals().withInternet, note: 'Escuelas con conectividad declarada.' },
      ];
    }

    if (this.isMarketsLayer()) {
      return [
        { label: 'Mercados visibles', value: isDept ? summary.marketCount : this.marketRecords().length, note: `${this.activeAnalytics().activeDepartments} departamentos con registros.` },
        { label: 'Proyectos', value: isDept ? summary.totalMarketProjects : this.marketCapacityTotals().totalProjects, note: 'Promedio o suma reportada por mercado.' },
        { label: 'Bookers', value: isDept ? summary.totalMarketBuyers : this.marketCapacityTotals().totalBuyers, note: 'Capacidad de conexión profesional.' },
        { label: 'Conconvocatorias', value: this.marketCapacityTotals().openCalls, note: 'Mercados con convocatoria abierta.' },
        { label: 'Con festival', value: this.marketCapacityTotals().linkedToFestival, note: 'Relación con circuitos festivaleros.' },
      ];
    }

    if (this.isFestivalsLayer()) {
      const allFestivals = isDept ? (this.festivalRecordsByDepartment()[this.selectedNormalized()] || []) : Object.values(this.festivalRecordsByDepartment()).flat();
      return [
        { label: 'Festivales visibles', value: isDept ? summary.festivalCount : this.festivalAnalytics().totalRecords, note: `${this.activeAnalytics().activeDepartments} departamentos con presencia.` },
        { label: 'Municipios', value: MapDomain.countDistinctValues(allFestivals, (item) => item.municipality), note: 'Municipios con registros reportados.' },
        { label: 'Meses', value: MapDomain.countDistinctValues(allFestivals, (item) => item.month), note: 'Distribución temporal disponible.' },
        { label: 'Géneros', value: MapDomain.countDistinctValues(allFestivals, (item) => item.genre), note: 'Lectura temática visible.' },
        { label: 'Cobertura', value: `${this.activeAnalytics().coverage}%`, note: 'Departamentos con presencia festivalera.' },
      ];
    }

    if (this.isRedesLayer()) {
      const allRedes = isDept ? (this.redesRecordsByDepartment()[this.selectedNormalized()] || []) : this.redesRecords();
      return [
        { label: 'Redes integradas', value: isDept ? summary.redesCount : this.redesRecords().length, note: `${this.activeAnalytics().activeDepartments} departamentos con presencia.` },
        { label: 'Municipios', value: MapDomain.countDistinctValues(allRedes, (item) => item.municipality), note: 'Cobertura municipal.' },
        { label: 'Cobertura', value: `${this.activeAnalytics().coverage}%`, note: 'Departamentos activos.' },
      ];
    }

    if (this.isLutieresLayer()) {
      const allLutieres = isDept ? (this.lutieresRecordsByDepartment()[this.selectedNormalized()] || []) : this.lutieresRecords();
      return [
        { label: 'Lutieres registrados', value: isDept ? summary.lutierCount : this.lutieresRecords().length, note: `${this.activeAnalytics().activeDepartments} departamentos con presencia.` },
        { label: 'Municipios', value: MapDomain.countDistinctValues(allLutieres, (item) => item.municipality), note: 'Cobertura municipal.' },
        { label: 'Cobertura', value: `${this.activeAnalytics().coverage}%`, note: 'Departamentos activos.' },
      ];
    }

    return [];
  });

  visibleRecords = computed(() => {
    if (this.selectedDept() === 'Nacional') return [];
    const selectedNormalized = this.selectedNormalized();

    return [
      ...this.selectedFestivalRecords().slice(0, 8).map((item: any) => ({
        type: 'Festival',
        name: item.name,
        meta: [item.municipality, item.month, item.genre].filter(Boolean).join(' · '),
        record: { ...item, department: selectedNormalized },
      })),
      ...this.selectedSchoolRecords().slice(0, 8).map((item: any) => ({
        type: 'Escuela',
        name: item.name,
        meta: [item.municipality, item.status, `${this.formatMetric(item.students)} estudiantes`].filter(Boolean).join(' · '),
        record: item,
      })),
      ...this.selectedMarketRecords().slice(0, 8).map((item: any) => ({
        type: 'Mercado',
        name: item.name,
        meta: [item.municipality, item.periodicity, item.openCall === 'Sí' ? 'Convocatoria abierta' : ''].filter(Boolean).join(' · '),
        record: item,
      })),
      ...this.selectedRedesRecords().slice(0, 8).map((item: any) => ({
        type: 'Redes de Documentación',
        name: item.name,
        meta: [item.municipality, item.centerType].filter(Boolean).join(' · '),
        record: item,
      })),
      ...this.selectedLutieresRecords().slice(0, 8).map((item: any) => ({
        type: 'Lutieres',
        name: item.name,
        meta: [item.municipality, item.oficio].filter(Boolean).join(' · '),
        record: item,
      })),
    ];
  });

  directoryCounts = computed<Record<string, number>>(() => {
    const isDept = this.selectedDept() !== 'Nacional';
    const deptNorm = this.selectedNormalized() || '';
    
    const countFestivals = isDept
      ? ((this.festivalRecordsByDepartment() || {})[deptNorm] || []).length
      : Object.values(this.festivalRecordsByDepartment() || {}).flat().length;
      
    const countSchools = isDept
      ? ((this.schoolRecordsByDepartment() || {})[deptNorm] || []).length
      : Object.values(this.schoolRecordsByDepartment() || {}).flat().length;
      
    const countMarkets = isDept
      ? ((this.marketRecordsByDepartment() || {})[deptNorm] || []).length
      : Object.values(this.marketRecordsByDepartment() || {}).flat().length;
      
    const countRedes = isDept
      ? ((this.redesRecordsByDepartment() || {})[deptNorm] || []).length
      : Object.values(this.redesRecordsByDepartment() || {}).flat().length;
      
    const countLutieres = isDept
      ? ((this.lutieresRecordsByDepartment() || {})[deptNorm] || []).length
      : Object.values(this.lutieresRecordsByDepartment() || {}).flat().length;

    return {
      Todos: countFestivals + countSchools + countMarkets + countRedes + countLutieres,
      Festivales: countFestivals,
      Escuelas: countSchools,
      Mercados: countMarkets,
      Redes: countRedes,
      Lutieres: countLutieres,
    };
  });

  directoryRecords = computed(() => {
    const isDept = this.selectedDept() !== 'Nacional';
    const deptNorm = this.selectedNormalized() || '';
    
    const festivals = isDept
      ? ((this.festivalRecordsByDepartment() || {})[deptNorm] || [])
      : Object.entries(this.festivalRecordsByDepartment() || {}).flatMap(([deptKey, list]) =>
          ((list as any) || []).map((item: any) => ({ ...item, department: item.department || MapDomain.getDepartmentDisplayName(deptKey) }))
        );
        
    const schools = isDept
      ? ((this.schoolRecordsByDepartment() || {})[deptNorm] || [])
      : Object.values(this.schoolRecordsByDepartment() || {}).flat();
      
    const markets = isDept
      ? ((this.marketRecordsByDepartment() || {})[deptNorm] || [])
      : Object.values(this.marketRecordsByDepartment() || {}).flat();
      
    const redes = isDept
      ? ((this.redesRecordsByDepartment() || {})[deptNorm] || [])
      : Object.values(this.redesRecordsByDepartment() || {}).flat();
      
    const lutieres = isDept
      ? ((this.lutieresRecordsByDepartment() || {})[deptNorm] || [])
      : Object.values(this.lutieresRecordsByDepartment() || {}).flat();

    const all: any[] = [];
    const directoryCategory = this.directoryCategory();

    if (directoryCategory === 'Todos' || directoryCategory === 'Festivales') {
      (festivals || []).forEach((item: any) => {
        if (!item) return;
        all.push({
          id: item.id || `fest-${item.name || 'sin-nombre'}-${item.municipality || 'sin-municipio'}`,
          type: 'Festival',
          name: item.name || 'Festival sin nombre',
          meta: [item.municipality, item.month, item.genre].filter(Boolean).join(' · ') || 'Sin datos de ubicación',
          department: item.department,
          color: this.LAYER_ACCENTS['Festivales'],
          record: { ...item, type: 'Festival' }
        });
      });
    }
    
    if (directoryCategory === 'Todos' || directoryCategory === 'Escuelas') {
      (schools || []).forEach((item: any) => {
        if (!item) return;
        all.push({
          id: item.id || `school-${item.name || 'sin-nombre'}-${item.municipality || 'sin-municipio'}`,
          type: 'Escuela',
          name: item.name || 'Escuela sin nombre',
          meta: [item.municipality, item.status, item.students ? `${this.formatMetric(item.students)} estudiantes` : ''].filter(Boolean).join(' · ') || 'Sin datos de ubicación',
          department: item.department,
          color: this.LAYER_ACCENTS['Escuelas de Música'],
          record: { ...item, type: 'Escuela' }
        });
      });
    }
    
    if (directoryCategory === 'Todos' || directoryCategory === 'Mercados') {
      (markets || []).forEach((item: any) => {
        if (!item) return;
        all.push({
          id: item.id || `market-${item.name || 'sin-nombre'}-${item.municipality || 'sin-municipio'}`,
          type: 'Mercado',
          name: item.name || 'Mercado sin nombre',
          meta: [item.municipality, item.periodicity, item.openCall === 'Sí' ? 'Convocatoria abierta' : ''].filter(Boolean).join(' · ') || 'Sin datos de ubicación',
          department: item.department,
          color: this.LAYER_ACCENTS['Mercados Musicales'],
          record: { ...item, type: 'Mercado' }
        });
      });
    }
    
    if (directoryCategory === 'Todos' || directoryCategory === 'Redes') {
      (redes || []).forEach((item: any) => {
        if (!item) return;
        all.push({
          id: item.id || `redes-${item.name || 'sin-nombre'}-${item.municipality || 'sin-municipio'}`,
          type: 'Redes de Documentación',
          name: item.name || 'Red de Documentación sin nombre',
          meta: [item.municipality, item.centerType].filter(Boolean).join(' · ') || 'Sin datos de ubicación',
          department: item.department,
          color: this.LAYER_ACCENTS['Redes de Documentación'],
          record: { ...item, type: 'Redes de Documentación' }
        });
      });
    }
    
    if (directoryCategory === 'Todos' || directoryCategory === 'Lutieres') {
      (lutieres || []).forEach((item: any) => {
        if (!item) return;
        all.push({
          id: item.id || `lutier-${item.name || 'sin-nombre'}-${item.municipality || 'sin-municipio'}`,
          type: 'Lutieres',
          name: item.name || 'Lutier sin nombre',
          meta: [item.municipality, item.oficio].filter(Boolean).join(' · ') || 'Sin datos de ubicación',
          department: item.department,
          color: this.LAYER_ACCENTS['Lutieres'],
          record: { ...item, type: 'Lutieres' }
        });
      });
    }

    return all.sort((a, b) => {
      const nameA = String(a.name || '').trim();
      const nameB = String(b.name || '').trim();
      return nameA.localeCompare(nameB);
    });
  });

  filteredDirectoryRecords = computed(() => {
    const query = this.directoryQuery().toLowerCase().trim();
    const records = this.directoryRecords();
    if (!query) return records;
    return records.filter(item => {
      if (!item) return false;
      const nameMatch = item.name?.toLowerCase().includes(query);
      const metaMatch = item.meta?.toLowerCase().includes(query);
      const deptMatch = item.department?.toLowerCase().includes(query);
      return nameMatch || metaMatch || deptMatch;
    });
  });

  selectedRecordDetailContent = computed(() => {
    const selectedRecordDetail = this.selectedRecordDetail();
    if (!selectedRecordDetail) return { highlights: [], sections: [] };
    const record = selectedRecordDetail.record || {};

    const isValidField = (val: any) => {
      if (val === undefined || val === null || val === '') return false;
      const str = String(val).trim().toLowerCase();
      return str !== 'sin dato' && str !== 'sin datos' && str !== 'no aplica' && str !== 'n/a';
    };

    if (selectedRecordDetail.type === 'Festival') {
      const itemsCirculacion = [
        { label: 'Zona Geográfica', value: record.zone || record.zona },
        { label: 'Ubicación Específica', value: record.specificLocation },
        { label: 'Nivel de Cobertura', value: record.coverageLevel },
        { label: 'Mes de Realización', value: record.month },
        { label: 'Prácticas Musicales', value: record.genre || record.practices },
        { label: 'Financiación', value: record.funding || 'Pública y recursos PNMC' },
      ].filter(item => item.value && isValidField(item.value));

      const itemsContacto = [
        { label: 'Sitio Web Oficial', value: record.websiteUrl },
        { label: 'Correo de Contacto', value: record.contactEmail },
        { label: 'Teléfono de Contacto', value: record.contactPhone },
      ].filter(item => isValidField(item.value));

      return {
        highlights: [],
        sections: [
          { title: 'Lectura General', body: record.description || 'No hay descripción pública disponible para este festival.' },
          { title: 'Circulación e Impacto', items: itemsCirculacion },
          { title: 'Contacto y Canales', items: itemsContacto },
        ],
      };
    }

    if (selectedRecordDetail.type === 'Escuela') {
      const itemsOrganizacion = [
        { label: 'Estudiantes Activos', value: record.students },
        { label: 'Docentes Vinculados', value: record.teachers },
        { label: 'Instrumentos Disponibles', value: record.instruments },
      ].filter(item => isValidField(item.value));

      const operacionItems = [
        { label: 'Estado de Operación', value: record.status },
        { label: 'Tipo de Escuela', value: record.schoolType },
        { label: 'Categoría', value: record.category },
        { label: 'Director o Coordinador', value: record.directorName },
        { label: 'Zona Geográfica', value: record.zone || record.zona },
        { label: 'Sede de Trabajo', value: record.workSite },
      ].filter(item => isValidField(item.value));

      const institucionalItems = [
        { label: 'Creada Legalmente', value: record.legalCreation },
        { label: 'Personería Jurídica', value: record.legalPersonhood },
        { label: 'Naturaleza Jurídica', value: record.nature },
        { label: 'Depende de Entidad', value: record.dependsOnEntity },
        { label: 'Entidad de la que Depende', value: record.parentEntity },
      ].filter(item => isValidField(item.value));

      const capacidadesItems = [
        { label: 'Formatos / Agrupaciones', value: record.groups },
        { label: 'Disponibilidad de Internet', value: record.hasInternet },
        { label: 'Prácticas Musicales', value: record.practices },
        { label: 'Talleres Independientes', value: record.workshops },
        { label: 'Organización Comunitaria', value: record.communityOrganization },
      ].filter(item => isValidField(item.value));

      const contactoItems = [
        { label: 'Celular del Director', value: record.directorContact },
        { label: 'Correo de la Escuela', value: record.contactEmail },
      ].filter(item => isValidField(item.value));

      return {
        highlights: [],
        sections: [
          { title: 'Capacidad Operativa', items: itemsOrganizacion },
          { title: 'Operación Formativa', items: operacionItems },
          { title: 'Estructura Institucional', items: institucionalItems },
          { title: 'Capacidades y Prácticas', items: capacidadesItems },
          { title: 'Contacto y Canales', items: contactoItems },
        ],
      };
    }

    if (selectedRecordDetail.type === 'Mercado') {
      const itemsOrganizacion = [
        { label: 'Proyectos Promedio', value: record.averageProjectsLabel || record.averageProjects },
        { label: 'Compradores / Bookers', value: record.averageBuyersLabel || record.averageBuyers },
        { label: 'Convocatoria Abierta', value: record.openCall },
      ].filter(item => isValidField(item.value));

      const operacionItems = [
        { label: 'Zona Geográfica', value: record.zone || record.zona },
        { label: 'Nivel de Cobertura', value: record.coverageLevel },
        { label: 'Ubicación Específica', value: record.specificLocation },
        { label: 'Entidad Responsable', value: record.responsibleEntity },
        { label: 'Tipo de Organización', value: record.organizationType },
        { label: 'Periodicidad del Mercado', value: record.periodicity },
        { label: 'Año de Creación', value: record.createdYear },
        { label: 'Versiones Realizadas', value: record.versions },
        { label: 'Fecha Edición 2026', value: record.editionDate2026 },
      ].filter(item => isValidField(item.value));

      const comercialItems = [
        { label: 'Modelo de Curaduría', value: record.curationModel },
        { label: 'Espacios para Compradores', value: record.buyerSpaces },
        { label: 'Estrategias de Bookers', value: record.buyerStrategies },
        { label: 'Preacuerdos Comerciales', value: record.preAgreements },
        { label: 'Mecanismos de Circulación', value: record.circulationMechanisms },
      ].filter(item => isValidField(item.value));

      const articulacionItems = [
        { label: 'Vinculado a Festival', value: record.linkedFestival },
        { label: 'Fechas del Festival', value: record.festivalDates },
        { label: 'Versiones del Festival', value: record.festivalVersions },
        { label: 'Fuentes de Financiación', value: record.fundingSources },
        { label: 'Participación Pública (%)', value: record.publicBudgetShare },
        { label: 'Articulaciones Públicas', value: record.publicArticulations },
        { label: 'Redes de Aliados', value: record.partnerNetworks },
        { label: 'Conexión con el PNMC', value: record.pnmcConnections },
      ].filter(item => item.value && isValidField(item.value));

      return {
        highlights: [],
        sections: [
          { title: 'Sobre el Mercado', body: record.description || 'No hay descripción pública disponible para este mercado.' },
          { title: 'Capacidad y Convocatoria', items: itemsOrganizacion },
          { title: 'Operación del Mercado', items: operacionItems },
          { title: 'Dinámicas de Comercialización', items: comercialItems },
          { title: 'Articulación e Impacto', items: articulacionItems },
        ],
      };
    }

    if (selectedRecordDetail.type === 'Redes de Documentación') {
      const items = [
        { label: 'Tipo de Centro o Red', value: record.centerType },
        { label: 'Ubicación', value: [record.municipio, record.departamento].filter(Boolean).join(', ') },
        { label: 'Territorios Vinculados', value: record.linkedSonorousTerritories },
        { label: 'Prácticas Musicales', value: record.practices },
        { label: 'Datos de Contacto', value: record.contact },
      ].filter(item => isValidField(item.value));

      return {
        highlights: [],
        sections: [
          { title: 'Sobre el Centro o Red', body: record.description || 'Centro de investigación y documentación dedicado a conservar y difundir la memoria y prácticas sonoras del país.' },
          { title: 'Articulación Técnica', items },
        ],
      };
    }

    if (selectedRecordDetail.type === 'Lutieres') {
      const items = [
        { label: 'Oficio / Especialidad', value: record.oficio },
        { label: 'Ubicación', value: [record.municipio, record.departamento].filter(Boolean).join(', ') },
        { label: 'Territorio Sonoro', value: record.linkedSonorousTerritories },
        { label: 'Prácticas Relacionadas', value: record.practices },
        { label: 'Datos de Contacto', value: record.contact },
      ].filter(item => isValidField(item.value));

      return {
        highlights: [],
        sections: [
          { title: 'Trayectoria y Saberes', body: record.description || 'Lutier y constructor tradicional dedicado a la preservación del patrimonio musical colombiano.' },
          { title: 'Caracterización de Oficio', items },
        ],
      };
    }

    return { highlights: [], sections: [] };
  });

  headerMetadata = computed(() => {
    const selectedRecordDetail = this.selectedRecordDetail();
    if (!selectedRecordDetail) return '';
    const record = selectedRecordDetail.record || {};
    const type = selectedRecordDetail.type;
    const location = [record.municipality || record.municipio, record.department || record.departamento].filter(Boolean).join(', ');

    if (type === 'Festival') {
      return [
        record.versions ? `${record.versions} ediciones` : null,
        record.organizer ? `Organiza: ${record.organizer}` : null,
        location
      ].filter(Boolean).join('  ·  ');
    }
    if (type === 'Escuela') {
      return [
        record.students ? `${this.formatMetric(record.students)} estudiantes` : null,
        record.teachers ? `${this.formatMetric(record.teachers)} docentes` : null,
        location
      ].filter(Boolean).join('  ·  ');
    }
    if (type === 'Mercado') {
      return [
        record.periodicity ? `${record.periodicity}` : null,
        record.marketMode || record.modalidad ? `Modo: ${record.marketMode || record.modalidad}` : null,
        location
      ].filter(Boolean).join('  ·  ');
    }
    if (type === 'Redes de Documentación') {
      return [
        record.centerType ? `${record.centerType}` : null,
        location
      ].filter(Boolean).join('  ·  ');
    }
    if (type === 'Lutieres') {
      return [
        record.oficio ? `${record.oficio}` : null,
        location
      ].filter(Boolean).join('  ·  ');
    }
    return selectedRecordDetail.meta || location;
  });

  colombiaBounds = computed(() => {
    const geoData = this.geoData();
    if (!geoData) return null;
    const nationalFeatures = geoData.features.filter(
      (feature: any) => MapDomain.getFeatureDepartmentNormalizedName(feature) !== MapDomain.ARCHIPELAGO_NORMALIZED_NAME
    );
    return L.geoJSON({
      ...geoData,
      features: nationalFeatures.length > 0 ? nationalFeatures : geoData.features,
    }).getBounds();
  });

  paddedColombiaBounds = computed(() => {
    const bounds = this.colombiaBounds();
    return bounds ? bounds.pad(-0.065) : null;
  });

  archipelagoFeature = computed(() => {
    const geoData = this.geoData();
    return geoData?.features?.find(
      (feature: any) => MapDomain.getFeatureDepartmentNormalizedName(feature) === MapDomain.ARCHIPELAGO_NORMALIZED_NAME
    ) || null;
  });

  enlargedArchipelagoFeature = computed(() => {
    return MapDomain.buildScaledFeature(this.archipelagoFeature());
  });

  archipelagoSummary = computed(() => {
    return this.departmentSummaryByDepartment()[MapDomain.ARCHIPELAGO_NORMALIZED_NAME] || MapDomain.EMPTY_DEPARTMENT_SUMMARY;
  });

  archipelagoCount = computed(() => {
    return this.activeDepartmentCounts()[MapDomain.ARCHIPELAGO_NORMALIZED_NAME] || 0;
  });

  archipelagoIsSelected = computed(() => {
    return this.selectedNormalized() === MapDomain.ARCHIPELAGO_NORMALIZED_NAME;
  });

  archipelagoVisualStyle = computed(() => {
    const hasSelectedDept = this.selectedDept() !== 'Nacional';
    const archSelected = this.archipelagoIsSelected();
    const visMode = this.visualizationMode();
    const activeCategory = this.activeCategory();
    const archipelagoCount = this.archipelagoCount();

    if (hasSelectedDept && archSelected) {
      return {
        ...this.SELECTED_DEPARTMENT_STYLE,
        fillOpacity: 0.9,
        weight: 3,
      };
    }

    if (hasSelectedDept) {
      return {
        ...this.MUTED_DEPARTMENT_STYLE,
        fillOpacity: 0.42,
      };
    }

    if (visMode === 'practicas_territorios') {
      return {
        fillColor: '#f8fafc',
        fillOpacity: 0.35,
        color: 'rgba(203, 213, 225, 0.45)',
        weight: 1.2,
        opacity: 0.5,
      };
    }

    const baseStyle = MapDomain.getChoroplethStyles(archipelagoCount, archSelected, activeCategory);
    return {
      ...baseStyle,
      fillOpacity: Math.max(baseStyle.fillOpacity, 0.78),
      weight: Math.max(baseStyle.weight, 2.1),
      color: baseStyle.color,
    };
  });

  activeInfoNote = computed(() => {
    if (this.isGeneralLayer()) {
      return 'La capa General integra escuelas, festivales y mercados visibles por departamento para ofrecer una lectura sintética del ecosistema musical.';
    }
    if (this.isSchoolsLayer()) {
      return `La capa de Escuelas publica ${MapDomain.SCHOOL_PUBLICATION_POLICY.public.length} campos territoriales e institucionales y reserva información sensible.`;
    }
    if (this.isMarketsLayer()) {
      return `La capa de Mercados publica ${MapDomain.MARKET_PUBLICATION_POLICY.public.length} campos territoriales y programáticos y reserva campos sensibles.`;
    }
    return 'La base de datos del mapa está en construcción y consolidación permanente con registros territoriales del ecosistema musical.';
  });

  currentDeptMunicipalities = signal<any>(null);

  constructor() {
    // Effect to initialize map when container and geoData are ready
    effect(() => {
      const geo = this.geoData();
      const ready = this.mapContainerReady();
      if (geo && ready && isPlatformBrowser(this.platformId)) {
        this.initializeMapOnce();
      }
    });

    // Effect to update map layers when reactive filters change
    effect(() => {
      const _cat = this.activeCategory();
      const _dept = this.selectedDept();
      const _mode = this.visualizationMode();
      const _displayType = this.influenceDisplayType();
      const _thematicOption = this.activeThematicOption();
      const _territory = this.selectedSonorousTerritory();
      const _practice = this.selectedPractice();
      const _ready = this.mapContainerReady();
      const _counts = this.activeDepartmentCounts();

      // Depend on local signal triggers
      this.updateMapLayers();
    });

    // Effect to update municipalities when selected department changes
    effect(() => {
      const selectedDept = this.selectedDept();
      const selectedNormalized = this.selectedNormalized();
      const geo = this.geoData();
      const allMun = this.allMunicipalities();

      if (selectedDept === 'Nacional') {
        this.currentDeptMunicipalities.set(null);
      } else {
        const filtered = allMun.filter((f) => {
          const deptName = MapDomain.normalizeDepartmentName(f.properties?.departmentName);
          return deptName === selectedNormalized;
        });
        this.currentDeptMunicipalities.set({
          type: 'FeatureCollection',
          features: filtered,
        });
      }
    });

    // Effect to handle navigationRequest triggers from router
    effect(() => {
      const req = this.navigationService.mapaNavigationRequest();
      if (req && req.requestId) {
        const nextLayer = ECOSYSTEM_LAYERS.some((layer) => layer.key === req.targetLayer)
          ? req.targetLayer
          : 'General';
        this.activeCategory.set(nextLayer);
        this.selectedDept.set('Nacional');
        this.sidebarTab.set('resumen');
        this.mapResetToken.update(c => c + 1);
      }
    });
  }

  ngOnInit() {
    this.directoryLimit.set(12);
    
    // Lock body scroll on map load
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      this.loadTutorialAuto();
    }

    this.fetchMapData();
  }

  ngAfterViewInit() {
    this.mapContainerReady.set(Boolean(this.mapContainer));
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    if (this.map) {
      this.map.remove();
    }
  }

  fetchMapData() {
    this.isLoading.set(true);
    this.mapError.set(null);

    this.mapDataService.fetchMapCountsBundle().subscribe({
      next: (bundle) => {
        const geoPayload = bundle.geoJson;
        const departmentGeoJson = geoPayload?.type === 'FeatureCollection'
          ? geoPayload
          : { type: 'FeatureCollection', features: [] };
        
        const nextMunicipalityGeoJson = geoPayload?.municipalities?.type === 'FeatureCollection'
          ? geoPayload.municipalities
          : { type: 'FeatureCollection', features: [] };

        MapDomain.setRuntimeDepartmentCatalog(departmentGeoJson.features || []);
        this.allMunicipalities.set(nextMunicipalityGeoJson?.features || []);
        this.geoData.set(departmentGeoJson);
        
        this.baseDepartmentCounts.set(bundle.baseCounts);
        this.festivalRecords.set(bundle.festivalRecords);
        this.schoolRecords.set(bundle.schoolRecords);
        this.marketRecords.set(bundle.marketRecords);
        this.redesRecords.set(bundle.redesRecords);
        this.lutieresRecords.set(bundle.luthierRecords);

        this.festivalCounts.set(bundle.festivalCounts);
        this.schoolCounts.set(bundle.schoolCounts);
        this.marketCounts.set(bundle.marketCounts);
        this.redesCounts.set(bundle.redesCounts);
        this.lutieresCounts.set(bundle.lutieresCounts);

        this.schoolLayerReady.set(true);
        this.marketLayerReady.set(true);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Fallo critico en el mapa:', err);
        this.mapError.set(err.message || 'Error al descargar datos del mapa');
        this.isLoading.set(false);
      }
    });
  }

  loadTutorialAuto() {
    const lastShowDate = localStorage.getItem('pnmc_last_tutorial_date');
    const todayStr = new Date().toISOString().split('T')[0];
    if (lastShowDate !== todayStr) {
      this.tutorialStep.set(0);
      this.isTutorialOpen.set(true);
      this.visualizationMode.set('cobertura');
      this.influenceDisplayType.set('puntos');
    }
  }

  formatMetric(val: any): string {
    return MapDomain.formatMetricValue(val);
  }

  formatRecordDetailValue(value: any) {
    if (value === undefined || value === null || value === '') return 'Sin dato';
    if (typeof value === 'number') return this.formatMetric(value);
    return String(value);
  }

  getWebText(key: string, fallback = ''): string {
    return this.webTexts.getWebText(key) || fallback;
  }

  initializeMapOnce() {
    if (this.map) return;

    const container = this.mapContainer?.nativeElement;
    if (!container) return;
    this.map = L.map(container, {
      center: [4.5709, -74.2973],
      zoom: 5.5,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
    });

    // Base washing tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      opacity: 0.55,
      maxZoom: 19,
    }).addTo(this.map);

    // Country labels
    WORLD_COUNTRY_LABELS.filter((country) => country.name !== 'Colombia').forEach((country) => {
      this.map!.on('zoom', () => {}); // placeholder
      // Construct a Leaflet marker using raw divicon
      const labelIcon = L.divIcon({
        className: 'custom-country-label-marker',
        html: `<span class="country-label-text">${country.name}</span>`,
        iconSize: [120, 20],
      });
      L.marker(country.position as L.LatLngExpression, { icon: labelIcon, interactive: false }).addTo(this.map!);
    });

    // Zoom management effect
    effect(() => {
      const bounds = this.paddedColombiaBounds();
      const reset = this.mapResetToken();
      if (bounds && this.map) {
        this.map.fitBounds(bounds, {
          paddingTopLeft: [28, 20],
          paddingBottomRight: [0, 0],
          animate: true,
          duration: 0.55,
        });
        
        setTimeout(() => {
          this.map!.invalidateSize();
        }, 600);
      }
    });

    // Drilldown Zoom management effect
    effect(() => {
      const selectedDept = this.selectedDept();
      const geo = this.geoData();
      if (!this.map || !geo || selectedDept === 'Nacional') return;

      const normalized = MapDomain.normalizeDepartmentName(selectedDept);
      const feature = geo.features.find(
        (f: any) => MapDomain.getFeatureDepartmentNormalizedName(f) === normalized
      );

      if (feature) {
        const tempLayer = L.geoJSON(feature);
        const bounds = tempLayer.getBounds();
        this.map.fitBounds(bounds, {
          animate: true,
          duration: 0.55,
          padding: [30, 30],
        });

        setTimeout(() => {
          this.map!.invalidateSize();
        }, 600);
      }
    });
  }

  updateMapLayers() {
    if (!this.map) return;

    // Clear dynamic layers
    if (this.geoJsonLayer) this.map.removeLayer(this.geoJsonLayer);
    if (this.hitLayer) this.map.removeLayer(this.hitLayer);
    if (this.municipalitiesLayer) this.map.removeLayer(this.municipalitiesLayer);
    if (this.archipelagoLayer) this.map.removeLayer(this.archipelagoLayer);
    
    this.thematicMarkers.forEach(m => this.map!.removeLayer(m));
    this.thematicMarkers = [];
    this.heatMapLayers.forEach(l => this.map!.removeLayer(l));
    this.heatMapLayers = [];

    const geo = this.geoData();
    if (!geo) return;

    // 1. Base coropleth layer
    this.geoJsonLayer = L.geoJSON(geo, {
      interactive: false,
      style: (feature) => this.getStyle(feature),
      onEachFeature: (feature, layer) => {
        const deptName = MapDomain.getFeatureDepartmentName(feature);
        const normalized = MapDomain.getFeatureDepartmentNormalizedName(feature);
        if (normalized !== MapDomain.ARCHIPELAGO_NORMALIZED_NAME) {
          layer.bindTooltip(deptName, {
            permanent: true,
            direction: 'center',
            className: 'department-label',
            opacity: 1,
          });
        }
      }
    }).addTo(this.map);

    // 2. Hit area layer
    this.hitLayer = L.geoJSON(geo, {
      filter: (feature) => MapDomain.getFeatureDepartmentNormalizedName(feature) !== MapDomain.ARCHIPELAGO_NORMALIZED_NAME,
      style: () => MapDomain.DEPARTMENT_HIT_AREA_STYLE as L.PathOptions,
      onEachFeature: (feature, layer) => {
        const deptName = MapDomain.getFeatureDepartmentName(feature);
        const normalized = MapDomain.getFeatureDepartmentNormalizedName(feature);
        const stats = this.departmentSummaryByDepartment()[normalized] || MapDomain.EMPTY_DEPARTMENT_SUMMARY;

        layer.on({
          mouseover: () => this.hoveredDepartmentCard.set({ deptName, stats }),
          mouseout: () => this.hoveredDepartmentCard.set(null),
          click: () => this.handleDepartmentDrilldown(deptName)
        });
      }
    }).addTo(this.map);

    // 3. Municipalities layer (Drilldown)
    const currentDeptMun = this.currentDeptMunicipalities();
    if (this.selectedDept() !== 'Nacional' && currentDeptMun) {
      const activeMunicipalityCounts = this.activeMunicipalityCounts();

      this.municipalitiesLayer = L.geoJSON(currentDeptMun, {
        style: (feature) => this.getMunicipalityStyle(feature),
        onEachFeature: (feature, layer) => {
          const munName = feature.properties?.municipalityName || 'Municipio';
          const munCode = feature.properties?.municipalityCode;
          const nameKey = munName.toLowerCase().trim();
          const count = (activeMunicipalityCounts[munCode] || 0) + (activeMunicipalityCounts[nameKey] || 0);

          const tooltipContent = `<div class="municipality-tooltip">
            <p class="tooltip-title">${munName}</p>
            <p class="tooltip-value">${count} ${count === 1 ? 'proceso' : 'procesos'} registrado${count === 1 ? '' : 's'}</p>
          </div>`;

          layer.bindTooltip(tooltipContent, {
            sticky: true,
            direction: 'auto',
            className: 'custom-municipality-tooltip',
          });
        }
      }).addTo(this.map);
    }

    // 4. Archipelago Layer (San Andres)
    const enlargedArchipelago = this.enlargedArchipelagoFeature();
    if (enlargedArchipelago) {
      const archipelagoSummary = this.archipelagoSummary();
      const style = this.archipelagoVisualStyle();

      this.archipelagoLayer = L.geoJSON(enlargedArchipelago, {
        style: () => style as L.PathOptions,
        onEachFeature: (_, layer) => {
          layer.bindTooltip('<span class="archipelago-label-line">Archipiélago de San Andrés,</span><span class="archipelago-label-line">Providencia y Santa Catalina</span>', {
            permanent: true,
            direction: 'right',
            className: 'archipelago-label',
            opacity: 1,
            offset: [18, 0],
          });
          layer.on({
            mouseover: () => this.hoveredDepartmentCard.set({
              deptName: 'Archipiélago de San Andrés, Providencia y Santa Catalina',
              stats: archipelagoSummary,
            }),
            mouseout: () => this.hoveredDepartmentCard.set(null),
            click: () => this.handleDepartmentDrilldown('San Andrés y Providencia')
          });
        }
      }).addTo(this.map);
    }

    // 5. Thematic points (Modes)
    if (this.visualizationMode() === 'practicas_territorios') {
      const points = this.thematicPoints();
      if (this.influenceDisplayType() === 'puntos') {
        points.forEach(point => {
          const marker = L.circleMarker([point.lat, point.lng], {
            radius: 8,
            fillColor: point.color,
            fillOpacity: 0.65,
            color: '#291242',
            weight: 1.2,
          });

          const tooltipContent = `<div class="municipality-tooltip">
            <p class="tooltip-title">${point.recordName}</p>
            <p class="tooltip-value">${point.category} · <span class="font-bold text-[9px]" style="color: ${point.color}">${point.label}</span></p>
          </div>`;

          marker.bindTooltip(tooltipContent, {
            sticky: true,
            direction: 'top',
            className: 'custom-municipality-tooltip',
          });

          marker.addTo(this.map!);
          this.thematicMarkers.push(marker);
        });
      } else {
        // Heatmap circles
        points.forEach(point => {
          const halo = L.circle([point.lat, point.lng], {
            radius: 85000,
            fillColor: point.color,
            fillOpacity: 0.28,
            color: 'transparent',
            weight: 0,
            className: 'glow-marker-calor-halo'
          }).addTo(this.map!);
          this.heatMapLayers.push(halo);

          const core = L.circle([point.lat, point.lng], {
            radius: 38000,
            fillColor: point.color,
            fillOpacity: 0.55,
            color: 'transparent',
            weight: 0,
            className: 'glow-marker-calor-core'
          }).addTo(this.map!);
          this.heatMapLayers.push(core);
        });
      }
    }
  }

  getStyle(feature: any): L.PathOptions {
    const departmentName = MapDomain.getFeatureDepartmentNormalizedName(feature);
    if (departmentName === MapDomain.ARCHIPELAGO_NORMALIZED_NAME) {
      return {
        fillColor: 'transparent',
        fillOpacity: 0,
        color: 'transparent',
        weight: 0,
        opacity: 0,
      };
    }
    const count = this.activeDepartmentCounts()[departmentName] || 0;
    const isSelectedDepartment = this.selectedDept() !== 'Nacional' && this.selectedNormalized() === departmentName;

    if (isSelectedDepartment) {
      return {
        ...this.SELECTED_DEPARTMENT_STYLE,
        fillColor: 'transparent',
        fillOpacity: 0,
      };
    }

    if (this.selectedDept() !== 'Nacional') {
      return this.MUTED_DEPARTMENT_STYLE;
    }

    if (this.visualizationMode() === 'practicas_territorios') {
      if (this.influenceDisplayType() === 'calor') {
        return {
          fillColor: '#f8fafc',
          fillOpacity: 0.25,
          color: 'rgba(203, 213, 225, 0.35)',
          weight: 1.0,
          opacity: 0.4,
        };
      }

      const deptPoints = this.thematicPoints().filter(p => p.department === departmentName);
      if (deptPoints.length > 0) {
        const colorCounts: Record<string, number> = {};
        deptPoints.forEach(p => {
          if (p.color) {
            colorCounts[p.color] = (colorCounts[p.color] || 0) + 1;
          }
        });

        let maxCount = 0;
        let dominantColor: string | null = null;
        let isTie = false;

        Object.entries(colorCounts).forEach(([color, count]) => {
          if (count > maxCount) {
            maxCount = count;
            dominantColor = color;
            isTie = false;
          } else if (count === maxCount) {
            isTie = true;
          }
        });

        if (!isTie && dominantColor) {
          const densityPct = Math.min(1.0, deptPoints.length / 8);
          return {
            fillColor: dominantColor,
            fillOpacity: 0.08 + (densityPct * 0.42),
            color: dominantColor,
            weight: 1.5,
            opacity: 0.7,
          };
        }
      }

      return {
        fillColor: '#f8fafc',
        fillOpacity: 0.25,
        color: 'rgba(203, 213, 225, 0.35)',
        weight: 1.0,
        opacity: 0.4,
      };
    }

    return MapDomain.getChoroplethStyles(count, true, this.activeCategory());
  }

  getMunicipalityStyle(feature: any): L.PathOptions {
    const munCode = feature.properties?.municipalityCode;
    const munName = (feature.properties?.municipalityName || '').toLowerCase().trim();
    
    const count = (this.activeMunicipalityCounts()[munCode] || 0) + (this.activeMunicipalityCounts()[munName] || 0);
    const style = MapDomain.getChoroplethStyles(count, true, this.activeCategory());
    
    style.weight = count > 0 ? 1.0 : 0.6;
    style.color = count > 0 ? 'rgba(41, 18, 66, 0.7)' : 'rgba(41, 18, 66, 0.2)';
    
    return style;
  }

  handleDepartmentDrilldown(departmentName: string) {
    const nextSelectedDept = MapDomain.getDepartmentSelectionValue(departmentName);
    const nextNormalized = MapDomain.normalizeDepartmentName(nextSelectedDept);

    if (this.selectedDept() !== 'Nacional' && nextNormalized === this.selectedNormalized()) {
      this.selectedDept.set('Nacional');
      this.hoveredDepartmentCard.set(null);
      this.mapResetToken.update(c => c + 1);
    } else {
      this.selectedDept.set(nextSelectedDept);
    }
    this.sidebarTab.set('resumen');
  }

  handleReturnToNationalView() {
    this.selectedDept.set('Nacional');
    this.sidebarTab.set('resumen');
    this.hoveredDepartmentCard.set(null);
    this.mapResetToken.update(c => c + 1);
  }

  handleTogglePanel(panelId: string) {
    if (panelId === MAP_PANEL_IDS.tutorial) {
      this.tutorialStep.set(0);
      this.isTutorialOpen.set(true);
      this.activePanel.set(null);
      this.visualizationMode.set('cobertura');
      this.influenceDisplayType.set('puntos');
      this.activeCategory.set('General');
      this.selectedDept.set('Nacional');
      this.selectedSonorousTerritory.set('Todos');
      this.selectedPractice.set('Todas');
      this.hoveredDepartmentCard.set(null);
      this.selectedRecordDetail.set(null);
    } else {
      this.activePanel.update(c => c === panelId ? null : panelId);
    }
  }

  handleGoToStep(step: number) {
    this.tutorialStep.set(step);
    
    // Clean slate resets for visual harmony
    this.activeCategory.set('General');
    this.selectedDept.set('Nacional');
    this.selectedSonorousTerritory.set('Todos');
    this.selectedPractice.set('Todas');
    this.hoveredDepartmentCard.set(null);
    this.selectedRecordDetail.set(null);

    if (step === 0) {
      this.visualizationMode.set('cobertura');
      this.influenceDisplayType.set('puntos');
      this.activePanel.set(null);
    } else if (step === 1) {
      this.activePanel.set(MAP_PANEL_IDS.layers);
    } else if (step === 2) {
      this.activePanel.set(MAP_PANEL_IDS.filters);
    } else if (step === 3) {
      this.activePanel.set(MAP_PANEL_IDS.insights);
      this.visualizationMode.set('cobertura');
    } else if (step === 4) {
      this.activePanel.set(MAP_PANEL_IDS.insights);
      this.visualizationMode.set('practicas_territorios');
      this.influenceDisplayType.set('puntos');
    } else if (step === 5) {
      this.activePanel.set(MAP_PANEL_IDS.insights);
      this.visualizationMode.set('practicas_territorios');
      this.influenceDisplayType.set('calor');
    } else if (step === 6) {
      this.activePanel.set(null);
      this.sidebarTab.set('resumen');
    } else {
      this.activePanel.set(null);
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isTutorialOpen()) {
      this.handleCloseTutorial();
    }
  }

  handleCloseTutorial() {
    this.isTutorialOpen.set(false);
    this.activePanel.set(null);
    
    // Reset filters
    this.visualizationMode.set('cobertura');
    this.influenceDisplayType.set('puntos');
    this.activeCategory.set('General');
    this.selectedDept.set('Nacional');
    this.selectedSonorousTerritory.set('Todos');
    this.selectedPractice.set('Todas');
    this.hoveredDepartmentCard.set(null);
    this.selectedRecordDetail.set(null);

    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('pnmc_last_tutorial_date', todayStr);
  }

  handleExportLayerCsv() {
    const rows = Object.entries(this.activeDepartmentCounts() || {})
      .map(([departmentName, count]) => ({
        department: MapDomain.getDepartmentDisplayName(departmentName),
        count: Number(count || 0),
      }))
      .sort((left, right) => right.count - left.count);
    
    const csv = [
      ['layer', 'department', 'count'],
      ...rows.map((row) => [this.activeCategory(), row.department, String(row.count)]),
    ]
      .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mapa-ecosistemico-${this.activeLayerConfig().id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  onOpenParticipation() {
    this.navigationService.navigate(PAGE_IDS.colaboradores);
  }

  printMap() {
    window.print();
  }

  zoomIn() {
    if (this.map) this.map.zoomIn();
  }

  zoomOut() {
    if (this.map) this.map.zoomOut();
  }
}
