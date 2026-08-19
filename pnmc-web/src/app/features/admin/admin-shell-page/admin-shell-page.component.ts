import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  LucideShieldCheck, 
  LucideRefreshCw, 
  LucideLock, 
  LucideLogOut, 
  LucideMail, 
  LucideX, 
  LucideSparkles,
  LucideChevronRight,
  LucideBuilding2,
  LucideNetwork,
  LucideNewspaper,
  LucideClipboardList,
  LucideCpu,
  LucideFileText,
  LucideServer,
  LucideUsersRound,
  LucideLayoutDashboard,
  LucideSearch,
  LucideDatabase,
  LucideUser,
  LucideGlobe,
  LucideMap,
  LucideEdit3,
  LucideCheckCircle2
} from '@lucide/angular';
import { AdminService } from '../../../core/services/admin.service';
import { SessionService } from '../../../core/services/session.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { 
  ADMIN_ROLES, 
  ADMIN_MODULES, 
  ADMIN_AREAS, 
  getModulesForRole,
  canRole
} from '../domain/admin-config';

// Import child components
import { AdminLoginComponent } from '../admin-login/admin-login.component';
import { AdminMonitorComponent } from '../admin-monitor/admin-monitor.component';
import { AdminRecordsPanelComponent } from '../admin-records-panel/admin-records-panel.component';
import { AdminFestivalReviewPanelComponent } from '../admin-festival-review-panel/admin-festival-review-panel.component';
import { AdminUsersPanelComponent } from '../admin-users-panel/admin-users-panel.component';
import { AdminSystemPanelComponent } from '../admin-system-panel/admin-system-panel.component';
import { AdminGovernancePanelComponent } from '../admin-governance-panel/admin-governance-panel.component';
import { AdminWebTextsPanelComponent } from '../admin-web-texts-panel/admin-web-texts-panel.component';
import { AdminAIAssistantPanelComponent } from '../components/admin-ai-assistant-panel/admin-ai-assistant-panel.component';
import { ExternalUserDashboardComponent } from '../external-user-dashboard/external-user-dashboard.component';

// Entity interface
interface EntityForm {
  id?: string;
  entityType: string;
  name: string;
  legalName: string;
  description?: string;
  contactEmail: string;
  contactPhone: string;
  coverageLevel: string;
  department: string;
  municipality: string;
  status: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  otherUrl?: string;
  addressText?: string;
}

