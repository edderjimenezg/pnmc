import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideArrowRight, LucideMapPin, LucideSearch, LucideSlidersHorizontal, LucideSparkles } from '@lucide/angular';
import { FestivalPublico, FiltrosFestivalesPublicos, FestivalesPublicosService } from '../../../../core/services/festivales-publicos.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { CompactHeroComponent } from '../../../../shared/components/ui/compact-hero/compact-hero.component';
import { EcosystemMetric } from '../../../../shared/components/ui/ecosystem-metrics-strip/ecosystem-metrics-strip.component';
import { EcosystemExplorationToolbarComponent } from '../../../../shared/components/ui/ecosystem-exploration-toolbar/ecosystem-exploration-toolbar.component';
import { EcosystemMapAccessComponent } from '../../../../shared/components/ui/ecosystem-map-access/ecosystem-map-access.component';

type VistaExploracion = 'lista' | 'mosaico';

@Component({
  selector: 'app-festivales-publicos-page', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CompactHeroComponent, EcosystemExplorationToolbarComponent, EcosystemMapAccessComponent, LucideArrowLeft, LucideArrowRight, LucideMapPin, LucideSearch, LucideSlidersHorizontal, LucideSparkles],
  templateUrl: './festivales-publicos-page.component.html',
})
export class FestivalesPublicosPageComponent implements OnInit {
  private readonly festivalesPublicos = inject(FestivalesPublicosService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly navigation = inject(NavigationService);
  private readonly limitePagina = 20;

  readonly festivales = signal<FestivalPublico[]>([]);
  readonly filtrosDisponibles = signal<FiltrosFestivalesPublicos | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly busqueda = signal('');
  readonly departamento = signal('');
  readonly municipio = signal('');
  readonly practicaMusicalId = signal<number | null>(null);
  readonly territorioSonoroId = signal<number | null>(null);
  readonly vista = signal<VistaExploracion>('lista');
  readonly pagina = signal(1);
  readonly total = signal(0);
  readonly municipiosDisponibles = computed(() => this.filtrosDisponibles()?.municipios.filter(item => !this.departamento() || item.departamento === this.departamento()) ?? []);
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.limitePagina)));
  readonly hayFiltrosActivos = computed(() => Boolean(this.busqueda() || this.departamento() || this.municipio() || this.practicaMusicalId() || this.territorioSonoroId()));
  readonly metricas = computed<EcosystemMetric[]>(() => {
    const filtros = this.filtrosDisponibles();
    return [
      { label: 'Resultados', value: this.total(), detail: this.hayFiltrosActivos() ? 'según los filtros activos' : 'Festivales públicos' },
      { label: 'Departamentos', value: filtros?.departamentos.length ?? 0, detail: 'con registros disponibles' },
      { label: 'Municipios', value: filtros?.municipios.length ?? 0, detail: 'con registros disponibles' },
      { label: 'Prácticas', value: filtros?.practicasMusicales.length ?? 0, detail: 'vinculadas al directorio' },
    ];
  });

  ngOnInit(): void {
    this.festivalesPublicos.consultarFiltros().subscribe({ next: filtros => this.filtrosDisponibles.set(filtros) });
    this.route.queryParamMap.subscribe(params => {
      this.busqueda.set(params.get('q') || '');
      this.departamento.set(params.get('departamento') || '');
      this.municipio.set(params.get('municipio') || '');
      this.vista.set(params.get('vista') === 'mosaico' ? 'mosaico' : 'lista');
      this.pagina.set(Math.max(1, Number(params.get('pagina')) || 1));
      this.cargarFestivales();
    });
  }

  buscar(): void { this.navegar({ pagina: 1 }); }
  cambiarVista(vista: VistaExploracion): void { this.navegar({ vista }); }
  cambiarDepartamento(departamento: string): void { this.navegar({ departamento, municipio: '', pagina: 1 }); }
  cambiarMunicipio(municipio: string): void { this.navegar({ municipio, pagina: 1 }); }
  cambiarPracticaMusical(valor: string): void { this.practicaMusicalId.set(valor ? Number(valor) : null); this.navegar({ pagina: 1 }); }
  cambiarTerritorioSonoro(valor: string): void { this.territorioSonoroId.set(valor ? Number(valor) : null); this.navegar({ pagina: 1 }); }
  cambiarPagina(pagina: number): void { if (pagina >= 1 && pagina <= this.totalPaginas()) this.navegar({ pagina }); }
  limpiarFiltros(): void { this.practicaMusicalId.set(null); this.territorioSonoroId.set(null); this.router.navigate([], { relativeTo: this.route, queryParams: { vista: this.vista() === 'mosaico' ? 'mosaico' : null }, replaceUrl: true }); }
  volverAEcosistema(): void { this.router.navigateByUrl('/ecosistema-musical'); }
  abrirMapa(): void { this.navigation.navigateToMapLayer('Festivales', { targetView: 'map' }); }
  territorio(festival: FestivalPublico): string { return [festival.territorioPrincipal.departamento, festival.territorioPrincipal.municipio].filter(Boolean).join(' · ') || 'Territorio por confirmar'; }
  descripcion(festival: FestivalPublico): string { return festival.descripcion?.trim() || 'Sin descripción pública disponible.'; }

  private cargarFestivales(): void {
    this.cargando.set(true); this.error.set('');
    this.festivalesPublicos.consultarFestivales({ limit: this.limitePagina, offset: (this.pagina() - 1) * this.limitePagina, busqueda: this.busqueda(), departamento: this.departamento(), municipio: this.municipio(), practicaMusicalId: this.practicaMusicalId() ?? undefined, territorioSonoroId: this.territorioSonoroId() ?? undefined }).subscribe({
      next: respuesta => { this.festivales.set(respuesta.items); this.total.set(respuesta.total); this.cargando.set(false); },
      error: error => { this.error.set(error?.message || 'No fue posible consultar los Festivales públicos.'); this.cargando.set(false); },
    });
  }

  private navegar(cambios: Partial<{ busqueda: string; departamento: string; municipio: string; vista: VistaExploracion; pagina: number }>): void {
    const estado = { busqueda: this.busqueda(), departamento: this.departamento(), municipio: this.municipio(), vista: this.vista(), pagina: this.pagina(), ...cambios };
    this.router.navigate([], { relativeTo: this.route, queryParams: { q: estado.busqueda || null, departamento: estado.departamento || null, municipio: estado.municipio || null, vista: estado.vista === 'mosaico' ? 'mosaico' : null, pagina: estado.pagina > 1 ? estado.pagina : null } });
  }
}
