import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-festival-review-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-festival-review-panel.component.html',
})
export class AdminFestivalReviewPanelComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  festivales = signal<any[]>([]);
  cargando = signal(false);
  mensaje = signal('');
  error = signal('');
  festivalSeleccionado = signal<any | null>(null);
  accion = 'SolicitarAjustes';
  observacion = '';

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando.set(true);
    this.adminService.fetchInstitutionalFestivalReviewQueue().subscribe({
      next: festivales => { this.festivales.set(festivales); this.cargando.set(false); },
      error: error => { this.error.set(error?.message || 'No fue posible cargar la bandeja.'); this.cargando.set(false); },
    });
  }

  abrirDecision(festival: any): void {
    this.festivalSeleccionado.set(festival);
    this.accion = 'SolicitarAjustes';
    this.observacion = '';
    this.mensaje.set('');
    this.error.set('');
  }

  decidir(): void {
    const festival = this.festivalSeleccionado();
    if (!festival) return;
    if (this.accion !== 'Publicar' && !this.observacion.trim()) {
      this.error.set(this.accion === 'Rechazar' ? 'Escribe el motivo del rechazo.' : 'Escribe la observación para la organización.');
      return;
    }
    this.cargando.set(true);
    this.adminService.decideInstitutionalFestivalReview(Number(festival.id), {
      accion: this.accion,
      observacion: this.accion === 'SolicitarAjustes' ? this.observacion : null,
      motivoRechazo: this.accion === 'Rechazar' ? this.observacion : null,
    }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.festivalSeleccionado.set(null);
        this.mensaje.set('La decisión institucional fue registrada.');
        this.cargar();
      },
      error: error => { this.cargando.set(false); this.error.set(error?.message || 'No fue posible registrar la decisión.'); },
    });
  }
}
