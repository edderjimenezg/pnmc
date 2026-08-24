import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LucideBarChart3, LucideMap, LucideMapPinned, LucideMusic2 } from '@lucide/angular';

export interface EcosystemMetric {
  label: string;
  value: string | number;
  detail?: string;
}

@Component({
  selector: 'app-ecosystem-metrics-strip',
  standalone: true,
  imports: [CommonModule, LucideBarChart3, LucideMap, LucideMapPinned, LucideMusic2],
  template: `
    <section class="grid w-full grid-cols-2 divide-x divide-y divide-slate-100 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-4 sm:divide-y-0" aria-label="Resumen del directorio">
      @for (metric of metrics; track metric.label) {
        <div class="min-w-0 px-5 py-5 sm:px-6">
          <p class="flex items-center gap-2 font-alternate text-[0.56rem] font-bold uppercase tracking-widest text-[#00a849]">
            @switch (iconFor(metric.label)) {
              @case ('departamentos') { <svg lucideMap class="h-3.5 w-3.5" aria-hidden="true"></svg> }
              @case ('municipios') { <svg lucideMapPinned class="h-3.5 w-3.5" aria-hidden="true"></svg> }
              @case ('practicas') { <svg lucideMusic2 class="h-3.5 w-3.5" aria-hidden="true"></svg> }
              @default { <svg lucideBarChart3 class="h-3.5 w-3.5" aria-hidden="true"></svg> }
            }
            {{ metric.label }}
          </p>
          <p class="mt-3 font-alternate text-4xl font-bold leading-none text-[#291242]">{{ metric.value }}</p>
          @if (metric.detail) { <p class="mt-2 text-xs leading-snug text-slate-500">{{ metric.detail }}</p> }
        </div>
      }
    </section>
  `,
})
export class EcosystemMetricsStripComponent {
  @Input() metrics: EcosystemMetric[] = [];

  iconFor(label: string): 'resultados' | 'departamentos' | 'municipios' | 'practicas' {
    const normalizedLabel = label.toLocaleLowerCase('es-CO');

    if (normalizedLabel.includes('departamento')) return 'departamentos';
    if (normalizedLabel.includes('municipio')) return 'municipios';
    if (normalizedLabel.includes('práctica') || normalizedLabel.includes('practica')) return 'practicas';

    return 'resultados';
  }
}
