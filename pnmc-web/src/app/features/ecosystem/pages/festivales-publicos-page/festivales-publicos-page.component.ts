import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowRight, LucideMapPin, LucideMusic2, LucideSearch } from '@lucide/angular';
import { FestivalPublico, FestivalesPublicosService, ResumenAnaliticoFestivales } from '../../../../core/services/festivales-publicos.service';
import { CompactHeroComponent } from '../../../../shared/components/ui/compact-hero/compact-hero.component';

@Component({
  selector: 'app-festivales-publicos-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CompactHeroComponent, LucideArrowRight, LucideMapPin, LucideMusic2, LucideSearch],
  templateUrl: './festivales-publicos-page.component.html',
})
export class FestivalesPublicosPageComponent implements OnInit {
  private readonly festivalesPublicos = inject(FestivalesPublicosService);
  private readonly router = inject(Router);

  readonly festivales = signal<FestivalPublico[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly resumen = signal<ResumenAnaliticoFestivales | null>(null);
  readonly busqueda = signal('');
  readonly resultados = computed(() => {
    const termino = this.busqueda().trim().toLocaleLowerCase();
    if (!termino) return this.festivales();
    return this.festivales().filter(festival => [
      festival.nombre,
      festival.organizacionResponsable,
      festival.territorioPrincipal.departamento,
      festival.territorioPrincipal.municipio,
      ...festival.practicasMusicales.map(item => item.nombre),
      ...festival.territoriosSonoros.map(item => item.nombre),
    ].filter(Boolean).join(' ').toLocaleLowerCase().includes(termino));
  });

  ngOnInit(): void {
    this.festivalesPublicos.consultarFestivales().subscribe({
      next: respuesta => { this.festivales.set(respuesta.items); this.cargando.set(false); },
      error: error => { this.error.set(error?.message || 'No fue posible consultar los Festivales públicos.'); this.cargando.set(false); },
    });
    this.festivalesPublicos.consultarResumenAnalitico().subscribe({ next: resumen => this.resumen.set(resumen), error: () => undefined });
  }

  actualizarBusqueda(valor: string): void { this.busqueda.set(valor); }
  volverASimus(): void { this.router.navigateByUrl('/simus'); }

  territorio(festival: FestivalPublico): string {
    return [festival.territorioPrincipal.municipio, festival.territorioPrincipal.departamento].filter(Boolean).join(', ') || 'Territorio por confirmar';
  }

  nombres(valores: { nombre: string }[]): string { return valores.map(item => item.nombre).join(', '); }
}
