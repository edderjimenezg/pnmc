import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LucideArrowLeft, LucideArrowRight, LucideBookOpen, LucideHammer, LucideLayoutGrid, LucideList, LucideMapPin, LucideSearch, LucideSlidersHorizontal, LucideStore } from '@lucide/angular';
import { BackendDataService } from '../../../../core/services/backend-data.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { CompactHeroComponent } from '../../../../shared/components/ui/compact-hero/compact-hero.component';
import { EcosystemMetric, EcosystemMetricsStripComponent } from '../../../../shared/components/ui/ecosystem-metrics-strip/ecosystem-metrics-strip.component';

type VistaExploracion = 'lista' | 'mosaico';
type TipoDirectorio = 'mercados-musicales' | 'redes-documentacion' | 'luteria';

type ConfiguracionDirectorio = {
  titulo: string;
  subtitulo: string;
  tabla: 'Mercados' | 'Redes' | 'Lutieres';
  capaMapa: 'Mercados Musicales' | 'Redes de Documentación' | 'Lutieres';
  marcador: string;
  placeholder: string;
  etiquetaTipo: string;
  icono: 'mercado' | 'red' | 'luteria';
};

type RegistroDirectorio = {
  id: string;
  nombre: string;
  departamento: string;
  municipio: string;
  descripcion: string;
  tipo: string;
  responsable: string;
  periodicidad: string;
  practicas: string;
  territoriosSonoros: string;
};

const CONFIGURACIONES: Record<TipoDirectorio, ConfiguracionDirectorio> = {
  'mercados-musicales': { titulo: 'Mercados musicales', subtitulo: 'Consulta nodos de intercambio, circulación y fortalecimiento profesional registrados en el Ecosistema Musical de Colombia.', tabla: 'Mercados', capaMapa: 'Mercados Musicales', marcador: 'Mercados musicales', placeholder: 'Mercado, organización o lugar', etiquetaTipo: 'Modalidad', icono: 'mercado' },
  'redes-documentacion': { titulo: 'Redes y documentación', subtitulo: 'Consulta redes, archivos y procesos de documentación musical disponibles en el Ecosistema Musical de Colombia.', tabla: 'Redes', capaMapa: 'Redes de Documentación', marcador: 'Redes y documentación', placeholder: 'Red, organización o lugar', etiquetaTipo: 'Tipo de red', icono: 'red' },
  luteria: { titulo: 'Lutería', subtitulo: 'Consulta saberes, talleres y servicios de construcción y reparación de instrumentos registrados en el Ecosistema Musical de Colombia.', tabla: 'Lutieres', capaMapa: 'Lutieres', marcador: 'Lutería', placeholder: 'Lutier, taller o lugar', etiquetaTipo: 'Oficio principal', icono: 'luteria' },
};

@Component({
  selector: 'app-ecosystem-directory-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CompactHeroComponent, EcosystemMetricsStripComponent, LucideArrowLeft, LucideArrowRight, LucideBookOpen, LucideHammer, LucideLayoutGrid, LucideList, LucideMapPin, LucideSearch, LucideSlidersHorizontal, LucideStore],
  templateUrl: './ecosystem-directory-page.component.html',
})
export class EcosystemDirectoryPageComponent implements OnInit {
  private readonly backendData = inject(BackendDataService);
  private readonly navigation = inject(NavigationService);
  private readonly route = inject(ActivatedRoute);
  private readonly tamanoPagina = 20;

