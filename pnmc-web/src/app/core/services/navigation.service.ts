import { Injectable, signal, computed, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { WebTextsService } from './web-texts.service';

export const PAGE_IDS = {
  home: 'home',
  pnmc: 'pnmc',
  ejes: 'ejes',
  editorial: 'editorial',
  galeria: 'galeria',
  noticias: 'noticias',
  agenda: 'agenda',
  mapa: 'mapa',
  simus: 'simus',
  ecosistemaMusical: 'ecosistema-musical',
  mapaParticipa: 'mapa-participa',
  admin: 'admin',
  colaboradores: 'colaboradores',
  registro: 'registro',
  estrategiaCirculacion: 'estrategia-circulacion',
  estrategiaInvestigacion: 'estrategia-investigacion',
};

export const COMPONENT_PAGE_PREFIX = 'comp-';

export const PAGE_PATHS: Record<string, string> = {
  [PAGE_IDS.home]: '/',
  [PAGE_IDS.pnmc]: '/pnmc',
  [PAGE_IDS.ejes]: '/ejes',
  [PAGE_IDS.editorial]: '/editorial',
  [PAGE_IDS.galeria]: '/galeria',
  [PAGE_IDS.noticias]: '/noticias',
  [PAGE_IDS.agenda]: '/agenda',
  [PAGE_IDS.mapa]: '/mapa',
  // SIMUS conserva su identidad institucional, pero la puerta pública de
  // consulta es Ecosistema Musical; no existe una sección /simus.
  [PAGE_IDS.simus]: '/ecosistema-musical',
  [PAGE_IDS.ecosistemaMusical]: '/ecosistema-musical',
  [PAGE_IDS.mapaParticipa]: '/mapa/participa',
  [PAGE_IDS.admin]: '/consola-interna',
  [PAGE_IDS.colaboradores]: '/colaboradores',
  [PAGE_IDS.registro]: '/registro',
  [PAGE_IDS.estrategiaCirculacion]: '/estrategia/circulacion',
  [PAGE_IDS.estrategiaInvestigacion]: '/estrategia/investigacion',
};

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private router = inject(Router);
  private webTexts = inject(WebTextsService);
  private titleService = inject(Title);

  private readonly baseTitle = 'PNMC — Plan Nacional de Música para la Convivencia';
  private readonly pageTitles: Record<string, string> = {
    [PAGE_IDS.home]: this.baseTitle,
    [PAGE_IDS.pnmc]: 'Sobre el PNMC',
    [PAGE_IDS.ejes]: 'Ejes del Plan',
    [PAGE_IDS.editorial]: 'Editorial',
    [PAGE_IDS.galeria]: 'Galería',
    [PAGE_IDS.noticias]: 'Noticias',
    [PAGE_IDS.agenda]: 'Agenda',
    [PAGE_IDS.mapa]: 'Mapa ecosistémico',
    [PAGE_IDS.simus]: 'Ecosistema Musical de Colombia',
    [PAGE_IDS.ecosistemaMusical]: 'Ecosistema Musical de Colombia',
    [PAGE_IDS.admin]: 'Administración',
    [PAGE_IDS.colaboradores]: 'Colaboradores',
    [PAGE_IDS.registro]: 'Haz parte de SIMUS',
    [PAGE_IDS.estrategiaCirculacion]: 'Estrategia de circulación',
    [PAGE_IDS.estrategiaInvestigacion]: 'Estrategia de investigación',
  };

  private updateDocumentTitle(pageId: string): void {
    let title = this.pageTitles[pageId];
    if (!title && pageId.startsWith(COMPONENT_PAGE_PREFIX)) {
      title = 'Ejes del Plan';
    }
    this.titleService.setTitle(
      title && pageId !== PAGE_IDS.home ? `${title} · ${this.baseTitle}` : this.baseTitle,
    );
  }

  private _activePage = signal<string>(PAGE_IDS.home);
  private _mobileMenuOpen = signal<boolean>(false);
  private _activeNavDropdown = signal<string | null>(null);
  private _activeEjeMenuId = signal<string | null>(null);
  private _selectedAgendaEventId = signal<string | null>(null);
  private _selectedEditorialResourceId = signal<string | null>(null);
  private _mapaNavigationRequest = signal<any>(null);

  activePage = computed(() => this._activePage());
  mobileMenuOpen = computed(() => this._mobileMenuOpen());
  activeNavDropdown = computed(() => this._activeNavDropdown());
  activeEjeMenuId = computed(() => this._activeEjeMenuId());
  selectedAgendaEventId = computed(() => this._selectedAgendaEventId());
  selectedEditorialResourceId = computed(() => this._selectedEditorialResourceId());
  mapaNavigationRequest = computed(() => this._mapaNavigationRequest());

  navigationLinks = [
    { name: 'Sobre el PNMC', id: PAGE_IDS.pnmc },
    { name: 'Ejes', id: PAGE_IDS.ejes },
    { name: 'Editorial', id: PAGE_IDS.editorial },
    { name: 'Galería', id: PAGE_IDS.galeria },
    { name: 'Noticias', id: PAGE_IDS.noticias },
    { name: 'Agenda', id: PAGE_IDS.agenda },
    { name: 'Mapa Ecosistémico', id: PAGE_IDS.mapa },
    { name: 'SIMUS', id: PAGE_IDS.simus },
  ];

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url || '/';
      const pageId = this.getPageIdFromPath(url);
      this._activePage.set(pageId);
      this.updateDocumentTitle(pageId);
      // La navegación entre módulos y fichas siempre inicia en el encabezado.
      requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
    });
  }

  private normalizePathname(pathname = '/'): string {
    if (!pathname || pathname === '/') return '/';
    return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  }

  getPageIdFromPath(url = '/'): string {
    const path = url.split('?')[0]; // Ignorar search params
    const normalizedPath = this.normalizePathname(path);

    const pathSegments = normalizedPath.split('/').filter(Boolean);
    if (normalizedPath === '/registro' || normalizedPath === '/ingreso') {
      return PAGE_IDS.registro;
    }
    if (normalizedPath === '/ecosistema-musical' || normalizedPath.startsWith('/ecosistema-musical/')) {
      return PAGE_IDS.ecosistemaMusical;
    }
    if (normalizedPath === '/noticias' || normalizedPath.startsWith('/noticias/')) {
      return PAGE_IDS.noticias;
    }
    const ejesIndex = pathSegments.findIndex((segment) => segment.toLowerCase() === 'ejes');
    if (ejesIndex !== -1 && pathSegments[ejesIndex + 1]?.toLowerCase() === 'componentes' && pathSegments[ejesIndex + 2]) {
      return `${COMPONENT_PAGE_PREFIX}${decodeURIComponent(pathSegments[ejesIndex + 2])}`;
    }

    const staticEntries = Object.entries(PAGE_PATHS)
      .filter(([, pagePath]) => pagePath !== '/')
      .sort(([, leftPath], [, rightPath]) => rightPath.length - leftPath.length);

    const staticMatch = staticEntries.find(([, pagePath]) => (
      normalizedPath === pagePath || normalizedPath.endsWith(pagePath)
    ));

    return staticMatch?.[0] || PAGE_IDS.home;
  }

  getResolvedNavigationLinks() {
    return this.navigationLinks.map(link => ({
      ...link,
      name: this.webTexts.getWebText(`nav_${link.id}`) || link.name
    }));
  }

  setMobileMenuOpen(open: boolean) {
    this._mobileMenuOpen.set(open);
  }

  setActiveNavDropdown(dropdown: string | null) {
    this._activeNavDropdown.set(dropdown);
  }

  setActiveEjeMenuId(ejeId: string | null) {
    this._activeEjeMenuId.set(ejeId);
  }

  clearSelections() {
    this._selectedAgendaEventId.set(null);
    this._selectedEditorialResourceId.set(null);
    this._mapaNavigationRequest.set(null);
  }

  navigate(pageId: string) {
    this._mobileMenuOpen.set(false);
    this._activeNavDropdown.set(null);
    this.clearSelections();
    const path = PAGE_PATHS[pageId] || '/';
    this.router.navigateByUrl(path);
  }

  routerNavigate(path: string) {
    this._mobileMenuOpen.set(false);
    this._activeNavDropdown.set(null);
    this.clearSelections();
    this.router.navigateByUrl(`/${path.replace(/^\//, '')}`);
  }

  navigateToArticle(article: any) {
    this._mobileMenuOpen.set(false);
    this._activeNavDropdown.set(null);
    const articleId = article?.id != null ? String(article.id) : '';
    this.router.navigateByUrl(articleId ? `${PAGE_PATHS[PAGE_IDS.noticias]}/${articleId}` : PAGE_PATHS[PAGE_IDS.noticias]);
  }

  navigateToAgendaEvent(eventId: string) {
    this._selectedAgendaEventId.set(eventId);
    this._selectedEditorialResourceId.set(null);
    this._mobileMenuOpen.set(false);
    this._activeNavDropdown.set(null);
    this.router.navigateByUrl(PAGE_PATHS[PAGE_IDS.agenda]);
  }

  navigateToEditorialResource(resourceId: string) {
    this._selectedEditorialResourceId.set(resourceId);
    this._selectedAgendaEventId.set(null);
    this._mobileMenuOpen.set(false);
    this._activeNavDropdown.set(null);
    this.router.navigateByUrl(PAGE_PATHS[PAGE_IDS.editorial]);
  }

  navigateToMapLayer(targetLayer = 'General', options: any = {}) {
    const {
      targetView = 'map',
      scrollToWorkspace = true,
    } = options;

    this._selectedAgendaEventId.set(null);
    this._selectedEditorialResourceId.set(null);
    this._mapaNavigationRequest.set({
      requestId: Date.now(),
      targetLayer,
      targetView,
      scrollToWorkspace,
    });
    this._mobileMenuOpen.set(false);
    this._activeNavDropdown.set(null);
    this.router.navigateByUrl(PAGE_PATHS[PAGE_IDS.mapa]);
  }

  openMapParticipation() {
    this.navigate(PAGE_IDS.colaboradores);
  }

  navigateComponent(componentId: string) {
    this._mobileMenuOpen.set(false);
    this._activeNavDropdown.set(null);
    this.router.navigate(['/ejes', 'componentes', componentId]);
  }
}
