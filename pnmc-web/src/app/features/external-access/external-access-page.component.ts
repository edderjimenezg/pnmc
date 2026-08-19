import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService, CoincidenciaFestivalHistorico } from '../../core/services/admin.service';

type View = 'choice' | 'register' | 'verify' | 'login' | 'organization' | 'festival' | 'complete';

@Component({
  selector: 'app-external-access-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './external-access-page.component.html',
})
export class ExternalAccessPageComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  view = signal<View>('choice');
  wantsOrganization = signal(false);
  session = signal<any | null>(null);
  loading = signal(false);
  message = signal('');
  error = signal('');
  registeredEmail = signal('');
  createdOrganization = signal<any | null>(null);
  organizations = signal<any[]>([]);
  festivalCatalogs = signal<any>({ practicasMusicales: [], territoriosSonoros: [] });
  draftFestivals = signal<any[]>([]);
  festivalEnRevision = signal<any | null>(null);
  festivalEnEdicion = signal<any | null>(null);
  propuestaEnEdicion = signal<any | null>(null);
  coincidenciasHistoricas = signal<CoincidenciaFestivalHistorico[]>([]);
  cargandoCoincidencias = signal(false);
  coincidenciasConsultadas = signal(false);
  coincidenciaEnDetalle = signal<CoincidenciaFestivalHistorico | null>(null);
  locations = signal<any[]>([]);
  departments = computed(() => Array.from(new Map(this.locations().map(item => [item.departmentCode, item.departmentName])).entries())
    .map(([code, name]) => ({ code, name })));
  municipalities = computed(() => this.locations().filter(item => item.departmentCode === this.organization.departmentCode));
  festivalMunicipalities = computed(() => this.locations().filter(item => item.departmentCode === this.festival.departmentCode));

  account = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptDataPolicy: false,
  };
  verificationCode = '';
  login = { email: '', password: '' };
  organization = {
    name: '',
    identificationNumber: '',
    contactEmail: '',
    coverageLevel: 'municipal',
    departmentCode: '',
    municipalityCode: '',
  };
  festival = {
    organizacionId: '',
    nombre: '',
    descripcion: '',
    periodicidad: '',
    correoContacto: '',
    nivelCobertura: 'municipal',
    departmentCode: '',
    municipalityCode: '',
    practicasMusicalesIds: [] as number[],
    territoriosSonorosIds: [] as number[],
  };

  ngOnInit(): void {
    this.adminService.fetchExternalSession().subscribe({
      next: session => this.session.set(session),
      error: () => undefined,
    });
  }

  chooseAccount(): void {
    this.wantsOrganization.set(false);
    this.view.set('register');
    this.clearFeedback();
  }

  chooseOrganization(): void {
    this.wantsOrganization.set(true);
    this.clearFeedback();
    if (this.session()) this.loadTerritories();
    this.view.set(this.session() ? 'organization' : 'login');
  }

  chooseFestival(): void {
    this.clearFeedback();
    if (!this.session()) {
      this.wantsOrganization.set(false);
      this.view.set('login');
      return;
    }
    this.openFestivalForm();
  }

  register(): void {
    this.clearFeedback();
    if (!this.account.fullName.trim() || !this.account.email.trim() || this.account.password.length < 10) {
      this.error.set('Escribe tu nombre, correo y una contraseña de al menos 10 caracteres.');
      return;
    }
    if (this.account.password !== this.account.confirmPassword) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    this.loading.set(true);
    this.adminService.registerExternalUser({
      profileType: 'persona',
      fullName: this.account.fullName,
      email: this.account.email,
      password: this.account.password,
      acceptTerms: this.account.acceptTerms,
      acceptDataPolicy: this.account.acceptDataPolicy,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.registeredEmail.set(this.account.email.trim().toLowerCase());
        this.message.set('Revisa tu correo y escribe el código de verificación para activar tu cuenta.');
        this.view.set('verify');
      },
      error: error => this.fail(error),
    });
  }

  verify(): void {
    this.clearFeedback();
    this.loading.set(true);
    this.adminService.verifyExternalEmail({ email: this.registeredEmail(), code: this.verificationCode }).subscribe({
      next: () => {
        this.loading.set(false);
        this.login.email = this.registeredEmail();
        this.login.password = this.account.password;
        this.startLogin();
      },
      error: error => this.fail(error),
    });
  }

  startLogin(): void {
    this.clearFeedback();
    this.loading.set(true);
    this.adminService.loginExternal(this.login).subscribe({
      next: session => {
        this.loading.set(false);
        this.session.set(session);
        this.loadTerritories();
        this.organization.contactEmail ||= session.email;
        this.view.set(this.wantsOrganization() ? 'organization' : 'complete');
        this.message.set(this.wantsOrganization()
          ? 'Tu cuenta ya está activa. Ahora registra los datos básicos de la organización.'
          : 'Tu cuenta está activa. Podrás completar tu perfil y administrar organizaciones cuando tengas autorización.');
      },
      error: error => this.fail(error),
    });
  }

  createOrganization(): void {
    this.clearFeedback();
    this.loading.set(true);
    this.adminService.createExternalOrganization(this.organization).subscribe({
      next: organization => {
        this.loading.set(false);
        this.createdOrganization.set(organization);
        this.view.set('complete');
        this.message.set('La organización quedó registrada y tú eres su administrador principal inicial. Podrás sumar otras personas autorizadas en un corte posterior.');
      },
      error: error => this.fail(error),
    });
  }

  openFestivalForm(): void {
    this.clearFeedback();
    this.loading.set(true);
    this.loadTerritories();
    this.adminService.fetchExternalOrganizations().subscribe({
      next: organizations => {
        this.organizations.set(organizations);
        if (!this.festival.organizacionId && organizations.length === 1) {
          this.festival.organizacionId = String(organizations[0].id);
          this.loadDraftFestivals();
          this.loadHistoricalFestivalMatches();
        }
        this.adminService.fetchFestivalCatalogs().subscribe({
          next: catalogs => {
            this.festivalCatalogs.set(catalogs);
            this.loading.set(false);
            this.view.set('festival');
          },
          error: error => this.fail(error),
        });
      },
      error: error => this.fail(error),
    });
  }

  createFestival(): void {
    this.clearFeedback();
    const organizacionId = Number(this.festival.organizacionId);
    if (!organizacionId || !this.festival.nombre.trim()) {
      this.error.set('Selecciona la organización responsable y escribe el nombre del Festival.');
      return;
    }
    this.loading.set(true);
    const solicitud = {
      nombre: this.festival.nombre,
      descripcion: this.festival.descripcion || null,
      periodicidad: this.festival.periodicidad || null,
      correoContacto: this.festival.correoContacto || null,
      nivelCobertura: this.festival.nivelCobertura,
      codigoDepartamento: this.festival.departmentCode || null,
      codigoMunicipio: this.festival.municipalityCode || null,
      practicasMusicalesIds: this.festival.practicasMusicalesIds,
      territoriosSonorosIds: this.festival.territoriosSonorosIds,
    };
    const festivalEnEdicion = this.festivalEnEdicion();
    const propuestaEnEdicion = this.propuestaEnEdicion();
    const guardar = propuestaEnEdicion
      ? this.adminService.actualizarPropuestaCambioFestival(Number(propuestaEnEdicion.festivalOrigenId), solicitud)
      : festivalEnEdicion
      ? this.adminService.updateExternalFestival(Number(festivalEnEdicion.id), solicitud)
      : this.adminService.createDraftFestival(organizacionId, solicitud);
    guardar.subscribe({
      next: festival => {
        this.loading.set(false);
        this.message.set(propuestaEnEdicion
          ? `Propuesta de cambios guardada para ${festival.nombre}. La información pública vigente no se modificó.`
          : festivalEnEdicion
          ? `Ajustes guardados para el Festival: ${festival.nombre}. Ya puedes enviarlo nuevamente a revisión.`
          : `Festival guardado como borrador: ${festival.nombre}.`);
        this.festivalEnEdicion.set(null);
        this.propuestaEnEdicion.set(null);
        this.festival.nombre = '';
        this.festival.descripcion = '';
        this.festival.periodicidad = '';
        this.festival.correoContacto = '';
        this.festival.practicasMusicalesIds = [];
        this.festival.territoriosSonorosIds = [];
        this.loadDraftFestivals();
      },
      error: error => this.fail(error),
    });
  }

  loadDraftFestivals(): void {
    const organizacionId = Number(this.festival.organizacionId);
    if (!organizacionId) {
      this.draftFestivals.set([]);
      return;
    }
    this.adminService.fetchDraftFestivals(organizacionId).subscribe({
      next: festivals => this.draftFestivals.set(festivals),
      error: error => this.fail(error),
    });
  }

  onFestivalOrganizationChange(): void {
    this.coincidenciaEnDetalle.set(null);
    this.loadDraftFestivals();
    this.loadHistoricalFestivalMatches();
  }

  loadHistoricalFestivalMatches(): void {
    const organizacionId = Number(this.festival.organizacionId);
    if (!organizacionId) {
      this.coincidenciasHistoricas.set([]);
      this.coincidenciasConsultadas.set(false);
      return;
    }

    this.cargandoCoincidencias.set(true);
    this.coincidenciasConsultadas.set(false);
    this.adminService.fetchHistoricalFestivalMatches(organizacionId).subscribe({
      next: coincidencias => {
        this.coincidenciasHistoricas.set(coincidencias);
        this.cargandoCoincidencias.set(false);
        this.coincidenciasConsultadas.set(true);
      },
      error: error => {
        this.coincidenciasHistoricas.set([]);
        this.coincidenciasConsultadas.set(true);
        this.fail(error);
      },
    });
  }

  etiquetaCoincidencia(tipo: CoincidenciaFestivalHistorico['tipoCoincidencia']): string {
    if (tipo === 'NominalYTerritorial') return 'Coincidencia nominal y territorial';
    if (tipo === 'NominalExacta') return 'Coincidencia nominal';
    return 'Evidencia histórica territorial';
  }

  sendFestivalToReview(festivalBorrador: any): void {
    this.clearFeedback();
    const confirmation = window.confirm(
      'Al enviar este Festival a revisión, la información será remitida a SIMUS para revisión institucional. Mientras esté en revisión, no podrás modificar directamente el registro. ¿Deseas continuar?'
    );
    if (!confirmation) return;

    this.loading.set(true);
    this.adminService.sendFestivalToReview(Number(festivalBorrador.id)).subscribe({
      next: festival => {
        this.loading.set(false);
        this.festivalEnRevision.set(festival);
        this.message.set(`Festival enviado a revisión: ${festival.nombre}.`);
        this.loadDraftFestivals();
      },
      error: error => this.fail(error),
    });
  }

  editFestival(festival: any): void {
    if (!['Borrador', 'AjustesSolicitados'].includes(festival.estado)) return;
    this.clearFeedback();
    this.festivalEnEdicion.set(festival);
    this.propuestaEnEdicion.set(null);
    this.cargarFormularioFestival(festival);
    this.message.set(`Editando ${festival.nombre}. Atiende la observación y guarda los ajustes antes de reenviarlo.`);
  }

  proponerCambiosFestival(festival: any): void {
    if (festival.estado !== 'Publicado') return;
    this.clearFeedback();
    this.loading.set(true);
    this.adminService.iniciarPropuestaCambioFestival(Number(festival.id)).subscribe({
      next: propuesta => {
        this.loading.set(false);
        this.festivalEnEdicion.set(null);
        this.propuestaEnEdicion.set(propuesta);
        this.cargarFormularioFestival(propuesta, festival.organizacionPrincipalId);
        this.message.set(`Estás preparando una propuesta de cambios para ${festival.nombre}. Los cambios no reemplazarán la información pública hasta que SIMUS los apruebe.`);
      },
      error: error => this.fail(error),
    });
  }

  enviarPropuestaARevision(festival: any): void {
    if (festival.estadoPropuesta !== 'Borrador' && festival.estadoPropuesta !== 'AjustesSolicitados') return;
    this.clearFeedback();
    if (!window.confirm('Al enviar la propuesta, SIMUS revisará los cambios. La ficha pública vigente no se modificará hasta una eventual publicación. ¿Deseas continuar?')) return;
    this.loading.set(true);
    this.adminService.enviarPropuestaCambioFestivalARevision(Number(festival.id)).subscribe({
      next: () => {
        this.loading.set(false);
        this.propuestaEnEdicion.set(null);
        this.message.set(`La propuesta de cambios para ${festival.nombre} fue enviada a revisión.`);
        this.loadDraftFestivals();
      },
      error: error => this.fail(error),
    });
  }

  private cargarFormularioFestival(fuente: any, organizacionId?: string): void {
    this.festival.organizacionId = organizacionId || fuente.organizacionPrincipalId || this.festival.organizacionId;
    this.festival.nombre = fuente.nombre || '';
    this.festival.descripcion = fuente.descripcion || '';
    this.festival.periodicidad = fuente.periodicidad || '';
    this.festival.correoContacto = fuente.correoContacto || '';
    this.festival.nivelCobertura = fuente.nivelCobertura || 'municipal';
    this.festival.departmentCode = fuente.codigoDepartamento || '';
    this.festival.municipalityCode = fuente.codigoMunicipio || '';
    this.festival.practicasMusicalesIds = (fuente.practicasMusicales || []).map((item: any) => Number(item.id));
    this.festival.territoriosSonorosIds = (fuente.territoriosSonoros || []).map((item: any) => Number(item.id));
  }

  goToLogin(): void { this.clearFeedback(); this.view.set('login'); }
  goToRegister(): void { this.clearFeedback(); this.view.set('register'); }

  private clearFeedback(): void { this.message.set(''); this.error.set(''); }
  private loadTerritories(): void {
    if (this.locations().length > 0) return;
    this.adminService.fetchExternalDivipola().subscribe({ next: locations => this.locations.set(locations), error: error => this.fail(error) });
  }
  private fail(error: any): void {
    this.loading.set(false);
    this.error.set(error?.message || 'No fue posible completar la solicitud. Inténtalo de nuevo.');
  }
}
