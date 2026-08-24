import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavigationComponent } from './shared/components/layout/navigation/navigation.component';
import { FooterComponent } from './shared/components/layout/footer/footer.component';
import { FloatingButtonComponent } from './shared/components/ui/floating-button/floating-button.component';
import { NavigationService, PAGE_IDS } from './core/services/navigation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavigationComponent,
    FooterComponent,
    FloatingButtonComponent,
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'PNMC';
  public navigationService = inject(NavigationService);
  
  // Estado de scroll reactivo
  scrolled = signal(false);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled.set(window.scrollY > 20);
  }

  showNavigation = computed(() => {
    const page = this.navigationService.activePage();
    return page !== PAGE_IDS.admin && page !== PAGE_IDS.colaboradores && page !== PAGE_IDS.registro;
  });

  isSolidNavigation = computed(() => {
    const page = this.navigationService.activePage();
    // Ecosistema Musical conserva un hero fotográfico (como PNMC), así que el nav
    // debe comportarse igual: transparente sobre la foto y sólido al hacer scroll.
    // Mapa/Editorial/Galería/Noticias/Agenda ya no tienen hero, así que necesitan
    // el nav sólido desde el inicio (un nav transparente sería ilegible sobre fondo blanco).
    return page === PAGE_IDS.mapa
      || page === PAGE_IDS.editorial
      || page === PAGE_IDS.galeria
      || page === PAGE_IDS.noticias
      || page === PAGE_IDS.agenda
      || page === PAGE_IDS.ecosistemaMusical
      || page === PAGE_IDS.registro;
  });

  showGlobalFooter = computed(() => {
    const page = this.navigationService.activePage();
    return page !== PAGE_IDS.home &&
           page !== PAGE_IDS.admin &&
           page !== PAGE_IDS.colaboradores &&
           page !== PAGE_IDS.registro &&
           page !== PAGE_IDS.mapa;
  });

  showFloatingButton = computed(() => this.navigationService.activePage() !== PAGE_IDS.registro);
}
