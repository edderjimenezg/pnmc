import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../http/api-client.service';

export interface TerritorioPrincipalPublico {
  departamento: string | null;
  municipio: string | null;
  nivelCobertura: string;
}

export interface CatalogoFestivalPublico {
  id: number;
  nombre: string;
}

export interface FestivalPublico {
  id: string;
  nombre: string;
  descripcion: string | null;
  organizacionResponsable: string | null;
  territorioPrincipal: TerritorioPrincipalPublico;
  periodicidad: string | null;
  practicasMusicales: CatalogoFestivalPublico[];
  territoriosSonoros: CatalogoFestivalPublico[];
  correoContacto: string | null;
  telefonoContacto: string | null;
  sitioWeb: string | null;
  instagram: string | null;
  facebook: string | null;
  lugarEspecifico: string | null;
  fechaPublicacion: string | null;
}

export interface RespuestaPaginada<T> {
  items: T[];
  limit: number;
  offset: number;
  total: number;
}

export interface MunicipioFestivalPublico { departamento: string; municipio: string; }
export interface FiltrosFestivalesPublicos {
  departamentos: string[];
  municipios: MunicipioFestivalPublico[];
  practicasMusicales: CatalogoFestivalPublico[];
  territoriosSonoros: CatalogoFestivalPublico[];
  periodicidades: string[];
  nivelesCobertura: string[];
}
export interface ConsultaFestivalesPublicos {
  limit?: number; offset?: number; busqueda?: string; departamento?: string; municipio?: string;
  practicaMusicalId?: number; territorioSonoroId?: number; periodicidad?: string; nivelCobertura?: string;
}

export interface DistribucionAnaliticaFestival { nombre: string; total: number; }
export interface ResumenAnaliticoFestivales {
  totalFestivales: number;
  porDepartamento: DistribucionAnaliticaFestival[];
  porMunicipio: DistribucionAnaliticaFestival[];
  porPracticaMusical: DistribucionAnaliticaFestival[];
  porTerritorioSonoro: DistribucionAnaliticaFestival[];
  porPeriodicidad: DistribucionAnaliticaFestival[];
}

@Injectable({ providedIn: 'root' })
export class FestivalesPublicosService {
  private readonly apiClient = inject(ApiClientService);

  consultarFestivales(consulta: ConsultaFestivalesPublicos = {}): Observable<RespuestaPaginada<FestivalPublico>> {
    const params: Record<string, string | number | boolean> = { limit: consulta.limit ?? 20, offset: consulta.offset ?? 0 };
    if (consulta.busqueda) params['busqueda'] = consulta.busqueda;
    if (consulta.departamento) params['departamento'] = consulta.departamento;
    if (consulta.municipio) params['municipio'] = consulta.municipio;
    if (consulta.practicaMusicalId) params['practicaMusicalId'] = consulta.practicaMusicalId;
    if (consulta.territorioSonoroId) params['territorioSonoroId'] = consulta.territorioSonoroId;
    if (consulta.periodicidad) params['periodicidad'] = consulta.periodicidad;
    if (consulta.nivelCobertura) params['nivelCobertura'] = consulta.nivelCobertura;
    return this.apiClient.get<RespuestaPaginada<FestivalPublico>>('/api/v1/publico/festivales', {
      params,
      errorFallback: 'No fue posible consultar los Festivales públicos.',
    });
  }

  consultarFiltros(): Observable<FiltrosFestivalesPublicos> {
    return this.apiClient.get<FiltrosFestivalesPublicos>('/api/v1/publico/festivales/filtros', {
      errorFallback: 'No fue posible consultar los filtros de Festivales.',
    });
  }

  consultarFestival(festivalId: string): Observable<FestivalPublico> {
    return this.apiClient.get<FestivalPublico>(`/api/v1/publico/festivales/${encodeURIComponent(festivalId)}`, {
      errorFallback: 'No fue posible consultar esta ficha pública del Festival.',
    });
  }

  consultarResumenAnalitico(): Observable<ResumenAnaliticoFestivales> {
    return this.apiClient.get<ResumenAnaliticoFestivales>('/api/v1/publico/analitica/festivales/resumen', {
      errorFallback: 'No fue posible consultar el resumen analítico de Festivales.',
    });
  }
}
