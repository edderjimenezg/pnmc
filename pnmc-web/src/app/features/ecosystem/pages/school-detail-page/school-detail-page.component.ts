import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LucideArrowLeft, LucideArrowRight, LucideBuilding2, LucideMail, LucideMapPin, LucidePhone, LucideUsersRound } from '@lucide/angular';
import { BackendDataService } from '../../../../core/services/backend-data.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { CompactHeroComponent } from '../../../../shared/components/ui/compact-hero/compact-hero.component';

type DetailField = { label: string; value: string | number; };
type DetailSection = { title: string; description: string; fields: DetailField[]; };

@Component({
  selector: 'app-school-detail-page',
  standalone: true,
  imports: [CommonModule, CompactHeroComponent, LucideArrowLeft, LucideArrowRight, LucideBuilding2, LucideMail, LucideMapPin, LucidePhone, LucideUsersRound],
  templateUrl: './school-detail-page.component.html',
})
export class SchoolDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly backendData = inject(BackendDataService);
  private readonly navigation = inject(NavigationService);
  readonly school = signal<any>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const schoolId = this.route.snapshot.paramMap.get('schoolId') || '';
    this.backendData.fetchSchoolRecords({ limit: 500 }).subscribe({
      next: ({ records }) => {
        const record = records.find(item => String(item.id) === schoolId);
        this.school.set(record ? this.toDetail(record) : null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  backToDirectory(): void { this.navigation.routerNavigate('ecosistema-musical/escuelas'); }
  openMap(): void { this.navigation.navigateToMapLayer('Escuelas de Música', { targetView: 'map' }); }

  private toDetail(record: any) {
    const fields = record.fields || {};
    const read = (...keys: string[]) => {
      const value = keys.map(key => fields[key]).find(value => value !== null && value !== undefined && value !== '');
      return value === null || value === undefined || value === '' ? 'Sin información reportada' : value;
    };
    const numberValue = (...keys: string[]) => {
      const value = Number(keys.map(key => fields[key]).find(value => value !== null && value !== undefined && value !== '') || 0);
      return Number.isFinite(value) && value > 0 ? value : 'Sin información reportada';
    };
    const students = Number(fields['Cantidad total de alumnos']) || 0;
    const groups = Number(fields['Cantidad de agrupaciones vigentes']) || 0;
    return {
      id: record.id,
      name: fields['Nombre de la escuela'] || 'Escuela de música',
      department: fields.Departamento || 'Departamento por confirmar',
      municipality: fields.Municipio || 'Municipio por confirmar',
      type: fields['Tipo de escuela'] || 'Proceso formativo',
      category: fields.Categoría || '',
      coverage: fields.Cobertura || '',
      location: fields['Sede de trabajo'] || '',
      practices: fields['Prácticas musicales'] || '',
      territories: fields['Territorios sonoros'] || '',
      training: fields['Talleres independientes'] || '',
      students,
      groups,
      email: fields['Correo institucional o de contacto'] || '',
      phone: fields['Celular o contacto del director'] || '',
      community: fields['Cuenta con organización comunitaria'] || 'No reportado',
      active: fields.Estado !== 'Inactiva',
      sections: <DetailSection[]>[
        {
          title: 'Institucionalidad y gestión',
          description: 'Información de identificación, condición jurídica y relación institucional.',
          fields: [
            { label: 'ID de la entidad', value: read('ID de la entidad', 'ID escuela') },
            { label: 'Estado del registro', value: read('Estado') },
            { label: 'Escuela creada legalmente', value: read('Escuela creada legalmente') },
            { label: 'Personería jurídica', value: read('Tiene personería jurídica') },
            { label: 'Naturaleza', value: read('Naturaleza') },
            { label: 'Entidad de la que depende', value: read('Entidad de la que depende') },
          ],
        },
        {
          title: 'Dirección y equipo humano',
          description: 'Equipo directivo, docente y apoyo administrativo vinculado al proceso.',
          fields: [
            { label: 'Director o directora', value: read('Nombre del director') },
            { label: 'Vinculación de dirección', value: read('Tipo de vinculación del director') },
            { label: 'Docentes vinculados', value: numberValue('Cantidad total de docentes vinculados') },
            { label: 'Docentes con formación musical', value: numberValue('Cantidad de docentes con pregrado en música') },
            { label: 'Apoyo administrativo', value: read('Cuenta con apoyo administrativo') },
            { label: 'Personal de apoyo en nómina', value: numberValue('Cantidad de apoyo en nómina') },
          ],
        },
        {
          title: 'Sede, dotación y conectividad',
          description: 'Condiciones físicas y recursos disponibles para la actividad musical.',
          fields: [
            { label: 'Sede de trabajo', value: read('Sede de trabajo') },
            { label: 'Espacio de formación', value: read('Espacio') },
            { label: 'Sede adecuada acústicamente', value: read('Sede adecuada acústicamente') },
            { label: 'Instrumentos disponibles', value: numberValue('Cantidad total de instrumentos') },
            { label: 'Material pedagógico', value: read('Cuenta con material pedagógico') },
            { label: 'Acceso a internet', value: read('Tiene acceso a internet') },
          ],
        },
        {
          title: 'Estudiantes e inclusión',
          description: 'Composición de la población atendida y condiciones de acceso.',
          fields: [
            { label: 'Estudiantes matriculados', value: students || 'Sin información reportada' },
            { label: 'Estudiantes rurales', value: numberValue('Cantidad de alumnos rural') },
            { label: 'Estudiantes urbanos', value: numberValue('Cantidad de alumnos urbana') },
            { label: 'Estudiantes con discapacidad', value: numberValue('Cantidad de alumnos con discapacidad') },
            { label: 'Estudiantes en condiciones especiales', value: numberValue('Cantidad total de alumnos con condiciones especiales') },
            { label: 'Población étnica reportada', value: numberValue('Cantidad total de alumnos por etnia') },
          ],
        },
        {
          title: 'Formación y prácticas musicales',
          description: 'Oferta pedagógica, procesos formativos y saberes musicales desarrollados.',
          fields: [
            { label: 'Procesos de formación', value: read('Procesos de formación', 'Talleres independientes') },
            { label: 'Prácticas musicales', value: read('Prácticas musicales') },
            { label: 'Prácticas orientadas por músico', value: read('Prácticas musicales orientadas por músico') },
            { label: 'Programas formulados por escrito', value: read('Programas formulados por escrito') },
            { label: 'Iniciación · intensidad semanal', value: read('Iniciación: intensidad horaria semanal') },
            { label: 'Básico · intensidad semanal', value: read('Básico: intensidad horaria semanal') },
          ],
        },
        {
          title: 'Organización y circulación',
          description: 'Capacidad organizativa, agrupaciones y actividad de circulación reciente.',
          fields: [
            { label: 'Organización comunitaria', value: read('Cuenta con organización comunitaria') },
            { label: 'Integrantes de la organización', value: numberValue('Integrantes de la organización') },
            { label: 'Agrupaciones vigentes', value: groups || 'Sin información reportada' },
            { label: 'Presentaciones locales · último año', value: numberValue('Cantidad de presentaciones en la localidad (último año)') },
            { label: 'Giras nacionales · último año', value: numberValue('Cantidad de giras nacionales (último año)') },
            { label: 'Giras internacionales · último año', value: numberValue('Cantidad de giras internacionales (último año)') },
          ],
        },
      ],
    };
  }
}
