import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { LucideArrowRight, LucideBookOpen, LucideBuilding2, LucideCircleHelp, LucideLandmark, LucideLibrary, LucideMap, LucideMapPin, LucideMusic2, LucideUsers2, LucideUsersRound } from '@lucide/angular';
import { ECOSYSTEM_CATEGORIES, EcosystemCategory } from '../../../../core/services/ecosystem-categories.config';
import { MapDataService } from '../../../../core/services/map-data.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { PageHeroComponent } from '../../../../shared/components/ui/page-hero/page-hero.component';

@Component({
  selector: 'app-simus-home-page',
  standalone: true,
  imports: [CommonModule, PageHeroComponent, LucideArrowRight, LucideBookOpen, LucideBuilding2, LucideCircleHelp, LucideLandmark, LucideLibrary, LucideMap, LucideMapPin, LucideMusic2, LucideUsers2, LucideUsersRound],
  templateUrl: './simus-home-page.component.html',
})
export class SimusHomePageComponent implements OnInit {
  private readonly navigation = inject(NavigationService);
  private readonly mapData = inject(MapDataService);

  readonly accessPaths = [
    { title: 'Lee el territorio', description: 'Conecta las categorías y su presencia geográfica en el Mapa Ecosistémico.', icon: 'map', action: () => this.navigation.navigate('mapa') },
    { title: 'Consulta contenidos', description: 'Accede a publicaciones, documentos y recursos desde Editorial.', icon: 'editorial', action: () => this.navigation.navigate('editorial') },
    { title: 'Mantente al día', description: 'Conoce noticias y agenda de la actividad musical del país.', icon: 'news', action: () => this.navigation.navigate('noticias') },
  ];
  readonly simusPaths = [
    { title: 'Acerca de SIMUS', description: 'Conoce el propósito, alcance y principios de este sistema de información.', icon: 'about', path: 'simus/acerca-de' },
    { title: 'Ayuda y tutoriales', description: 'Encuentra orientación para navegar, consultar y participar en SIMUS.', icon: 'help', path: 'simus/ayuda' },
    { title: 'Ingresar', description: 'Accede a los espacios de gestión y actualización de información.', icon: 'login', path: 'simus/ingresar' },
    { title: 'Ser parte del SIMUS', description: 'Crea tu cuenta o registra una organización para participar en SIMUS.', icon: 'participate', path: 'registro' },
  ];

  // Ecosistema musical: antes una sección aparte, ahora vive dentro de SIMUS.
  readonly recordsByType = signal<Record<string, number>>({});
  readonly isLoadingEcosystem = signal(true);

  readonly ecosystemCategories: EcosystemCategory[] = ECOSYSTEM_CATEGORIES;

  readonly actorCategories = computed(() => this.ecosystemCategories.filter(category => category.group === 'actors'));
  readonly processCategories = computed(() => this.ecosystemCategories.filter(category => category.group === 'processes'));

  ngOnInit(): void {
    this.mapData.fetchMapCountsBundle().subscribe({
      next: data => {
        this.recordsByType.set({
          schools: data.schoolRecords?.length || 0,
          festivals: data.festivalRecords?.length || 0,
          markets: data.marketRecords?.length || 0,
          networks: data.redesRecords?.length || 0,
          lutiers: data.luthierRecords?.length || 0,
        });
        this.isLoadingEcosystem.set(false);
      },
      error: () => this.isLoadingEcosystem.set(false),
    });
  }

  count(category: EcosystemCategory): number { return category.countKey ? this.recordsByType()[category.countKey] || 0 : 0; }
  openCategory(category: EcosystemCategory): void { this.navigation.routerNavigate(category.route); }
  openMapLayer(layer = 'General'): void { this.navigation.navigateToMapLayer(layer, { targetView: 'map' }); }
  openParticipation(): void { this.navigation.routerNavigate('registro'); }

  go(path: string): void { this.navigation.routerNavigate(path); }
}
