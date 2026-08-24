import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LucideArrowRight, LucideConstruction, LucideMap } from '@lucide/angular';
import { NavigationService } from '../../../../core/services/navigation.service';
import { PageHeroComponent } from '../../../../shared/components/ui/page-hero/page-hero.component';

const PAGES: Record<string, { eyebrow: string; title: string; description: string }> = {
  '': { eyebrow: 'SIMUS', title: 'Explora el ecosistema musical', description: 'Consulta los registros públicos del ecosistema musical colombiano. Los directorios especializados se incorporarán progresivamente.' },
  agrupaciones: { eyebrow: 'Ecosistema musical', title: 'Agrupaciones musicales', description: 'Este directorio está en construcción. Próximamente permitirá explorar procesos colectivos, prácticas musicales y presencia territorial.' },
  agentes: { eyebrow: 'Ecosistema musical', title: 'Agentes del sector', description: 'Este directorio está en construcción. Reunirá perfiles y organizaciones que fortalecen el ecosistema musical.' },
  escenarios: { eyebrow: 'Ecosistema musical', title: 'Escenarios musicales', description: 'Esta página está en construcción. Permitirá consultar espacios e infraestructura para la creación y circulación musical.' },
  festivales: { eyebrow: 'Ecosistema musical', title: 'Festivales', description: 'El directorio especializado está en construcción. Por ahora puedes consultar esta categoría en el Mapa Ecosistémico.' },
  'mercados-musicales': { eyebrow: 'Ecosistema musical', title: 'Mercados musicales', description: 'El directorio especializado está en construcción. Por ahora puedes consultar esta categoría en el Mapa Ecosistémico.' },
  'redes-documentacion': { eyebrow: 'Ecosistema musical', title: 'Redes y documentación', description: 'El directorio especializado está en construcción. Por ahora puedes consultar esta categoría en el Mapa Ecosistémico.' },
  luteria: { eyebrow: 'Ecosistema musical', title: 'Lutería', description: 'El directorio especializado está en construcción. Por ahora puedes consultar esta categoría en el Mapa Ecosistémico.' },
  'acerca-de': { eyebrow: 'SIMUS', title: 'Acerca de SIMUS', description: 'Estamos preparando un espacio para explicar el propósito, el alcance y la forma de participación en el Sistema de Información de la Música.' },
  ayuda: { eyebrow: 'SIMUS', title: 'Ayuda y tutoriales', description: 'Estamos preparando guías para consultar, registrar y actualizar información dentro de SIMUS.' },
  ingresar: { eyebrow: 'SIMUS', title: 'Ingresar a SIMUS', description: 'Estamos preparando la experiencia de acceso para quienes gestionan, actualizan y validan información del ecosistema musical.' },
  participa: { eyebrow: 'SIMUS', title: 'Ser parte del SIMUS', description: 'Estamos preparando el acceso público para registrar tu proceso, organización o infraestructura dentro del Sistema de Información de la Música.' },
};

@Component({ selector: 'app-ecosystem-coming-soon-page', standalone: true, imports: [CommonModule, PageHeroComponent, LucideArrowRight, LucideConstruction, LucideMap], templateUrl: './ecosystem-coming-soon-page.component.html' })
export class EcosystemComingSoonPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly navigation = inject(NavigationService);
  readonly page = computed(() => PAGES[this.route.snapshot.data['seccionSimus'] || this.route.snapshot.paramMap.get('module') || this.route.snapshot.paramMap.get('section') || ''] || PAGES['']);
  openMap(): void { this.navigation.navigate('mapa'); }
  openSchools(): void { this.navigation.routerNavigate('ecosistema-musical/escuelas'); }
  goBack(): void { this.navigation.navigate('simus'); }
}
