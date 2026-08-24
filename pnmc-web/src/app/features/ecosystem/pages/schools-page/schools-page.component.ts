import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideArrowRight, LucideBuilding2, LucideMapPin, LucideSearch, LucideUsersRound } from '@lucide/angular';
import { BackendDataService } from '../../../../core/services/backend-data.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { CompactHeroComponent } from '../../../../shared/components/ui/compact-hero/compact-hero.component';

type School = {
  id: string;
  name: string;
  department: string;
  municipality: string;
  type: string;
  category: string;
  coverage: string;
  students: number;
  groups: number;
  practices: string;
  isActive: boolean;
};

@Component({
  selector: 'app-schools-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CompactHeroComponent, LucideArrowRight, LucideBuilding2, LucideMapPin, LucideSearch, LucideUsersRound],
  templateUrl: './schools-page.component.html',
})
export class SchoolsPageComponent implements OnInit {
  private readonly backendData = inject(BackendDataService);
  private readonly navigation = inject(NavigationService);

  readonly schools = signal<School[]>([]);
  readonly loading = signal(true);
  readonly search = signal('');
  readonly department = signal('');
  readonly onlyActive = signal(true);
  readonly error = signal('');

  readonly departments = computed(() => [...new Set(this.schools().map(school => school.department).filter(Boolean))].sort());
  readonly filteredSchools = computed(() => {
    const term = this.search().trim().toLocaleLowerCase();
    return this.schools().filter(school => {
      const matchesTerm = !term || [school.name, school.municipality, school.department, school.type, school.practices]
        .filter(Boolean).join(' ').toLocaleLowerCase().includes(term);
      const matchesDepartment = !this.department() || school.department === this.department();
      return matchesTerm && matchesDepartment && (!this.onlyActive() || school.isActive);
    });
  });
  readonly displayedSchools = computed(() => this.filteredSchools().slice(0, 6));
  readonly totalStudents = computed(() => this.filteredSchools().reduce((total, school) => total + school.students, 0));
  readonly totalGroups = computed(() => this.filteredSchools().reduce((total, school) => total + school.groups, 0));
  readonly municipalities = computed(() => new Set(this.filteredSchools().map(school => school.municipality).filter(Boolean)).size);

  ngOnInit(): void {
    this.backendData.fetchSchoolRecords({ limit: 500 }).subscribe({
      next: ({ records }) => {
        this.schools.set(records.map(record => this.toSchool(record)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No fue posible cargar el directorio de escuelas en este momento.');
        this.loading.set(false);
      }
    });
  }

  setSearch(value: string): void { this.search.set(value); }
  setDepartment(value: string): void { this.department.set(value); }
  toggleActive(): void { this.onlyActive.update(value => !value); }

  openMap(): void {
    this.navigation.navigateToMapLayer('Escuelas de Música', { targetView: 'map' });
  }

  backToEcosystem(): void {
    this.navigation.navigate('simus');
  }

  openSchool(schoolId: string): void {
    this.navigation.routerNavigate(`ecosistema-musical/escuelas/${encodeURIComponent(schoolId)}`);
  }

  clearFilters(): void {
    this.search.set('');
    this.department.set('');
    this.onlyActive.set(true);
  }

  private toSchool(record: any): School {
    const fields = record?.fields || {};
    return {
      id: String(record?.id || fields['ID escuela'] || ''),
      name: fields['Nombre de la escuela'] || 'Escuela de música sin nombre',
      department: fields.Departamento || '',
      municipality: fields.Municipio || '',
      type: fields['Tipo de escuela'] || 'Proceso formativo',
      category: fields.Categoría || '',
      coverage: fields.Cobertura || '',
      students: Number(fields['Cantidad total de alumnos']) || 0,
      groups: Number(fields['Cantidad de agrupaciones vigentes']) || 0,
      practices: fields['Prácticas musicales'] || '',
      isActive: fields.Estado !== 'Inactiva',
    };
  }
}