  readonly configuracion = signal<ConfiguracionDirectorio>(CONFIGURACIONES['mercados-musicales']);
  readonly registros = signal<RegistroDirectorio[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly busqueda = signal('');
  readonly departamento = signal('');
  readonly municipio = signal('');
  readonly practica = signal('');
  readonly territorioSonoro = signal('');
  readonly vista = signal<VistaExploracion>('lista');
  readonly pagina = signal(1);
  readonly departamentos = computed(() => this.valoresUnicos(this.registros().map(item => item.departamento)));
  readonly municipios = computed(() => this.valoresUnicos(this.registros().filter(item => !this.departamento() || item.departamento === this.departamento()).map(item => item.municipio)));
  readonly practicas = computed(() => this.valoresUnicos(this.registros().flatMap(item => this.separarValores(item.practicas))));
  readonly territoriosSonoros = computed(() => this.valoresUnicos(this.registros().flatMap(item => this.separarValores(item.territoriosSonoros))));
  readonly filtrados = computed(() => {
    const termino = this.normalizar(this.busqueda());
    return this.registros()
      .filter(item => !termino || this.normalizar([item.nombre, item.departamento, item.municipio, item.descripcion, item.tipo, item.responsable, item.practicas, item.territoriosSonoros].join(' ')).includes(termino))
      .filter(item => !this.departamento() || item.departamento === this.departamento())
      .filter(item => !this.municipio() || item.municipio === this.municipio())
      .filter(item => !this.practica() || this.separarValores(item.practicas).includes(this.practica()))
      .filter(item => !this.territorioSonoro() || this.separarValores(item.territoriosSonoros).includes(this.territorioSonoro()));
  });
  readonly visibles = computed(() => this.filtrados().slice((this.pagina() - 1) * this.tamanoPagina, this.pagina() * this.tamanoPagina));
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.tamanoPagina)));
  readonly hayFiltros = computed(() => Boolean(this.busqueda() || this.departamento() || this.municipio() || this.practica() || this.territorioSonoro()));
  readonly metricas = computed<EcosystemMetric[]>(() => [
    { label: 'Registros', value: this.filtrados().length, detail: this.hayFiltros() ? 'según los filtros activos' : 'disponibles públicamente' },
    { label: 'Departamentos', value: new Set(this.filtrados().map(item => item.departamento).filter(Boolean)).size, detail: 'con presencia registrada' },
    { label: 'Municipios', value: new Set(this.filtrados().map(item => item.municipio).filter(Boolean)).size, detail: 'con registros disponibles' },
    { label: 'Con prácticas', value: this.filtrados().filter(item => Boolean(item.practicas)).length, detail: 'con información vinculada' },
  ]);

  ngOnInit(): void {
    const seccion = this.route.snapshot.data['directorioEcosistema'] as TipoDirectorio;
    this.configuracion.set(CONFIGURACIONES[seccion] || CONFIGURACIONES['mercados-musicales']);
    this.backendData.fetchModuleRecords(this.configuracion().tabla, { limit: 500 }).subscribe({
      next: ({ records }) => { this.registros.set(records.map(record => this.aRegistro(record)).filter(record => Boolean(record.nombre))); this.cargando.set(false); },
      error: () => { this.error.set('No fue posible cargar este directorio en este momento.'); this.cargando.set(false); },
    });
  }

  buscar(): void { this.pagina.set(1); }
  cambiarDepartamento(valor: string): void { this.departamento.set(valor); this.municipio.set(''); this.pagina.set(1); }
  cambiarMunicipio(valor: string): void { this.municipio.set(valor); this.pagina.set(1); }
  cambiarPractica(valor: string): void { this.practica.set(valor); this.pagina.set(1); }
  cambiarTerritorioSonoro(valor: string): void { this.territorioSonoro.set(valor); this.pagina.set(1); }
  cambiarVista(valor: VistaExploracion): void { this.vista.set(valor); }
  cambiarPagina(valor: number): void { if (valor >= 1 && valor <= this.totalPaginas()) this.pagina.set(valor); }
  limpiarFiltros(): void { this.busqueda.set(''); this.departamento.set(''); this.municipio.set(''); this.practica.set(''); this.territorioSonoro.set(''); this.pagina.set(1); }
  volverAEcosistema(): void { this.navigation.routerNavigate('ecosistema-musical'); }
  abrirMapa(): void { this.navigation.navigateToMapLayer(this.configuracion().capaMapa, { targetView: 'map' }); }

  private aRegistro(record: any): RegistroDirectorio {
    const fields = record?.fields || {};
    const config = this.configuracion();
    const valor = (...claves: string[]) => claves.map(clave => String(fields[clave] ?? '').trim()).find(Boolean) || '';
    const esMercado = config.tabla === 'Mercados';
    const esRed = config.tabla === 'Redes';
    return {
      id: String(record?.id || ''),
      nombre: esMercado ? valor('Nombre del mercado', 'name', 'nombre') : valor('name', 'nombre'),
      departamento: valor('Departamento', 'departamento'),
      municipio: valor('Municipio', 'municipio'),
      descripcion: valor('Descripción', 'descripcion', 'desc'),
      tipo: esMercado ? valor('Modo del mercado', 'Ámbito del mercado') : esRed ? valor('centerType', 'Tipo de organización') : valor('oficio', 'Oficio'),
      responsable: esMercado ? valor('¿Cuál es la entidad, organización o corporación responsable del mercado? ', 'responsable') : '',
      periodicidad: esMercado ? valor('Periodicidad del mercado') : '',
      practicas: valor('Prácticas musicales'),
      territoriosSonoros: valor('Territorios sonoros'),
    };
  }

  private separarValores(valor: string): string[] { return valor.split(/[;,|]/).map(item => item.trim()).filter(Boolean); }
  private valoresUnicos(valores: string[]): string[] { return [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')); }
  private normalizar(valor: string): string { return valor.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
}
