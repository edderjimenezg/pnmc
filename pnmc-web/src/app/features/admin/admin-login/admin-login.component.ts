import { Component, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { 
  LucideMail, 
  LucideLock, 
  LucideEye, 
  LucideEyeOff, 
  LucideShieldCheck, 
  LucideAlertCircle, 
  LucideRefreshCw, 
  LucideCheckCircle2, 
  LucideUserCheck, 
  LucideChevronRight, 
  LucideCheckCircle
} from '@lucide/angular';
import { SessionService } from '../../../core/services/session.service';
import { AdminService } from '../../../core/services/admin.service';
import { ADMIN_ROLES } from '../domain/admin-config';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LucideMail,
    LucideLock,
    LucideEye,
    LucideEyeOff,
    LucideShieldCheck,
    LucideAlertCircle,
    LucideRefreshCw,
    LucideCheckCircle2,
    LucideUserCheck,
    LucideChevronRight,
    LucideCheckCircle
  ],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent {
  private sessionService = inject(SessionService);
  private adminService = inject(AdminService);

  @Output() loginSuccess = new EventEmitter<any>();

  // Global State
  isExternalPortal = signal<boolean>(false);

  @Input() set externalPortal(value: boolean) {
    this.isExternalPortal.set(value);
  }

  // Internal Login State
  selectedRole = signal<string>('webmaster');
  email = signal<string>('admin@pnmc.local');
  password = signal<string>('admin');
  loginState = signal<{ status: string; message: string }>({ status: 'idle', message: '' });
  formMode = signal<string>('login'); // 'login' | 'recover'
  recoverEmail = signal<string>('');
  recoverSuccess = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  inputsGlowing = signal<boolean>(false);
  showDevPanel = signal<boolean>(false);

  // External Login State
  activeTab = signal<string>('login'); // 'login' | 'register'
  externalEmail = signal<string>('colaborador@external.local');
  externalPassword = signal<string>('password');
  confirmPassword = signal<string>('');
  fullName = signal<string>('');
  profileType = signal<string>('organizacion');
  captchaChecked = signal<boolean>(false);
  captchaVerifying = signal<boolean>(false);
  message = signal<string>('');
  status = signal<string>('idle');
  showMailConfirm = signal<boolean>(false);
  showExternalPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  showLoginPassword = signal<boolean>(false);
  verificationCode = signal<string>('');
  verificationCodeInput = signal<string>('');
  pendingRegistration = signal<any>(null);

  // Icons reference for templates
  LucideMail = LucideMail;
  LucideLock = LucideLock;
  LucideEye = LucideEye;
  LucideEyeOff = LucideEyeOff;
  LucideShieldCheck = LucideShieldCheck;
  LucideAlertCircle = LucideAlertCircle;
  LucideRefreshCw = LucideRefreshCw;
  LucideCheckCircle2 = LucideCheckCircle2;
  LucideUserCheck = LucideUserCheck;
  LucideChevronRight = LucideChevronRight;
  LucideCheckCircle = LucideCheckCircle;

  // Panel "Cuentas de Prueba": solo webmaster (control total). Las cuentas de
  // aliado no se ofrecen aqui porque su consola es una linea de trabajo
  // aparte. 'externo' tampoco: AdminAuthEndpoints rechaza ese rol en este
  // login a proposito (no es una cuenta institucional); su acceso es el
  // boton "Ingresar al Portal de Colaboradores Externos", mas abajo.
  ROLE_CREDENTIALS: Record<string, { email: string; password?: string }> = {
    webmaster: { email: 'admin@pnmc.local', password: 'admin' },
  };

  adminRoles = Object.values(ADMIN_ROLES);

  selectRole(roleId: string) {
    if (this.formMode() !== 'login') {
      this.formMode.set('login');
    }
    this.selectedRole.set(roleId);
    const creds = this.ROLE_CREDENTIALS[roleId];
    if (creds) {
      this.email.set(creds.email);
      this.password.set(creds.password || '');
    }
    this.inputsGlowing.set(true);
    setTimeout(() => this.inputsGlowing.set(false), 800);
  }

  async handleSubmit(event: Event) {
    event.preventDefault();
    this.loginState.set({ status: 'saving', message: 'Validando credenciales...' });
    
    // Simulate or call API via SessionService
    this.sessionService.login({ email: this.email(), password: this.password() }).subscribe({
      next: (res) => {
        this.loginState.set({ status: 'idle', message: '' });
        this.loginSuccess.emit(res.user);
      },
      error: (err) => {
        this.loginState.set({ status: 'error', message: err.message || 'Error de inicio de sesión' });
      }
    });
  }

  handleRecoverSubmit(event: Event) {
    event.preventDefault();
    if (!this.recoverEmail()) return;
    this.loginState.set({ status: 'saving', message: 'Enviando solicitud...' });
    
    setTimeout(() => {
      this.recoverSuccess.set(true);
      this.loginState.set({ status: 'idle', message: '' });
    }, 1000);
  }

  // El cambio institucional <-> externo ya no ocurre dentro de la pagina:
  // cada publico tiene su propia ruta ('/consola-interna' e '/ingreso' o
  // '/colaboradores'), enlazadas entre si con routerLink en la plantilla.

  // External Portal Methods
  handleSocialAuth(providerLabel: string) {
    this.status.set('info');
    this.message.set(`${providerLabel} requiere credenciales OAuth reales del proyecto. Dejé la interfaz lista para conectarlo cuando definamos esas llaves.`);
  }

  handleExternalLogin(event: Event) {
    event.preventDefault();
    this.status.set('loading');
    this.message.set('Validando credenciales en el portal externo...');

    // Llama a loginExternal (POST /api/v1/external/auth/login), no a
    // sessionService.login: ese siempre llama a la API institucional, que
    // rechaza a proposito el rol 'externo' (no es una cuenta institucional).
    this.adminService.loginExternal({ email: this.externalEmail(), password: this.externalPassword() }).subscribe({
      next: (res) => {
        this.status.set('idle');
        this.message.set('');
        // La respuesta de /external/auth/login trae "userId", no "id" como
        // el resto de la app espera; se normaliza antes de emitirla.
        this.loginSuccess.emit({ ...res, id: res.id ?? res.userId });
      },
      error: () => {
        this.status.set('error');
        this.message.set('Error de autenticación: Credenciales no registradas o inválidas.');
      }
    });
  }

  handleExternalRegister(event: Event) {
    event.preventDefault();
    if (!this.captchaChecked()) {
      this.message.set('Por favor, verifique que no es un robot.');
      return;
    }
    if (this.externalPassword().length < 10) {
      this.message.set('La contraseña debe tener mínimo 10 caracteres.');
      return;
    }
    if (this.externalPassword() !== this.confirmPassword()) {
      this.message.set('La confirmación de contraseña no coincide.');
      return;
    }
    this.status.set('loading');
    this.message.set('Creando cuenta de colaborador y generando código de activación...');
    
    setTimeout(() => {
      const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
      const newUser = {
        id: `usr-ext-${Date.now()}`,
        fullName: this.fullName(),
        email: this.externalEmail(),
        password: this.externalPassword(),
        role: 'gestor',
        isActive: true,
        profileType: this.profileType(),
      };
      this.pendingRegistration.set(newUser);
      this.verificationCode.set(generatedCode);
      this.verificationCodeInput.set('');
      this.status.set('idle');
      this.message.set(`Enviamos un código de activación al correo ${this.externalEmail()}. Para pruebas locales puedes usar: ${generatedCode}.`);
      this.showMailConfirm.set(true);
    }, 1200);
  }

  handleVerifyRegistrationCode(event: Event) {
    event.preventDefault();
    if (this.verificationCodeInput().trim() !== this.verificationCode()) {
      this.status.set('error');
      this.message.set('El código ingresado no coincide con el enviado al correo.');
      return;
    }
    
    // Register the user
    const pending = this.pendingRegistration();
    if (pending) {
      this.adminService.registerExternalUser(pending).subscribe({
        next: () => {
          this.status.set('success');
          this.message.set('¡Cuenta activada! Ya puedes iniciar sesión con tus credenciales.');
          this.showMailConfirm.set(false);
          this.activeTab.set('login');
          // Reset fields
          this.fullName.set('');
          this.confirmPassword.set('');
        },
        error: (err) => {
          // Fallback to local emulation if API fails or for testing
          this.status.set('success');
          this.message.set('¡Cuenta activada (Simulado)! Ya puedes iniciar sesión con tus credenciales.');
          this.showMailConfirm.set(false);
          this.activeTab.set('login');
          this.fullName.set('');
          this.confirmPassword.set('');
        }
      });
    }
  }

  handleCaptchaClick() {
    if (this.captchaChecked()) return;
    this.captchaVerifying.set(true);
    setTimeout(() => {
      this.captchaVerifying.set(false);
      this.captchaChecked.set(true);
    }, 1500);
  }
}
