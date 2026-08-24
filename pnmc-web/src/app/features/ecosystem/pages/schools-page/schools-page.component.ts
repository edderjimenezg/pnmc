import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideArrowLeft, LucideArrowRight, LucideBuilding2, LucideLayoutGrid, LucideList, LucideMapPin, LucideSearch, LucideSlidersHorizontal } from '@lucide/angular';
import { BackendDataService } from '../../../../core/services/backend-data.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { CompactHeroComponent } from '../../../../shared/components/ui/compact-hero/compact-hero.component';
import { EcosystemMetric, EcosystemMetricsStripComponent } from '../../../../shared/components/ui/ecosystem-metrics-strip/ecosystem-metrics-strip.component';

type VistaExploracion = 'lista' | 'mosaico';
type School = { id: string; name: string; department: string; municipality: string; type: string; category: string; coverage: string; practices: string; sonorousTerritories: string; isActive: boolean; };

@Component({
  selector: 'app-schools-page', standalone: true,
  imports: [CommonModule, FormsModule, CompactHeroComponent, EcosystemMetricsStripComponent, LucideArrowLeft, LucideArrowRight, LucideBuilding2, LucideLayoutGrid, LucideList, LucideMapPin, LucideSearch, LucideSlidersHorizontal],
  templateUrl: './schools-page.component.html',
})
export class SchoolsPageComponent implements OnInit {
  private readonly backendData = inject(BackendDataService);
  private readonly navigation = inject(NavigationService);
  private readonly tamanoPagina = 20;

  readonly schools = signal<School[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');
  readonly department = signal('');
  readonly municipality = signal('');
  readonly practice = signal('');
  readonly sonorousTerritory = signal('');
  readonly vista = signal<VistaExploracion>('lista');
  readonly page = signal(1);
  readonly error = signal('');
  readonly departments = computed(() => [...new Set(this.schools().map(school => school.department).filter(Boolean))].sort());
  readonly municipalities = computed(() => [...new Set(this.schools().filter(school => !this.department() || school.department === this.department()).map(school => school.municipality).filter(Boolean))].sort());
  readonly practices = computed(() => this.uniqueValues(this.schools().flatMap(school => this.splitValues(school.practices))));
  readonly sonorousTerritories = computed(() => this.uniqueValues(this.schools().flatMap(school => this.splitValues(school.sonorousTerritories))));
  readonly filteredSchools = computed(() => {
    const term = this.search().trim().toLocaleLowerCase();
    return this.schools().filter(school => !term || [school.name, school.municipality, school.department, school.type, school.practices].filter(Boolean).join(' ').toLocaleLowerCase().includes(term))
      .filter(school => !this.department() || school.department === this.department())
      .filter(school => !this.municipality() || school.municipality === this.municipality())
      .filter(school => !this.practice() || this.splitValues(school.practices).includes(this.practice()))
      .filter(school => !this.sonorousTerritory() || this.splitValues(school.sonorousTerritories).includes(this.sonorousTerritory()));
  });
  readonly displayedSchools = computed(() => this.filteredSchools().slice((this.page() - 1) * this.tamanoPagina, this.page() * this.tamanoPagina));
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredSchools().length / this.tamanoPagina)));
  readonly hasFilters = computed(() => Boolean(this.search() || this.department() || this.municipality() || this.practice() || this.sonorousTerritory()));
  readonly metricas = computed<EcosystemMetric[]>(() => [
    { label: 'Resultados', value: this.filteredSchools().length, detail: this.hasFilters() ? 'según los filtros activos' : 'escuelas disponibles' },
    { label: 'Departamentos', value: new Set(this.filteredSchools().map(item => item.department).filter(Boolean)).size, detail: 'con presencia registrada' },
    { label: 'Municipios', value: new Set(this.filteredSchools().map(item => item.municipality).filter(Boolean)).size, detail: 'con registros disponibles' },
    { label: 'Prácticas', value: this.filteredSchools().filter(item => Boolean(item.practices)).length, detail: 'con información vinculada' },
  ]);

  ngOnInit(): void {
    this.backendData.fetchSchoolRecords({ limit: 500 }).subscribe({
      next: ({ records }) => { this.schools.set(records.map(record => this.toSchool(record))); this.loading.set(false); },
      error: () => { this.error.set('No fue posible cargar el directorio de escuelas en este momento.'); this.loading.set(false); },
    });
  }

  buscar(): void { this.page.set(1); }
  setDepartment(value: string): void { this.department.set(value); this.municipality.set(''); this.page.set(1); }
  setMunicipality(value: string): void { this.municipality.set(value); this.page.set(1); }
  setPractice(value: string): void { this.practice.set(value); this.page.set(1); }
  setSonorousTerritory(value: string): void { this.sonorousTerritory.set(value); this.page.set(1); }
  setView(value: VistaExploracion): void { this.vista.set(value); }
  changePage(value: number): void { if (value >= 1 && value <= this.totalPages()) this.page.set(value); }
  openMap(): void { this.navigation.navigateToMapLayer('Escuelas de Música', { targetView: 'map' }); }
  backToEcosystem(): void { this.navigation.routerNavigate('ecosistema-musical'); }
  openSchool(schoolId: string): void { this.navigation.routerNavigate(`ecosistema-musical/escuelas/${encodeURIComponent(schoolId)}`); }
  clearFilters(): void { this.search.set(''); this.department.set(''); this.municipality.set(''); this.practice.set(''); this.sonorousTerritory.set(''); this.page.set(1); }

  private toSchool(record: any): School {
    const fields = record?.fields || {};
    return { id: String(record?.id || fields['ID escuela'] || ''), name: fields['Nombre de la escuela'] || 'Escuela de música sin nombre', department: fields.Departamento || '', municipality: fields.Municipio || '', type: fields['Tipo de escuela'] || 'Proceso formativo', category: fields.Categoría || '', coverage: fields.Cobertura || '', practices: fields['Prácticas musicales'] || '', sonorousTerritories: fields['Territorios sonoros'] || '', isActive: fields.Estado !== 'Inactiva' };
  }

  private splitValues(value: string): string[] { return value.split(/[;,|]/).map(item => item.trim()).filter(Boolean); }
  private uniqueValues(values: string[]): string[] { return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')); }
}
