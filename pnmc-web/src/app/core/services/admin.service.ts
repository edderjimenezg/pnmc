import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiClientService } from '../http/api-client.service';

export interface CoincidenciaFestivalHistorico {
  festivalId: string;
  nombreFestival: string;
  descripcion: string | null;
  codigoDepartamento: string | null;
  nombreDepartamento: string | null;
  codigoMunicipio: string | null;
  nombreMunicipio: string | null;
  organizadorHistorico: string | null;
  tipoCoincidencia: 'NominalExacta' | 'NominalYTerritorial' | 'EvidenciaHistoricaTerritorial';
  evidencias: string[];
}

export interface SolicitudAdministracionFestival {
  id: string;
  festivalId: string;
  nombreFestival: string;
  organizacionId: string;
  nombreOrganizacion: string;
  personaSolicitanteId: string;
  nombrePersonaSolicitante: string;
  justificacion: string;
  evidenciasAutomaticas: string[];
  estado: string;
  respuestaSolicitante: string | null;
  comentarioDecision: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaDecision: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private apiClient: ApiClientService) {}

  // --- Autenticación ---

  loginAdmin(payload: { email: string; password?: string }): Observable<any> {
    return this.apiClient.post<any>('/api/v1/admin/auth/login', payload, {
      errorFallback: 'No fue posible iniciar sesión',
    });
  }

  fetchAdminMe(): Observable<any> {
    return this.apiClient.get<any>('/api/v1/admin/auth/me', {
      errorFallback: 'No hay una sesión administrativa activa',
    });
  }

  logoutAdmin(): Observable<any> {
    return this.apiClient.post<any>('/api/v1/admin/auth/logout', {}, {
      errorFallback: 'No fue posible cerrar la sesión',
    });
  }

  // --- Usuarios del Sistema ---

  fetchAdminUsers(): Observable<any> {
    return this.apiClient.get<any>('/api/v1/admin/auth/users', {
      errorFallback: 'No fue posible consultar usuarios',
    });
  }

  saveAdminUser(payload: any): Observable<any> {
    return this.apiClient.post<any>('/api/v1/admin/auth/users', payload, {
      errorFallback: 'No fue posible guardar el usuario',
    });
  }

  deleteAdminUser(id: string): Observable<any> {
    return this.apiClient.delete<any>(`/api/v1/admin/auth/users/${id}`, {
      errorFallback: 'No fue posible eliminar el usuario',
    });
  }

  updateProfile(payload: any): Observable<any> {
    return this.apiClient.put<any>('/api/v1/admin/auth/profile', payload, {
      errorFallback: 'No fue posible actualizar el perfil',
    });
  }

  // --- Solicitudes de Aliados ---

  fetchAllyRequests(params: any = {}): Observable<any> {
    return this.apiClient.get<any>('/api/v1/admin/ally-requests', {
      params,
      errorFallback: 'No fue posible consultar solicitudes de aliado',
    });
  }

  updateAllyRequestStatus(payload: { id: string; status: string; comment?: string }): Observable<any> {
    return this.apiClient.post<any>(`/api/v1/admin/ally-requests/${payload.id}/status`, {
      status: payload.status,
      comment: payload.comment || '',
    }, {
      errorFallback: 'No fue posible actualizar la solicitud de aliado',
    });
  }

  createAllyRequest(payload: any): Observable<any> {
    return this.apiClient.post<any>('/api/v1/admin/ally-requests', payload, {
      errorFallback: 'No fue posible registrar la solicitud de aliado',
    });
  }

  // --- Usuarios Externos y Registro ---

  registerExternalUser(payload: any): Observable<any> {
    return this.apiClient.post<any>('/api/v1/external/auth/register', payload, {
      errorFallback: 'No fue posible registrar el usuario externo',
    });
  }

  verifyExternalEmail(payload: any): Observable<any> {
    return this.apiClient.post<any>('/api/v1/external/auth/verify-email', payload, {
      errorFallback: 'No fue posible verificar el correo',
    });
  }

  loginExternal(payload: { email: string; password: string }): Observable<any> {
    return this.apiClient.post<any>('/api/v1/external/auth/login', payload, {
      errorFallback: 'No fue posible iniciar sesión en SIMUS',
    });
  }

  fetchExternalSession(): Observable<any> {
    return this.apiClient.get<any>('/api/v1/external/auth/me', {
      errorFallback: 'No hay una sesión externa activa',
    });
  }

  logoutExternal(): Observable<any> {
    return this.apiClient.post<any>('/api/v1/external/auth/logout', {}, {
      errorFallback: 'No fue posible cerrar la sesión externa',
    });
  }

  createExternalOrganization(payload: any): Observable<any> {
    return this.apiClient.get<{ requestToken: string }>('/api/v1/external/organizations/csrf', {
      errorFallback: 'No fue posible preparar el registro de organización',
    }).pipe(
      switchMap(token => this.apiClient.post<any>('/api/v1/external/organizations/', payload, {
        headers: { 'X-CSRF-TOKEN': token.requestToken },
        errorFallback: 'No fue posible registrar la organización',
      }))
    );
  }

  fetchExternalDivipola(): Observable<any[]> {
    return this.apiClient.get<any[]>('/api/v1/external/organizations/divipola', {
      errorFallback: 'No fue posible cargar los territorios disponibles',
    });
  }

  fetchExternalOrganizations(): Observable<any[]> {
    return this.apiClient.get<any[]>('/api/v1/externo/organizaciones/mis', {
      errorFallback: 'No fue posible consultar tus organizaciones',
    });
  }

  fetchFestivalCatalogs(): Observable<any> {
    return this.apiClient.get<any>('/api/v1/externo/catalogos/festival', {
      errorFallback: 'No fue posible cargar los catálogos para el Festival',
    });
  }

  fetchDraftFestivals(organizacionId: number): Observable<any[]> {
    return this.apiClient.get<any[]>(`/api/v1/externo/organizaciones/${organizacionId}/festivales`, {
      errorFallback: 'No fue posible consultar los Festivales de la organización',
    });
  }

  fetchHistoricalFestivalMatches(organizacionId: number): Observable<CoincidenciaFestivalHistorico[]> {
    return this.apiClient.get<CoincidenciaFestivalHistorico[]>(`/api/v1/externo/organizaciones/${organizacionId}/festivales/coincidencias`, {
      errorFallback: 'No fue posible consultar los registros históricos relacionados con esta organización',
    });
  }

  fetchFestivalAdministrationRequests(organizacionId: number): Observable<SolicitudAdministracionFestival[]> {
    return this.apiClient.get<SolicitudAdministracionFestival[]>(`/api/v1/externo/organizaciones/${organizacionId}/solicitudes-administracion-festival`, {
      errorFallback: 'No fue posible consultar las solicitudes de administración',
    });
  }

  requestFestivalAdministration(organizacionId: number, festivalId: number, justificacion: string): Observable<SolicitudAdministracionFestival> {
    return this.apiClient.get<{ requestToken: string }>('/api/v1/external/organizations/csrf', {
      errorFallback: 'No fue posible preparar la solicitud de administración',
    }).pipe(
      switchMap(token => this.apiClient.post<SolicitudAdministracionFestival>(`/api/v1/externo/organizaciones/${organizacionId}/festivales/${festivalId}/solicitudes-administracion`, { justificacion }, {
        headers: { 'X-CSRF-TOKEN': token.requestToken },
        errorFallback: 'No fue posible enviar la solicitud de administración',
      }))
    );
  }

  respondFestivalAdministrationRequest(organizacionId: number, solicitudId: string, respuesta: string): Observable<SolicitudAdministracionFestival> {
    return this.apiClient.get<{ requestToken: string }>('/api/v1/external/organizations/csrf', {
      errorFallback: 'No fue posible preparar la respuesta',
    }).pipe(
      switchMap(token => this.apiClient.post<SolicitudAdministracionFestival>(`/api/v1/externo/organizaciones/${organizacionId}/solicitudes-administracion-festival/${solicitudId}/responder-informacion`, { respuesta }, {
        headers: { 'X-CSRF-TOKEN': token.requestToken },
        errorFallback: 'No fue posible enviar la información adicional',
      }))
    );
  }

  createDraftFestival(organizacionId: number, payload: any): Observable<any> {
    return this.apiClient.get<{ requestToken: string }>('/api/v1/external/organizations/csrf', {
      errorFallback: 'No fue posible preparar el registro del Festival',
    }).pipe(
      switchMap(token => this.apiClient.post<any>(`/api/v1/externo/organizaciones/${organizacionId}/festivales`, payload, {
        headers: { 'X-CSRF-TOKEN': token.requestToken },
        errorFallback: 'No fue posible guardar el Festival como borrador',
      }))
    );
  }

  sendFestivalToReview(festivalId: number): Observable<any> {
    return this.apiClient.get<{ requestToken: string }>('/api/v1/external/organizations/csrf', {
      errorFallback: 'No fue posible preparar el envío a revisión',
    }).pipe(
      switchMap(token => this.apiClient.post<any>(`/api/v1/externo/festivales/${festivalId}/enviar-a-revision`, {}, {
        headers: { 'X-CSRF-TOKEN': token.requestToken },
        errorFallback: 'No fue posible enviar el Festival a revisión',
      }))
    );
  }

  updateExternalFestival(festivalId: number, payload: any): Observable<any> {
    return this.apiClient.get<{ requestToken: string }>('/api/v1/external/organizations/csrf', {
      errorFallback: 'No fue posible preparar la actualización del Festival',
    }).pipe(
      switchMap(token => this.apiClient.put<any>(`/api/v1/externo/festivales/${festivalId}`, payload, {
        headers: { 'X-CSRF-TOKEN': token.requestToken },
        errorFallback: 'No fue posible guardar los ajustes del Festival',
      }))
    );
  }

  iniciarPropuestaCambioFestival(festivalId: number): Observable<any> {
    return this.apiClient.get<{ requestToken: string }>('/api/v1/external/organizations/csrf', {
      errorFallback: 'No fue posible preparar la propuesta de cambios del Festival',
    }).pipe(
      switchMap(token => this.apiClient.post<any>(`/api/v1/externo/festivales/${festivalId}/propuestas-cambio`, {}, {
        headers: { 'X-CSRF-TOKEN': token.requestToken },
        errorFallback: 'No fue posible crear la propuesta de cambios del Festival',
      }))
    );
  }

  actualizarPropuestaCambioFestival(festivalId: number, payload: any): Observable<any> {
    return this.apiClient.get<{ requestToken: string }>('/api/v1/external/organizations/csrf', {
      errorFallback: 'No fue posible preparar la actualización de la propuesta',
    }).pipe(
      switchMap(token => this.apiClient.put<any>(`/api/v1/externo/festivales/${festivalId}/propuesta-cambio`, payload, {
        headers: { 'X-CSRF-TOKEN': token.requestToken },
        errorFallback: 'No fue posible guardar la propuesta de cambios del Festival',
      }))
    );
  }

  enviarPropuestaCambioFestivalARevision(festivalId: number): Observable<any> {
    return this.apiClient.get<{ requestToken: string }>('/api/v1/external/organizations/csrf', {
      errorFallback: 'No fue posible preparar el envío de la propuesta',
    }).pipe(
      switchMap(token => this.apiClient.post<any>(`/api/v1/externo/festivales/${festivalId}/propuesta-cambio/enviar-a-revision`, {}, {
        headers: { 'X-CSRF-TOKEN': token.requestToken },
        errorFallback: 'No fue posible enviar la propuesta a revisión',
      }))
    );
  }

  fetchInstitutionalFestivalReviewQueue(): Observable<any[]> {
    return this.apiClient.get<any[]>('/api/v1/institucional/festivales/en-revision', {
      errorFallback: 'No fue posible consultar los Festivales en revisión',
    });
  }

  decideInstitutionalFestivalReview(festivalId: number, payload: any): Observable<any> {
    return this.apiClient.get<{ requestToken: string }>('/api/v1/institucional/festivales/csrf', {
      errorFallback: 'No fue posible preparar la decisión institucional',
    }).pipe(
      switchMap(token => this.apiClient.post<any>(`/api/v1/institucional/festivales/${festivalId}/decisiones`, payload, {
        headers: { 'X-CSRF-TOKEN': token.requestToken },
        errorFallback: 'No fue posible registrar la decisión institucional',
      }))
    );
  }

  fetchInstitutionalFestivalAdministrationRequests(): Observable<SolicitudAdministracionFestival[]> {
    return this.apiClient.get<SolicitudAdministracionFestival[]>('/api/v1/institucional/solicitudes-administracion-festival', {
      errorFallback: 'No fue posible consultar las solicitudes de administración de Festivales',
    });
  }

  decideInstitutionalFestivalAdministrationRequest(solicitudId: string, payload: { decision: string; comentario?: string }): Observable<SolicitudAdministracionFestival> {
    return this.apiClient.get<{ requestToken: string }>('/api/v1/institucional/solicitudes-administracion-festival/csrf', {
      errorFallback: 'No fue posible preparar la decisión institucional',
    }).pipe(
      switchMap(token => this.apiClient.post<SolicitudAdministracionFestival>(`/api/v1/institucional/solicitudes-administracion-festival/${solicitudId}/decisiones`, payload, {
        headers: { 'X-CSRF-TOKEN': token.requestToken },
        errorFallback: 'No fue posible registrar la decisión de vinculación',
      }))
    );
  }

  normalizarFestivalHistoricoParaActualizacion(festivalId: string): Observable<{ normalizado: boolean; message: string }> {
    return this.apiClient.get<{ requestToken: string }>('/api/v1/institucional/festivales/csrf', {
      errorFallback: 'No fue posible preparar la normalización institucional del Festival',
    }).pipe(
      switchMap(token => this.apiClient.post<{ normalizado: boolean; message: string }>(`/api/v1/institucional/festivales/${festivalId}/normalizar-version-historica`, {}, {
        headers: { 'X-CSRF-TOKEN': token.requestToken },
        errorFallback: 'No fue posible preparar el Festival histórico para su actualización',
      }))
    );
  }

  fetchInstitutionalProposalReviewQueue(): Observable<any[]> {
    return this.apiClient.get<any[]>('/api/v1/institucional/propuestas-cambio-festival/en-revision', {
      errorFallback: 'No fue posible consultar las propuestas en revisión',
    });
  }

  fetchInstitutionalProposalReviewDetail(propuestaId: number): Observable<any> {
    return this.apiClient.get<any>(`/api/v1/institucional/propuestas-cambio-festival/${propuestaId}`, {
      errorFallback: 'No fue posible consultar el detalle de la propuesta',
    });
  }

  decideInstitutionalProposalReview(propuestaId: number, payload: any): Observable<any> {
    return this.apiClient.get<{ requestToken: string }>('/api/v1/institucional/propuestas-cambio-festival/csrf', {
      errorFallback: 'No fue posible preparar la decisión sobre la propuesta',
    }).pipe(
      switchMap(token => this.apiClient.post<any>(`/api/v1/institucional/propuestas-cambio-festival/${propuestaId}/decisiones`, payload, {
        headers: { 'X-CSRF-TOKEN': token.requestToken },
        errorFallback: 'No fue posible registrar la decisión sobre la propuesta',
      }))
    );
  }

  // --- Usuarios de Entidades Aliadas ---

  fetchAllyUsers(): Observable<any> {
    return this.apiClient.get<any>('/api/v1/ally/users', {
      errorFallback: 'No fue posible consultar usuarios de la entidad aliada',
    });
  }

  createAllyUser(payload: any): Observable<any> {
    return this.apiClient.post<any>('/api/v1/ally/users', payload, {
      errorFallback: 'No fue posible crear el usuario de la entidad aliada',
    });
  }

  updateAllyUserStatus(payload: { id: string; isActive: boolean }): Observable<any> {
    return this.apiClient.put<any>(`/api/v1/ally/users/${payload.id}/status`, {
      isActive: payload.isActive,
    }, {
      errorFallback: 'No fue posible actualizar el estado del usuario aliado',
    });
  }

  // --- Notificaciones ---

  fetchNotifications(params: any = {}): Observable<any> {
    return this.apiClient.get<any>('/api/v1/notifications', {
      params,
      errorFallback: 'No fue posible consultar notificaciones',
    });
  }

  createAdminNotification(payload: any): Observable<any> {
    return this.apiClient.post<any>('/api/v1/admin/notifications', payload, {
      errorFallback: 'No fue posible crear la notificación',
    });
  }

  markNotificationRead(id: string): Observable<any> {
    return this.apiClient.post<any>(`/api/v1/notifications/${id}/read`, {}, {
      errorFallback: 'No fue posible marcar la notificación como leída',
    });
  }

  // --- Entidades Aliadas ---

  fetchAdminEntities(params: any = {}): Observable<any> {
    return this.apiClient.get<any>('/api/v1/admin/entities', {
      params,
      errorFallback: 'No fue posible consultar entidades',
    });
  }

  fetchAdminEntity(id: string): Observable<any> {
    return this.apiClient.get<any>(`/api/v1/admin/entities/${id}`, {
      errorFallback: 'No fue posible consultar la entidad',
    });
  }

  saveAdminEntity(payload: any): Observable<any> {
    return this.apiClient.post<any>('/api/v1/admin/entities', payload, {
      errorFallback: 'No fue posible guardar la entidad',
    });
  }

  updateAdminEntityStatus(payload: { id: string; status: string; comment?: string }): Observable<any> {
    return this.apiClient.post<any>(`/api/v1/admin/entities/${payload.id}/status`, {
      status: payload.status,
      comment: payload.comment || '',
    }, {
      errorFallback: 'No fue posible actualizar el estado',
    });
  }

  addAdminEntityRelation(payload: { id: string; targetEntityId: string; relationshipType: string; notes?: string }): Observable<any> {
    return this.apiClient.post<any>(`/api/v1/admin/entities/${payload.id}/relations`, {
      targetEntityId: payload.targetEntityId,
      relationshipType: payload.relationshipType,
      notes: payload.notes || '',
    }, {
      errorFallback: 'No fue posible relacionar entidades',
    });
  }

  // --- Esquemas, Estadísticas y Monitoreo ---

  fetchAdminSchema(): Observable<any> {
    return this.apiClient.get<any>('/api/v1/admin/data/schema', {
      errorFallback: 'No fue posible consultar el esquema administrativo',
    });
  }

  fetchAdminStats(): Observable<any> {
    return this.apiClient.get<any>('/api/v1/admin/data/stats', {
      errorFallback: 'No fue posible consultar las estadísticas administrativas',
    });
  }

  fetchAdminMonitor(): Observable<any> {
    return this.apiClient.get<any>('/api/v1/admin/data/monitor', {
      errorFallback: 'No fue posible consultar el monitoreo técnico',
    });
  }

  // --- Gestión de Registros y Control de Estado ---

  fetchAdminRecords(payload: { moduleId: string; [key: string]: any }): Observable<any> {
    const { moduleId, ...params } = payload;
    return this.apiClient.get<any>(`/api/v1/admin/data/records/${moduleId}`, {
      params,
      errorFallback: 'No fue posible consultar los registros del módulo',
    });
  }

  updateAdminRecordStatus(payload: {
    moduleId: string;
    id: string;
    status: string;
    comment?: string;
    rejectionReason?: string;
    observedFieldsJson?: string;
  }): Observable<any> {
    const { moduleId, id, ...body } = payload;
    return this.apiClient.post<any>(`/api/v1/admin/data/records/${moduleId}/${id}/status`, {
      status: body.status,
      comment: body.comment || '',
      rejectionReason: body.rejectionReason || '',
      observedFieldsJson: body.observedFieldsJson || '',
    }, {
      errorFallback: 'No fue posible cambiar el estado del registro',
    });
  }

  upsertAdminRecord(payload: { endpoint: string; payload: any }): Observable<any> {
    return this.apiClient.post<any>(payload.endpoint, payload.payload, {
      errorFallback: 'No fue posible guardar el registro administrativo',
    });
  }

  // --- Vinculación de Registros Huérfanos ---

  createRecordLinkRequest(payload: any): Observable<any> {
    return this.apiClient.post<any>('/api/v1/record-link-requests', payload, {
      errorFallback: 'No fue posible solicitar la vinculación del registro',
    });
  }

  fetchRecordLinkRequests(params: any = {}): Observable<any> {
    return this.apiClient.get<any>('/api/v1/admin/record-link-requests', {
      params,
      errorFallback: 'No fue posible consultar solicitudes de vinculación',
    });
  }

  updateRecordLinkRequestStatus(payload: { id: string; status: string; comment?: string }): Observable<any> {
    return this.apiClient.post<any>(`/api/v1/admin/record-link-requests/${payload.id}/status`, {
      status: payload.status,
      comment: payload.comment || '',
    }, {
      errorFallback: 'No fue posible actualizar la solicitud de vinculación',
    });
  }

  // --- Duplicados ---

  fetchDuplicateCandidates(params: any = {}): Observable<any> {
    return this.apiClient.get<any>('/api/v1/admin/duplicates', {
      params,
      errorFallback: 'No fue posible consultar posibles duplicados',
    });
  }

  createDuplicateCandidate(payload: any): Observable<any> {
    return this.apiClient.post<any>('/api/v1/admin/duplicates', payload, {
      errorFallback: 'No fue posible registrar el posible duplicado',
    });
  }

  decideDuplicateCandidate(payload: { id: string; decision: string; comment?: string }): Observable<any> {
    return this.apiClient.post<any>(`/api/v1/admin/duplicates/${payload.id}/decision`, {
      decision: payload.decision,
      comment: payload.comment || '',
    }, {
      errorFallback: 'No fue posible guardar la decisión sobre el duplicado',
    });
  }

  // --- Calidad de Datos ---

  fetchDataQualityFlags(params: any = {}): Observable<any> {
    return this.apiClient.get<any>('/api/v1/admin/data-quality/flags', {
      params,
      errorFallback: 'No fue posible consultar alertas de calidad de datos',
    });
  }

  createDataQualityFlag(payload: any): Observable<any> {
    return this.apiClient.post<any>('/api/v1/admin/data-quality/flags', payload, {
      errorFallback: 'No fue posible registrar la alerta de calidad de datos',
    });
  }

  updateDataQualityFlagStatus(payload: { id: string; status: string }): Observable<any> {
    return this.apiClient.post<any>(`/api/v1/admin/data-quality/flags/${payload.id}/status`, {
      status: payload.status,
    }, {
      errorFallback: 'No fue posible actualizar la alerta de calidad de datos',
    });
  }

  // --- Ubicaciones y DIVIPOLA ---

  fetchDivipolaLocations(params: any = {}): Observable<any> {
    return this.apiClient.get<any>('/api/v1/divipola/locations', {
      params,
      errorFallback: 'No fue posible consultar DIVIPOLA',
    });
  }

  fetchDivipolaGrouped(): Observable<any> {
    return this.apiClient.get<any>('/api/v1/divipola/grouped', {
      errorFallback: 'No fue posible consultar departamentos y municipios',
    });
  }

  // --- Asistente de Inteligencia Artificial ---

  analyzeTextWithAI(payload: { text: string; moduleId: string; attachments?: any[] }): Observable<any> {
    return this.apiClient.post<any>('/api/v1/admin/data/ai/analyze', {
      text: payload.text,
      moduleId: payload.moduleId,
      attachments: payload.attachments || [],
    }, {
      errorFallback: 'No fue posible analizar el texto con el asistente de IA',
    });
  }

  // --- Importación Masiva ---

  importBulkRecords(payload: { moduleId: string; records: any[] }): Observable<any> {
    return this.apiClient.post<any>(`/api/v1/admin/data/records/${payload.moduleId}/bulk`, payload.records, {
      errorFallback: 'No fue posible realizar la importación masiva de registros',
    });
  }
}