@Component({
  selector: 'app-admin-shell-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminLoginComponent,
    AdminMonitorComponent,
    AdminRecordsPanelComponent,
    AdminFestivalReviewPanelComponent,
    AdminUsersPanelComponent,
    AdminSystemPanelComponent,
    AdminGovernancePanelComponent,
    AdminWebTextsPanelComponent,
    AdminAIAssistantPanelComponent,
    ExternalUserDashboardComponent,
    LucideShieldCheck,
    LucideRefreshCw,
    LucideLock,
    LucideLogOut,
    LucideMail,
    LucideX,
    LucideSparkles,
    LucideChevronRight,
    LucideBuilding2,
    LucideNetwork,
    LucideNewspaper,
    LucideClipboardList,
    LucideCpu,
    LucideFileText,
    LucideServer,
    LucideUsersRound,
    LucideLayoutDashboard,
    LucideSearch,
    LucideDatabase,
    LucideUser,
    LucideGlobe,
    LucideMap,
    LucideEdit3,
    LucideCheckCircle2
  ],
  templateUrl: './admin-shell-page.component.html',
  styleUrls: ['./admin-shell-page.component.css']
})
export class AdminShellPageComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private sessionService = inject(SessionService);
  private navigationService = inject(NavigationService);
  private router = inject(Router);

  // Shell Session Signals
  session = this.sessionService.currentUser;
  isAuthenticated = this.sessionService.isAuthenticated;
  sessionState = signal<string>('checking'); // 'checking' | 'ready'

  // Panel State
  activeSection = signal<string>('monitor');
  selectedModuleId = signal<string>('festivals');
  stats = signal<Record<string, number>>({});
  schemaOnline = signal<boolean>(false);
  apiStatus = signal<string>('Backend administrativo pendiente de verificar.');
  reviewRecords = signal<any[]>([]);
  divipola = signal<any>({});
  monitor = signal<any>(null);

  // Entities state
  entities = signal<any[]>([]);
  entityFilters = signal({ entityType: '', status: '', q: '' });
  entityFormValues = signal<EntityForm>({
    entityType: 'organizacion',
    name: '',
    legalName: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    coverageLevel: 'municipal',
    department: '',
    municipality: '',
    status: 'borrador',
    websiteUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    otherUrl: '',
    addressText: '',
  });
  entityMessage = signal<string>('');
  showEntityForm = signal<boolean>(false);

  // Estados de respaldo para mantener disponible la interfaz si la API no responde.
  localUsers = signal<any[]>([
    { id: 'usr-lider', fullName: 'Diana Valencia', email: 'lider@pnmc.local', role: 'lider', isActive: true, password: 'password' },
    { id: 'usr-ext-1', fullName: 'Carlos Vives', email: 'colaborador@external.local', role: 'gestor', isActive: true, password: 'password' }
  ]);

  isExternalPortal = signal<boolean>(false);
  showPasswordModal = signal<boolean>(false);
  reviewingRecord = signal<any | null>(null);

  // Collaborator Processes
  externalProcesses = signal<any[]>([
    {
      id: 'ext-proc-1',
      moduleId: 'festivals',
      type: 'festivals',
      title: 'Festival de Cuerdas y Viento',
      name: 'Festival de Cuerdas y Viento',
      status: 'aprobado',
      department: 'Boyacá',
      municipality: 'Villa de Leyva',
      updatedAt: '2026-05-10',
      owner: 'Carlos Vives',
      description: 'Festival tradicional de música de cuerda andina colombiana.',
      organizer: 'Carlos Vives',
      contactEmail: 'colaborador@external.local',
      contactPhone: '315 123 4567'
    }
  ]);

  // Collaborator notifications
  notifications = signal<any[]>([
    {
      id: 'notif-1',
      recipientEmail: 'colaborador@external.local',
      title: 'Bienvenido al PNMC',
      message: 'Tu cuenta de colaborador ha sido activada con éxito.',
      createdAt: '2026-05-24T10:00:00Z',
      read: false
    }
  ]);

  // Status banners & tour
  reviewToast = signal<{ show: boolean; type: string; message: string }>({ show: false, type: 'success', message: '' });
  showWelcomeTour = signal<boolean>(false);
  tourStep = signal<number>(1);

  // Timer reference
  private tickIntervalId: any = null;

  // Icon references
  LucideShieldCheck = LucideShieldCheck;
  LucideRefreshCw = LucideRefreshCw;
  LucideLock = LucideLock;
  LucideLogOut = LucideLogOut;
  LucideMail = LucideMail;
  LucideX = LucideX;
  LucideSparkles = LucideSparkles;
  LucideChevronRight = LucideChevronRight;
  LucideBuilding2 = LucideBuilding2;
  LucideNetwork = LucideNetwork;
  LucideNewspaper = LucideNewspaper;
  LucideClipboardList = LucideClipboardList;
  LucideCpu = LucideCpu;
  LucideFileText = LucideFileText;
  LucideServer = LucideServer;
  LucideUsersRound = LucideUsersRound;
  LucideLayoutDashboard = LucideLayoutDashboard;
  LucideSearch = LucideSearch;
  LucideDatabase = LucideDatabase;
  LucideUser = LucideUser;
  LucideGlobe = LucideGlobe;
  LucideMap = LucideMap;
  LucideEdit3 = LucideEdit3;
  LucideCheckCircle2 = LucideCheckCircle2;

  // Static Metadata references
  ADMIN_ROLES = ADMIN_ROLES;
  ADMIN_MODULES = ADMIN_MODULES;
  ADMIN_AREAS = ADMIN_AREAS;

  // Tour Steps Data
  TOUR_STEPS: Record<string, any[]> = {
    webmaster: [
      {
        title: "Consola de Webmaster",
        description: "¡Bienvenido! Tienes control total y acceso privilegiado a todos los rincones del Plan Nacional de Música para la Convivencia.",
        badge: "Rol: Webmaster",
        icon: LucideShieldCheck,
        details: [
          "Monitoreo técnico de latencia de base de datos y logs de auditoría en vivo.",
          "Mantenimiento maestro de usuarios globales y asignación rápida de roles.",
          "Importaciones masivas de datos mediante hojas de cálculo Excel y CSV."
        ]
      },
      {
        title: "Administración Central de Textos",
        description: "Edita y actualiza cualquier copy o etiqueta que no venga de la base de datos.",
        badge: "CMS de Textos",
        icon: LucideFileText,
        details: [
          "Clasificación estricta por páginas: Home, Agenda, Galería, Noticias, Ejes, etc.",
          "Sub-selector interactivo de Ejes Estratégicos para aislar componentes de edición.",
          "Previsualizadores Hifi interactivos que reproducen el render real en vivo."
        ]
      },
      {
        title: "Gestión de Solicitudes y Vinculaciones",
        description: "Verifica vinculaciones y reclamaciones hechas por colaboradores externos.",
        badge: "Gobernanza",
        icon: LucideCpu,
        details: [
          "Aprobación o rechazo directo de solicitudes de vinculación territorial.",
          "Resolución inteligente de duplicados basados en porcentajes de similitud.",
          "Evaluación de alertas automáticas de calidad en el mapa ecosistémico."
        ]
      }
    ],
    gestor_interno: [
      {
        title: "Moderador de Componentes",
        description: "¡Bienvenido! Tu rol es primordial para acompañar y curar la información de tu componente territorial.",
        badge: "Rol: Gestor Interno",
        icon: LucideClipboardList,
        details: [
          "Revisar y verificar escuelas de música, lutieres y festivales reportados.",
          "Solicitar ajustes específicos con comentarios dirigidos por cada campo.",
          "Verificar y mantener la consistencia geográfica del mapa nacional."
        ]
      },
      {
        title: "Bandeja de Gobernanza y Solicitudes",
        description: "Acompaña las vinculaciones institucionales en tiempo real.",
        badge: "Solicitudes de Redes",
        icon: LucideCpu,
        details: [
          "Aprobar vinculaciones territoriales para dar control editorial a colaboradores.",
          "Resolver alertas de coordenadas geográficas fuera de los límites DIVIPOLA.",
          "Administrar textos y copys de los contenidos de comunicación de tu área."
        ]
      }
    ],
    lider: [
      {
        title: "Portal de Aliados Institucionales",
        description: "¡Bienvenido! Aquí coordinas las escuelas, luterías y festivales asociados a tu entidad.",
        badge: "Rol: Aliado Coordinador",
        icon: LucideBuilding2,
        details: [
          "Acceso exclusivo al panel de KPI y estadísticas de tu componente.",
          "Monitorear la distribución de tus registros geolocalizados por departamento.",
          "Administrar usuarios editores y lectores de tu propia red aliada."
        ]
      },
      {
        title: "Vinculaciones y Cargas Colaborativas",
        description: "Conecta a tus redes locales al mapa ecosistémico nacional.",
        badge: "Registros de Red",
        icon: LucideNetwork,
        details: [
          "Carga individual y masiva de procesos formativos y artísticos.",
          "Monitorear solicitudes de reclamación de registros preexistentes.",
          "Colaboración bidireccional directa con los gestores internos del Ministerio."
        ]
      }
    ],
    gestor: [
      {
        title: "¡Bienvenido al Portal de Colaboradores!",
        description: "Tu participación es fundamental para enriquecer el Mapa Ecosistémico del Plan Nacional de Música para la Convivencia (PNMC).",
        badge: "Mapeo Colectivo",
        icon: LucideSparkles,
        details: [
          "Buscamos mapear y visibilizar escuelas de música, lutieres y festivales de todo el país.",
          "Una vez registrado, podrás reclamar registros existentes o crear nuevos.",
          "¡Tu labor preserva y fomenta la memoria musical territorial de Colombia!"
        ]
      },
      {
        title: "Paso 1: Confirmación de Correo y Cuenta",
        description: "Has realizado un registro básico de usuario para ingresar al portal.",
        badge: "Activación Exitosa",
        icon: LucideMail,
        details: [
          "Confirmación de tu correo electrónico mediante el código temporal.",
          "Acceso directo y seguro a tu panel personal de colaborador.",
          "Preparación para vincular tu organización cultural."
        ]
      },
      {
        title: "Paso 2: Caracterización de tu Entidad",
        description: "El primer paso indispensable es completar la ficha de caracterización en el panel.",
        badge: "Wizard en 3 Pasos",
        icon: LucideBuilding2,
        details: [
          "Paso 1: Identidad (Razón social, NIT o documento, descripción cultural).",
          "Paso 2: Datos de Contacto (Teléfono, correo electrónico, redes sociales).",
          "Paso 3: Ubicación (Departamento y Municipio de la DIVIPOLA)."
        ]
      },
      {
        title: "Paso 3: Escaneo Histórico Automático",
        description: "Al enviar tu caracterización, el sistema iniciará una búsqueda inteligente en segundo plano.",
        badge: "DIVIPOLA Smart Scan",
        icon: LucideSearch,
        details: [
          "El Plan Nacional posee miles de registros históricos mapeados por el Ministerio de las Culturas.",
          "Buscamos automáticamente coincidencias de escuelas, lutieres y festivales en tu municipio.",
          "Te enviaremos una notificación cuando finalice el escaneo (en unos segundos)."
        ]
      },
      {
        title: "Paso 4: Reclamar Coincidencias en Borrador",
        description: "Tu panel habilitará una 'Bandeja de Reclamaciones Históricas' con los posibles aciertos.",
        badge: "Previsualizar, Reclamar y Editar",
        icon: LucideClipboardList,
        details: [
          "Podrás previsualizar los detalles del registro encontrado.",
          "Si confirmas que te pertenece, reclámalo y se moverá a tus procesos como un Borrador (Draft).",
          "Podrás actualizar su descripción, teléfonos o fotos y reenviarlo a revisión para su publicación final."
        ]
      }
    ]
  };

  // Constructor
  constructor() {
    // Determine external/internal mode based on path
    const urlPath = this.router.url;
    if (urlPath.includes('/colaboradores')) {
      this.isExternalPortal.set(true);
    }

    // Effect to check and trigger welcome tour modal
    effect(() => {
      const sess = this.session();
      if (sess) {
        const tourSeen = localStorage.getItem('pnmc_tour_seen_' + sess.email);
        if (!tourSeen) {
          this.showWelcomeTour.set(true);
          this.tourStep.set(1);
        }
      }
    });

    // Effect to start status polling
    effect(() => {
      const sess = this.session();
      if (sess) {
        this.refreshAdminBackend();
        this.startPolling();
      } else {
        this.stopPolling();
      }
    });
  }

  ngOnInit() {
    this.sessionService.checkSession().subscribe({
      next: () => {
        this.sessionState.set('ready');
      },
      error: () => {
        this.sessionState.set('ready');
      }
    });
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  startPolling() {
    this.stopPolling();
    this.tickIntervalId = setInterval(() => {
      this.refreshAdminBackend();
    }, 10000);
  }

  stopPolling() {
    if (this.tickIntervalId) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }
  }

  // Active Role and Capabilities
  get roleId(): string {
    return this.session()?.role || 'gestor';
  }

  get isCollaboratorRole(): boolean {
    return ['externo', 'aliado_admin', 'aliado_editor', 'aliado_lector', 'gestor'].includes(this.roleId);
  }

  get modules(): any[] {
    return getModulesForRole(this.roleId);
  }

  get canApprove(): boolean {
    return canRole(this.roleId, 'approve');
  }

  // Aggregate Review Queue Items
  loadReviewQueue() {
    if (!this.session()) return;

    // Load records for all modules
    const allRecordsPromises = ADMIN_MODULES.map((mod) => {
      return new Promise<any[]>((resolve) => {
        this.adminService.fetchAdminRecords({ moduleId: mod.id, limit: 100 }).subscribe({
          next: (res) => {
            const items = (res?.items || []).map((item: any) => ({
              ...item,
              moduleId: mod.id,
              title: item.name || item.title || 'Sin título',
              owner: item.owner || item.createdBy || 'Sistema',
            }));
            resolve(items);
          },
          error: () => resolve([])
        });
      });
    });

    Promise.all(allRecordsPromises).then((results) => {
      const apiAggregated = results.flat().filter((r) => ['borrador', 'en_evaluacion', 'ajustes_solicitados'].includes(r.status));
      const extAggregated = this.externalProcesses()
        .filter((r) => ['borrador', 'en_evaluacion', 'ajustes_solicitados'].includes(r.status))
        .map((r) => ({
          ...r,
          moduleId: r.moduleId || r.type,
        }));

      const combined = [...extAggregated];
      apiAggregated.forEach((item) => {
        if (!combined.some((c) => c.id === item.id)) {
          combined.push(item);
        }
      });

      this.reviewRecords.set(combined);
    });
  }

  // Sync Backend Stats
  refreshAdminBackend() {
    this.adminService.fetchAdminMonitor().subscribe({
      next: (monitorPayload) => {
        this.monitor.set(monitorPayload);
        this.schemaOnline.set(monitorPayload?.database?.status === 'ok');
        this.stats.set(Object.fromEntries((monitorPayload?.modules || []).map((mod: any) => [mod.id, mod.total])));
        this.apiStatus.set(`Última lectura: ${new Date().toLocaleTimeString('es-CO')} · API ${monitorPayload?.api?.latencyMs || 0} ms`);
      },
      error: (err) => {
        this.schemaOnline.set(false);
        this.apiStatus.set(`Error de conexión: ${err.message}`);
      }
    });

    this.adminService.fetchDivipolaGrouped().subscribe({
      next: (territories) => {
        this.divipola.set(territories || {});
      }
    });

    this.loadReviewQueue();
  }

  // Authentication Handlers
  handleLogin(user: any) {
    this.sessionService.setSession(user);
    this.activeSection.set('monitor');
    this.refreshAdminBackend();
  }

  handleLogout() {
    this.sessionService.logout().subscribe({
      next: () => {
        this.router.navigateByUrl('/admin');
      },
      error: () => {
        this.router.navigateByUrl('/admin');
      }
    });
  }

  handleRegisterUser(newUser: any) {
    this.localUsers.update(prev => [...prev, newUser]);
  }

  handlePasswordChange(payload: { email: string; password?: string }) {
    this.localUsers.update(prev =>
      prev.map((u) => (u.email === payload.email ? { ...u, password: payload.password } : u))
    );
    if (this.session()?.email === payload.email) {
      this.sessionService.setSession({ ...this.session(), password: payload.password });
    }
  }

  handleProfileUpdate(payload: any) {
    this.sessionService.setSession({ ...this.session(), ...payload });
  }

  handleNotificationRead(recordId: string) {
    this.notifications.update(prev =>
      prev.map((item) => item.recordId === recordId ? { ...item, read: true } : item)
    );
  }

  handleReviewRecord(record: any) {
    this.reviewRecords.update(cur => [record, ...cur.filter((item) => item.id !== record.id)]);
  }

  handleReviewStatus(payload: { id: string; status: string }) {
    const record = this.reviewRecords().find((r) => r.id === payload.id);
    if (!record) return;

    this.adminService.updateAdminRecordStatus({ moduleId: record.moduleId, id: payload.id, status: payload.status }).subscribe({
      next: () => {
        this.reviewRecords.update(cur =>
          cur.map((r) => (r.id === payload.id ? { ...r, status: payload.status, updatedAt: new Date().toISOString().slice(0, 10) } : r))
        );
        this.loadReviewQueue();
      },
      error: (err) => {
        alert(`Error al actualizar estado del registro: ${err.message}`);
      }
    });
  }

  handleReviewSubmit(payload: { id: string; status: string; reviewComments: any }) {
    const record = this.reviewRecords().find((r) => r.id === payload.id);
    if (!record) return;

    this.adminService.updateAdminRecordStatus({ moduleId: record.moduleId, id: payload.id, status: payload.status }).subscribe({
      next: () => {
        // Update local review list
        this.reviewRecords.update(cur =>
          cur.map((r) =>
            r.id === payload.id
              ? { ...r, status: payload.status, reviewComments: payload.reviewComments, updatedAt: new Date().toISOString().slice(0, 10) }
              : r
          )
        );

        // Update externalProcesses state
        this.externalProcesses.update(cur =>
          cur.map((p) =>
            p.id === payload.id
              ? { ...p, status: payload.status, reviewComments: payload.reviewComments, updatedAt: new Date().toISOString().slice(0, 10) }
              : p
          )
        );

        // Trigger Notification
        if (payload.status === 'ajustes_solicitados' && payload.reviewComments?.sendNotification) {
          const notifyEmail = payload.reviewComments.collaboratorEmail || 'colaborador@external.local';
          const newNotif = {
            id: `notif-${Date.now()}`,
            recipientEmail: notifyEmail,
            title: `Ajustes requeridos: ${record.title}`,
            message: `Tu registro "${record.title}" requiere ajustes. Observaciones: ${payload.reviewComments.generalComment}`,
            createdAt: new Date().toISOString(),
            read: false,
            recordId: record.id,
            fieldAdjustments: payload.reviewComments.fieldAdjustments,
            generalComment: payload.reviewComments.generalComment
          };
          this.notifications.update(prev => [newNotif, ...prev]);

          this.reviewToast.set({
            show: true,
            type: 'warning',
            message: `✉️ ¡Notificación de ajustes enviada por correo a ${record.owner} (${notifyEmail})! El registro ha cambiado a estado "Ajustes solicitados".`
          });
          setTimeout(() => this.reviewToast.set({ show: false, type: 'success', message: '' }), 6000);
        } else if (payload.status === 'rechazado') {
          const notifyEmail = payload.reviewComments?.collaboratorEmail || 'colaborador@external.local';
          const newNotif = {
            id: `notif-${Date.now()}`,
            recipientEmail: notifyEmail,
            title: `Registro rechazado: ${record.title}`,
            message: `Tu registro "${record.title}" ha sido rechazado de forma definitiva. Motivo: ${payload.reviewComments?.generalComment || 'Inviabilidad técnica.'}`,
            createdAt: new Date().toISOString(),
            read: false,
            recordId: record.id,
            generalComment: payload.reviewComments?.generalComment
          };
          this.notifications.update(prev => [newNotif, ...prev]);

          this.reviewToast.set({
            show: true,
            type: 'danger',
            message: `🚫 ¡Registro rechazado! Se ha notificado por correo a ${record.owner} (${notifyEmail}) con el motivo del rechazo.`
          });
          setTimeout(() => this.reviewToast.set({ show: false, type: 'success', message: '' }), 6000);
        } else {
          const notifyEmail = payload.reviewComments?.collaboratorEmail || 'colaborador@external.local';
          const newNotif = {
            id: `notif-${Date.now()}`,
            recipientEmail: notifyEmail,
            title: `Registro aprobado: ${record.title}`,
            message: `¡Felicitaciones! Tu registro "${record.title}" ha sido verificado y aprobado. Ya es visible en el mapa.`,
            createdAt: new Date().toISOString(),
            read: false,
            recordId: record.id
          };
          this.notifications.update(prev => [newNotif, ...prev]);

          this.reviewToast.set({
            show: true,
            type: 'success',
            message: `🎉 ¡Registro aprobado con éxito! Se ha notificado al colaborador.`
          });
          setTimeout(() => this.reviewToast.set({ show: false, type: 'success', message: '' }), 6000);
        }

        this.reviewingRecord.set(null);
        this.loadReviewQueue();
      },
      error: (err) => {
        alert(`Error al guardar la revisión: ${err.message}`);
      }
    });
  }

  // Entities Panel Actions
  loadEntities() {
    this.entityMessage.set('Consultando entidades...');
    this.adminService.fetchAdminEntities(this.entityFilters()).subscribe({
      next: (payload) => {
        this.entities.set(payload?.items || []);
        this.entityMessage.set(`${payload?.total || 0} entidades encontradas.`);
      },
      error: (err) => {
        this.entityMessage.set(err.message || 'Error al consultar entidades');
      }
    });
  }

  editEntity(entity: any) {
    this.entityFormValues.set({
      id: entity.id,
      entityType: entity.entityType,
      name: entity.name,
      legalName: entity.legalName || '',
      contactEmail: entity.contactEmail || '',
      contactPhone: entity.contactPhone || '',
      coverageLevel: entity.municipality ? 'municipal' : entity.department ? 'departamental' : 'nacional',
      department: entity.department || '',
      municipality: entity.municipality || '',
      status: entity.status || 'borrador',
      description: entity.description || '',
      websiteUrl: entity.websiteUrl || '',
      instagramUrl: entity.instagramUrl || '',
      facebookUrl: entity.facebookUrl || '',
      otherUrl: entity.otherUrl || '',
      addressText: entity.addressText || '',
    });
    this.showEntityForm.set(true);
  }

  startCreateEntity() {
    this.entityFormValues.set({
      entityType: 'organizacion',
      name: '',
      legalName: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
      coverageLevel: 'municipal',
      department: '',
      municipality: '',
      status: 'borrador',
      websiteUrl: '',
      instagramUrl: '',
      facebookUrl: '',
      otherUrl: '',
      addressText: '',
    });
    this.showEntityForm.set(true);
  }

  handleSaveEntity(e: Event) {
    e.preventDefault();
    this.entityMessage.set('Guardando entidad...');
    this.adminService.saveAdminEntity(this.entityFormValues()).subscribe({
      next: (saved) => {
        this.entities.update(cur => [saved, ...cur.filter((item) => item.id !== saved.id)]);
        this.showEntityForm.set(false);
        this.entityMessage.set('Entidad guardada correctamente.');
      },
      error: (err) => {
        this.entityMessage.set(err.message || 'Error al guardar entidad');
      }
    });
  }

  handleEntityStatus(entity: any, statusVal: string) {
    this.entityMessage.set('Actualizando estado...');
    this.adminService.updateAdminEntityStatus({ id: entity.id, status: statusVal }).subscribe({
      next: (saved) => {
        this.entities.update(cur => cur.map((item) => (item.id === saved.id ? saved : item)));
        this.entityMessage.set('Estado actualizado.');
      },
      error: (err) => {
        this.entityMessage.set(err.message || 'Error al actualizar estado');
      }
    });
  }

  // Sidebar Layout Navigation List
  NAV_SECTIONS: any[] = [
    {
      group: 'principal',
      items: [
        { id: 'monitor', label: 'Dashboard', icon: LucideLayoutDashboard },
        { id: 'ecosystem', label: 'Mapa ecosistémico', icon: LucideNetwork },
        { id: 'communications', label: 'Comunicaciones', icon: LucideNewspaper },
        { id: 'entities', label: 'Entidades base', icon: LucideBuilding2 },
        { id: 'review', label: 'Revisión', icon: LucideClipboardList },
        { id: 'governance', label: 'Gestión de solicitudes y vinculaciones', icon: LucideCpu, allowedRoles: ['webmaster', 'gestor_interno'] },
        { id: 'web_texts', label: 'Administración de textos', icon: LucideFileText, allowedRoles: ['webmaster', 'gestor_interno'] },
        { id: 'ai_assistant', label: 'Asistente de Importación IA', icon: LucideSparkles },
      ],
    },
    {
      group: 'administracion',
      label: 'Administración',
      webmasterOnly: true,
      items: [
        { id: 'users', label: 'Usuarios', icon: LucideUsersRound, webmasterOnly: true },
        { id: 'system', label: 'Sistema', icon: LucideServer, webmasterOnly: true },
      ],
    },
  ];

  get visibleNavSections() {
    const role = this.roleId;
    return this.NAV_SECTIONS.map((group) => ({
      ...group,
      items: group.items.filter((item: any) => {
        if (item.allowedRoles) return item.allowedRoles.includes(role);
        if (item.webmasterOnly) return role === 'webmaster';
        return true;
      }),
    })).filter((group) => group.items.length > 0);
  }

  // Tour steps selector helpers
  get tourSteps(): any[] {
    return this.TOUR_STEPS[this.roleId] || this.TOUR_STEPS['gestor'];
  }

  get currentTourStepIndex(): number {
    return Math.min(this.tourStep() - 1, this.tourSteps.length - 1);
  }

  get currentTourStep() {
    return this.tourSteps[this.currentTourStepIndex];
  }

  tourNext() {
    if (this.tourStep() < this.tourSteps.length) {
      this.tourStep.set(this.tourStep() + 1);
    } else {
      this.tourClose();
    }
  }

  tourPrev() {
    if (this.tourStep() > 1) {
      this.tourStep.set(this.tourStep() - 1);
    }
  }

  tourClose() {
    this.showWelcomeTour.set(false);
    if (this.session()) {
      localStorage.setItem('pnmc_tour_seen_' + this.session()!.email, 'true');
    }
  }

  Object = Object;

  get departmentNames(): string[] {
    return Object.keys(this.divipola() || {}).sort((a, b) => a.localeCompare(b, 'es'));
  }

  formatLocation(dept: string | undefined, muni: string | undefined): string {
    return [dept, muni].filter(val => !!val).join(' / ') || '—';
  }

  // Module filter helpers
  getAreaModules(areaId: string): any[] {
    return this.modules.filter(m => m.area === areaId);
  }

  getSelectedModule(areaId: string) {
    const mods = this.getAreaModules(areaId);
    return mods.find(m => m.id === this.selectedModuleId()) || mods[0];
  }

  // Visual Helpers
  AVATAR_COLORS = [
    'bg-violet-600', 'bg-indigo-600', 'bg-blue-600',
    'bg-teal-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600',
  ];

  getAvatarColor(name = ''): string {
    const hash = String(name).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return this.AVATAR_COLORS[hash % this.AVATAR_COLORS.length];
  }

  getInitials(name = ''): string {
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1 && parts[0]) return parts[0].slice(0, 2).toUpperCase();
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return 'U';
  }

  getRoleColorClass(role: string): string {
    const colors: Record<string, string> = { 
      webmaster: 'text-violet-400', 
      gestor_interno: 'text-slate-400', 
      lider: 'text-amber-400', 
      gestor: 'text-slate-400' 
    };
    return colors[role] || 'text-slate-400';
  }

  getRoleLabel(role: string): string {
    return ADMIN_ROLES[role]?.shortLabel || role;
  }

  statusPillClass(status: string): string {
    const STYLES: Record<string, string> = {
      borrador:            'text-slate-600 bg-slate-100 border border-slate-200',
      en_revision:         'text-blue-700 bg-blue-50 border border-blue-200',
      ajustes_solicitados: 'text-amber-700 bg-amber-50 border border-amber-200',
      aprobado:            'text-emerald-700 bg-emerald-50 border border-emerald-200',
      publicado:           'text-violet-700 bg-violet-50 border border-violet-200',
      rechazado:           'text-red-700 bg-red-50 border border-red-200',
      archivado:           'text-slate-400 bg-slate-50 border border-slate-100',
    };
    return STYLES[status] || STYLES['borrador'];
  }

  statusLabel(status: string): string {
    const LABELS: Record<string, string> = {
      borrador:            'Borrador',
      en_revision:         'En revisión',
      ajustes_solicitados: 'Ajustes solicitados',
      aprobado:            'Aprobado',
      publicado:           'Publicado',
      rechazado:           'Rechazado',
      archivado:           'Archivado',
    };
    return LABELS[status] || status;
  }
}
