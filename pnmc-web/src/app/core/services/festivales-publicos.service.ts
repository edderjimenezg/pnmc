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
}

export interface RespuestaPaginada<T> {
  items: T[];
  limit: number;
  offset: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class FestivalesPublicosService {
  private readonly apiClient = inject(ApiClientService);

  consultarFestivales(): Observable<RespuestaPaginada<FestivalPublico>> {
    return this.apiClient.get<RespuestaPaginada<FestivalPublico>>('/api/v1/publico/festivales', {
      params: { limit: 500, offset: 0 },
      errorFallback: 'No fue posible consultar los Festivales públicos.',
    });
  }

  consultarFestival(festivalId: string): Observable<FestivalPublico> {
    return this.apiClient.get<FestivalPublico>(`/api/v1/publico/festivales/${encodeURIComponent(festivalId)}`, {
      errorFallback: 'No fue posible consultar esta ficha pública del Festival.',
    });
  }
}
