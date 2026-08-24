import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideArrowRight, LucideLayoutGrid, LucideList, LucideMapPin, LucideMusic2, LucideSearch, LucideSlidersHorizontal } from '@lucide/angular';
import { FestivalPublico, FiltrosFestivalesPublicos, FestivalesPublicosService } from '../../../../core/services/festivales-publicos.service';
import { PageHeroComponent } from '../../../../shared/components/ui/page-hero/page-hero.component';

type VistaExploracion = 'lista' | 'mosaico';

@Component({
  selector: 'app-festivales-publicos-page', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageHeroComponent, LucideArrowLeft, LucideArrowRight, LucideLayoutGrid, LucideList, LucideMapPin, LucideMusic2, LucideSearch, LucideSlidersHorizontal],
  templateUrl: './festivales-publicos-page.component.html',
})
export class FestivalesPublicosPageComponent implements OnInit {
  private readonly festivalesPublicos = inject(FestivalesPublicosService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly limitePagina = 20;

  readonly festivales = signal<FestivalPublico[]>([]);
  readonly filtrosDisponibles = signal<FiltrosFestivalesPublicos | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly busqueda = signal('');
  readonly departamento = signal('');
  readonly municipio = signal('');
  readonly vista = signal<VistaExploracion>('lista');
  readonly pagina = signal(1);
  readonly total = signal(0);
  readonly municipiosDisponibles = computed(() => this.filtrosDisponibles()?.municipios.filter(item => !this.departamento() || item.departamento === this.departamento()) ?? []);
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.limitePagina)));
  readonly hayFiltrosActivos = computed(() => Boolean(this.busqueda() || this.departamento() || this.municipio()));

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
  cambiarPagina(pagina: number): void { if (pagina >= 1 && pagina <= this.totalPaginas()) this.navegar({ pagina }); }
  limpiarFiltros(): void { this.router.navigate([], { relativeTo: this.route, queryParams: { vista: this.vista() === 'mosaico' ? 'mosaico' : null }, replaceUrl: true }); }
  volverAEcosistema(): void { this.router.navigateByUrl('/ecosistema-musical'); }
  territorio(festival: FestivalPublico): string { return [festival.territorioPrincipal.departamento, festival.territorioPrincipal.municipio].filter(Boolean).join(' · ') || 'Territorio por confirmar'; }
  descripcion(festival: FestivalPublico): string { return festival.descripcion?.trim() || 'Sin descripción pública disponible.'; }

  private cargarFestivales(): void {
    this.cargando.set(true); this.error.set('');
    this.festivalesPublicos.consultarFestivales({ limit: this.limitePagina, offset: (this.pagina() - 1) * this.limitePagina, busqueda: this.busqueda(), departamento: this.departamento(), municipio: this.municipio() }).subscribe({
      next: respuesta => { this.festivales.set(respuesta.items); this.total.set(respuesta.total); this.cargando.set(false); },
      error: error => { this.error.set(error?.message || 'No fue posible consultar los Festivales públicos.'); this.cargando.set(false); },
    });
  }

  private navegar(cambios: Partial<{ busqueda: string; departamento: string; municipio: string; vista: VistaExploracion; pagina: number }>): void {
    const estado = { busqueda: this.busqueda(), departamento: this.departamento(), municipio: this.municipio(), vista: this.vista(), pagina: this.pagina(), ...cambios };
    this.router.navigate([], { relativeTo: this.route, queryParams: { q: estado.busqueda || null, departamento: estado.departamento || null, municipio: estado.municipio || null, vista: estado.vista === 'mosaico' ? 'mosaico' : null, pagina: estado.pagina > 1 ? estado.pagina : null } });
  }
}
