import { Component, ElementRef, Input, inject, computed, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavigationService, PAGE_IDS } from '../../../../core/services/navigation.service';
import { WebTextsService } from '../../../../core/services/web-texts.service';
import { ejesDataGlobal } from '../../../../core/services/ejes-data.config';
import { 
  LucideChevronDown, 
  LucideMenu, 
  LucideX, 
  LucideArrowUpRight,
  LucideLogIn,
  LucideUserPlus
} from '@lucide/angular';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideChevronDown,
    LucideMenu,
    LucideX,
    LucideArrowUpRight,
    LucideLogIn,
    LucideUserPlus
  ],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent {
  public navigationService = inject(NavigationService);
  private webTexts = inject(WebTextsService);
  private readonly hostElement = inject(ElementRef<HTMLElement>);

  @Input() scrolled = false;
  @Input() forceSolid = false;

  // Reactivo: Observamos signals del servicio
  activePage = this.navigationService.activePage;
  mobileMenuOpen = this.navigationService.mobileMenuOpen;
  activeNavDropdown = this.navigationService.activeNavDropdown;
  activeEjeMenuId = this.navigationService.activeEjeMenuId;

  // Enlaces de navegación traducidos dinámicamente
  resolvedNavigationLinks = computed(() => {
    return this.navigationService.getResolvedNavigationLinks();
  });

  primaryNavigationLinks = computed(() => {
    return this.resolvedNavigationLinks().filter(
      (link) => ![PAGE_IDS.mapa, PAGE_IDS.simus].includes(link.id)
    );
  });

  featuredNavigationLinks = computed(() => {
    return this.resolvedNavigationLinks().filter(
      (link) => [PAGE_IDS.mapa, PAGE_IDS.simus].includes(link.id)
    );
  });

  isDropdownLink(linkId: string): boolean {
    return ['ejes', PAGE_IDS.simus].includes(linkId);
  }

  // Sección expandida dentro del menú móvil (acordeón de submenús)
  mobileExpandedSection = signal<string | null>(null);
  accessMenuOpen = signal(false);

  toggleMobileSection(linkId: string): void {
    this.mobileExpandedSection.update((current) => (current === linkId ? null : linkId));
  }

  // Sub-elementos del acordeón móvil según el enlace
  mobileSubItems(linkId: string): { label: string; action: () => void }[] {
    if (linkId === 'ejes') {
      return this.ejeNavigationGroups().map((group) => ({
        label: group.name,
        action: () => this.onNavigateToPageSection('ejes', group.sectionId),
      }));
    }
    if (linkId === PAGE_IDS.simus) {
      return this.ecosystemMenuItems.map((item) => ({
        label: item.label,
        action: () => this.onNavigateToPath(item.page),
      }));
    }
    return [];
  }

  // Apertura del mega-menú por foco de teclado (mouse sigue usando hover)
  onDropdownFocusIn(linkId: string): void {
    if (this.isDropdownLink(linkId)) {
      this.setActiveNavDropdown(linkId);
    }
  }

  onDropdownFocusOut(linkId: string, event: FocusEvent): void {
    if (!this.isDropdownLink(linkId)) return;
    const next = event.relatedTarget as Node | null;
    const current = event.currentTarget as HTMLElement | null;
    // Solo cerrar si el foco abandona por completo el contenedor del dropdown
    if (!next || !current || !current.contains(next)) {
      if (this.activeNavDropdown() === linkId) {
        this.setActiveNavDropdown(null);
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.activeNavDropdown()) {
      this.setActiveNavDropdown(null);
    }
    if (this.mobileMenuOpen()) {
      this.navigationService.setMobileMenuOpen(false);
    }
    this.accessMenuOpen.set(false);
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    if (!this.accessMenuOpen()) return;
    const target = event.target as Node | null;
    if (!target || !this.hostElement.nativeElement.contains(target)) {
      this.accessMenuOpen.set(false);
    }
  }

  ecosystemMenuItems = [
    { label: 'Escuelas de música', page: 'ecosistema-musical/escuelas', detail: 'Formación musical e indicadores.' },
    { label: 'Agrupaciones', page: 'ecosistema-musical/agrupaciones', detail: 'Procesos colectivos y prácticas musicales.' },
    { label: 'Agentes', page: 'ecosistema-musical/agentes', detail: 'Personas y organizaciones del sector.' },
    { label: 'Escenarios', page: 'ecosistema-musical/escenarios', detail: 'Infraestructura para la música.' },
    { label: 'Festivales', page: 'ecosistema-musical/festivales', detail: 'Circulación y celebración territorial.' },
    { label: 'Mercados musicales', page: 'ecosistema-musical/mercados-musicales', detail: 'Nodos de intercambio y circulación.' },
    { label: 'Redes y documentación', page: 'ecosistema-musical/redes-documentacion', detail: 'Memoria, investigación y archivos.' },
    { label: 'Lutería', page: 'ecosistema-musical/luteria', detail: 'Saberes, oficios e instrumentos.' },
  ];

  // Mapeo dinámico de ejes para la barra de navegación con traducción del CMS
  ejeNavigationGroups = computed(() => {
    return ejesDataGlobal.map((group, idx) => {
      const name = this.webTexts.getWebText(`eje0${idx + 1}_title`) || group.title;

      return {
        id: group.id,
        name,
        sectionId: idx === 0 ? 'musica-para-la-vida' : idx === 1 ? 'oficios-y-practicas' : 'gobernanza',
        components: group.components.map((comp, cIdx) => ({
          id: comp.id,
          name: this.webTexts.getWebText(`eje0${idx + 1}_c${cIdx + 1}_title`) || comp.name
        }))
      };
    });
  });

  // Eje sobre el que está el cursor en el menú (null = ninguno, no se muestran componentes)
  hoveredEjeGroup = computed(() => {
    const hoveredId = this.activeEjeMenuId();
    if (!hoveredId) return null;
    return this.ejeNavigationGroups().find((g) => g.id === hoveredId) || null;
  });

  clearEjeMenuHover(): void {
    this.setActiveEjeMenuId(null);
  }

  isEjesRelatedPage = computed(() => {
    const page = this.activePage();
    return page === PAGE_IDS.ejes || page.startsWith('comp-');
  });

  isActiveLink(linkId: string): boolean {
    if (linkId === 'ejes') {
      return this.isEjesRelatedPage();
    }
    if (linkId === PAGE_IDS.simus) {
      return this.activePage() === PAGE_IDS.ecosistemaMusical;
    }
    return this.activePage() === linkId;
  }

  getNavClass(): string {
    const isSolid = this.forceSolid || this.scrolled || this.mobileMenuOpen();
    return isSolid 
      ? 'py-4 bg-[#291242]/95 backdrop-blur-md shadow-lg border-b border-white/5' 
      : 'py-8 bg-transparent';
  }

  getPrimaryLinkClass(linkId: string): string {
    const active = this.isActiveLink(linkId) || this.activeNavDropdown() === linkId;
    return active ? 'text-[#00DA5E]' : 'text-white/72 hover:text-[#00DA5E]';
  }

  getEjeGroupClass(groupId: string): string {
    const isHovered = this.activeEjeMenuId() === groupId;
    return isHovered
      ? 'border-[#00DA5E] bg-slate-50/70'
      : 'border-transparent hover:bg-slate-50/40';
  }

  getFeaturedLinkClass(linkId: string): string {
    const active = this.isActiveLink(linkId);
    if (linkId === 'simus') {
      return active
        ? 'bg-[#8BF784] text-[#291242]'
        : 'bg-[#00DA5E] text-[#291242] hover:bg-[#8BF784]';
    } else {
      return active
        ? 'bg-white text-[#291242]'
        : 'border border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/20';
    }
  }

  getMobileLinkClass(linkId: string): string {
    return this.isActiveLink(linkId) 
      ? 'text-[#00DA5E]' 
      : 'text-white/60 hover:text-[#00DA5E]';
  }

  getWebText(key: string, fallback: string): string {
    return this.webTexts.getWebText(key) || fallback;
  }

  onPageChange(pageId: string): void {
    this.accessMenuOpen.set(false);
    this.navigationService.navigate(pageId);
  }

  onNavigateToPath(path: string): void {
    this.accessMenuOpen.set(false);
    this.navigationService.setActiveNavDropdown(null);
    this.navigationService.setMobileMenuOpen(false);
    this.navigationService.routerNavigate(path);
  }

  toggleAccessMenu(): void {
    const willOpen = !this.accessMenuOpen();
    this.accessMenuOpen.set(willOpen);
    if (willOpen) {
      this.navigationService.setActiveNavDropdown(null);
      this.navigationService.setMobileMenuOpen(false);
    }
  }

  navigateToExternalAccess(path: string): void {
    this.accessMenuOpen.set(false);
    this.onNavigateToPath(path);
  }

  onNavigateToPageSection(pageId: string, sectionId: string): void {
    this.navigationService.setActiveNavDropdown(null);
    this.navigationService.setMobileMenuOpen(false);
    this.navigationService.navigate(pageId);
    
    // Simular scroll demorado hacia la sección en la página destino
    setTimeout(() => {
      const targetElement = document.getElementById(sectionId);
      if (targetElement) {
        const offset = 112; // NAVBAR_SCROLL_OFFSET
        const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementPosition - offset,
          behavior: 'smooth'
        });
      }
    }, 220);
  }

  onNavigateToComponentFromMenu(componentId: string): void {
    this.navigationService.navigateComponent(componentId);
  }

  toggleMobileMenu(): void {
    this.navigationService.setMobileMenuOpen(!this.mobileMenuOpen());
  }

  setActiveNavDropdown(dropdown: string | null): void {
    if (dropdown) {
      this.accessMenuOpen.set(false);
    }
    this.navigationService.setActiveNavDropdown(dropdown);
  }

  setActiveEjeMenuId(ejeId: string | null): void {
    this.navigationService.setActiveEjeMenuId(ejeId);
  }
}
