import { Component, EventEmitter, OnInit, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideArrowRight, LucideArrowUpRight } from '@lucide/angular';
import { MapDataService } from '../../../../core/services/map-data.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { ContentWrapperComponent } from '../../../../shared/components/ui/content-wrapper/content-wrapper.component';
import { SectionHeaderComponent } from '../../../../shared/components/ui/section-header/section-header.component';
import { LoadingStateComponent, ErrorStateComponent } from '../../../../shared/components/ui/remote-state/remote-state.component';
import { ECOSYSTEM_CATEGORIES, EcosystemCategory } from '../../../../core/services/ecosystem-categories.config';
import { RANDOM_GALLERY_IMAGES } from '../../../../core/services/media-library.config';
import * as MapDomain from '../../../map/domain/map-domain';

type EcosystemCategoryCard = EcosystemCategory & { img: string };

@Component({
  selector: 'app-mapa-ecosistemico-preview',
  standalone: true,
  imports: [
    CommonModule,
    LucideArrowRight,
    LucideArrowUpRight,
    ContentWrapperComponent,
    SectionHeaderComponent,
    LoadingStateComponent,
    ErrorStateComponent
  ],
  templateUrl: './mapa-ecosistemico-preview.component.html'
})
export class MapaEcosistemicoPreviewComponent implements OnInit {
  @Output() navigateToMapLayer = new EventEmitter<string>();
  @Output() openParticipation = new EventEmitter<void>();

  private readonly navigation = inject(NavigationService);
  private readonly mapDataService = inject(MapDataService);

  readonly categories: EcosystemCategoryCard[] = ECOSYSTEM_CATEGORIES.filter(category => category.visibleInHome).map((category, index) => ({
    ...category,
    img: RANDOM_GALLERY_IMAGES[6 + index],
  }));

  isLoading = false;
  isRefreshing = false;
  isError = false;
  error: any = null;

  readonly recordsByType = signal<Record<string, number>>({});

  readonly totalRecords = computed(() => Object.values(this.recordsByType()).reduce((sum, value) => sum + value, 0));

  ngOnInit(): void {
    this.loadMapData();
  }

  loadMapData(isRefresh = false): void {
    if (isRefresh) {
      this.isRefreshing = true;
    } else {
      this.isLoading = true;
    }
    this.isError = false;
    this.error = null;

    this.mapDataService.fetchMapCountsBundle().subscribe({
      next: (data) => {
        this.recordsByType.set({
          schools: data.schoolRecords?.length || 0,
          festivals: data.festivalRecords?.length || 0,
          markets: data.marketRecords?.length || 0,
          networks: data.redesRecords?.length || 0,
          lutiers: data.luthierRecords?.length || 0,
        });
        this.isLoading = false;
        this.isRefreshing = false;
      },
      error: (err) => {
        this.error = err;
        this.isError = true;
        this.isLoading = false;
        this.isRefreshing = false;
      }
    });
  }

  retryMapData(): void {
    this.loadMapData(false);
  }

  count(category: EcosystemCategory): number {
    return category.countKey ? this.recordsByType()[category.countKey] || 0 : 0;
  }

  formatMetricValue(value: number): string {
    return MapDomain.formatMetricValue(value);
  }

  openCategory(category: EcosystemCategory): void {
    this.navigation.routerNavigate(category.route);
  }

  onNavigateToMapLayer(layer: string): void {
    this.navigateToMapLayer.emit(layer);
  }

  onOpenParticipation(): void {
    this.openParticipation.emit();
  }

  onOpenSimus(): void {
    this.navigation.routerNavigate('ecosistema-musical');
  }
}
