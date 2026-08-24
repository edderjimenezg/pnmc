import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideArrowRight, LucideLayoutGrid, LucideList, LucideMapPin, LucideMusic2, LucideSearch, LucideSlidersHorizontal, LucideX } from '@lucide/angular';
import { CatalogoFestivalPublico, FestivalPublico, FiltrosFestivalesPublicos, FestivalesPublicosService, ResumenAnaliticoFestivales } from '../../../../core/services/festivales-publicos.service';
import { CompactHeroComponent } from '../../../../shared/components/ui/compact-hero/compact-hero.component';

type VistaExploracion = 'lista' | 'mosaico';

@Component({
  selector: 'app-festivales-publicos-page', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CompactHeroComponent, LucideArrowLeft, LucideArrowRight, LucideLayoutGrid, LucideList, LucideMapPin, LucideMusic2, LucideSearch, LucideSlidersHorizontal, LucideX],
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
  readonly resumen = signal<ResumenAnaliticoFestivales | null>(null);
  readonly busqueda = signal('');
  readonly departamento = signal('');
  readonly municipio = signal('');
  readonly practicaMusicalId = signal<number | null>(null);
  readonly territorioSonoroId = signal<number | null>(null);
  readonly periodicidad = signal('');
  readonly nivelCobertura = signal('');
  readonly vista = signal<VistaExploracion>('lista');
  readonly pagina = signal(1);
  readonly total = signal(0);
  readonly municipiosDisponibles = computed(() => this.filtrosDisponibles()?.municipios.filter(item => !this.departamento() || item.departamento === this.departamento()) ?? []);
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.limitePagina)));
  readonly hayFiltrosActivos = computed(() => Boolean(this.busqueda() || this.departamento() || this.municipio() || this.practicaMusicalId() || this.territorioSonoroId() || this.periodicidad() || this.nivelCobertura()));

  ngOnInit(): void {
    this.festivalesPublicos.consultarFiltros().subscribe({ next: filtros => this.filtrosDisponibles.set(filtros) });
    this.festivalesPublicos.consultarResumenAnalitico().subscribe({ next: resumen => this.resumen.set(resumen), error: () => undefined });
    this.route.queryParamMap.subscribe(params => {
      this.busqueda.set(params.get('q') || ''); this.departamento.set(params.get('departamento') || ''); this.municipio.set(params.get('municipio') || '');
      this.practicaMusicalId.set(this.numero(params.get('practica'))); this.territorioSonoroId.set(this.numero(params.get('territorioSonoro')));
      this.periodicidad.set(params.get('periodicidad') || ''); this.nivelCobertura.set(params.get('cobertura') || '');
      this.vista.set(params.get('vista') === 'mosaico' ? 'mosaico' : 'lista'); this.pagina.set(Math.max(1, Number(params.get('pagina')) || 1)); this.cargarFestivales();
    });
  }

  buscar(): void { this.navegar({ pagina: 1 }); }
  cambiarVista(vista: VistaExploracion): void { this.navegar({ vista }); }
  cambiarDepartamento(departamento: string): void { this.navegar({ departamento, municipio: '', pagina: 1 }); }
  cambiarMunicipio(municipio: string): void { this.navegar({ municipio, pagina: 1 }); }
  cambiarPractica(valor: string): void { this.navegar({ practicaMusicalId: this.numero(valor), pagina: 1 }); }
  cambiarTerritorioSonoro(valor: string): void { this.navegar({ territorioSonoroId: this.numero(valor), pagina: 1 }); }
  cambiarPeriodicidad(periodicidad: string): void { this.navegar({ periodicidad, pagina: 1 }); }
  cambiarCobertura(nivelCobertura: string): void { this.navegar({ nivelCobertura, pagina: 1 }); }
  cambiarPagina(pagina: number): void { if (pagina >= 1 && pagina <= this.totalPaginas()) this.navegar({ pagina }); }
  limpiarFiltros(): void { this.router.navigate([], { relativeTo: this.route, queryParams: { vista: this.vista() === 'mosaico' ? 'mosaico' : null }, replaceUrl: true }); }
  volverASimus(): void { this.router.navigateByUrl('/simus'); }
  territorio(festival: FestivalPublico): string { return [festival.territorioPrincipal.municipio, festival.territorioPrincipal.departamento].filter(Boolean).join(', ') || 'Territorio por confirmar'; }
  nombres(valores: CatalogoFestivalPublico[]): string { return valores.map(item => item.nombre).join(', '); }

  private cargarFestivales(): void {
    this.cargando.set(true); this.error.set('');
    this.festivalesPublicos.consultarFestivales({ limit: this.limitePagina, offset: (this.pagina() - 1) * this.limitePagina, busqueda: this.busqueda(), departamento: this.departamento(), municipio: this.municipio(), practicaMusicalId: this.practicaMusicalId() ?? undefined, territorioSonoroId: this.territorioSonoroId() ?? undefined, periodicidad: this.periodicidad(), nivelCobertura: this.nivelCobertura() }).subscribe({
      next: respuesta => { this.festivales.set(respuesta.items); this.total.set(respuesta.total); this.cargando.set(false); },
      error: error => { this.error.set(error?.message || 'No fue posible consultar los Festivales públicos.'); this.cargando.set(false); },
    });
  }

  private navegar(cambios: Partial<{ busqueda: string; departamento: string; municipio: string; practicaMusicalId: number | null; territorioSonoroId: number | null; periodicidad: string; nivelCobertura: string; vista: VistaExploracion; pagina: number }>): void {
    const estado = { busqueda: this.busqueda(), departamento: this.departamento(), municipio: this.municipio(), practicaMusicalId: this.practicaMusicalId(), territorioSonoroId: this.territorioSonoroId(), periodicidad: this.periodicidad(), nivelCobertura: this.nivelCobertura(), vista: this.vista(), pagina: this.pagina(), ...cambios };
    this.router.navigate([], { relativeTo: this.route, queryParams: { q: estado.busqueda || null, departamento: estado.departamento || null, municipio: estado.municipio || null, practica: estado.practicaMusicalId || null, territorioSonoro: estado.territorioSonoroId || null, periodicidad: estado.periodicidad || null, cobertura: estado.nivelCobertura || null, vista: estado.vista === 'mosaico' ? 'mosaico' : null, pagina: estado.pagina > 1 ? estado.pagina : null } });
  }
  private numero(valor: string | null): number | null { const numero = Number(valor); return Number.isInteger(numero) && numero > 0 ? numero : null; }
}
