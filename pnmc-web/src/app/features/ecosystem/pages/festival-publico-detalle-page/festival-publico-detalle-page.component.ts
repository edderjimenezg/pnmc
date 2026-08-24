import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { LucideArrowLeft, LucideMail, LucideMapPin } from '@lucide/angular';
import { FestivalPublico, FestivalesPublicosService } from '../../../../core/services/festivales-publicos.service';
import { CompactHeroComponent } from '../../../../shared/components/ui/compact-hero/compact-hero.component';

@Component({
  selector: 'app-festival-publico-detalle-page',
  standalone: true,
  imports: [CommonModule, RouterLink, CompactHeroComponent, LucideArrowLeft, LucideMail, LucideMapPin],
  templateUrl: './festival-publico-detalle-page.component.html',
})
export class FestivalPublicoDetallePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly festivalesPublicos = inject(FestivalesPublicosService);
  private readonly title = inject(Title);

  readonly festival = signal<FestivalPublico | null>(null);
  readonly cargando = signal(true);

  ngOnInit(): void {
    const festivalId = this.route.snapshot.paramMap.get('festivalId') || '';
    this.festivalesPublicos.consultarFestival(festivalId).subscribe({
      next: festival => { this.festival.set(festival); this.title.setTitle(`${festival.nombre} | SIMUS`); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  territorio(festival: FestivalPublico): string {
    return [festival.territorioPrincipal.municipio, festival.territorioPrincipal.departamento].filter(Boolean).join(', ') || 'Territorio por confirmar';
  }

  volverADirectorio(): void { this.router.navigateByUrl('/ecosistema-musical/festivales'); }
}
