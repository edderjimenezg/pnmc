import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface EcosystemMetric {
  label: string;
  value: string | number;
  detail?: string;
}

@Component({
  selector: 'app-ecosystem-metrics-strip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="grid flex-1 grid-cols-2 divide-x divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70 sm:grid-cols-4" aria-label="Resumen del directorio">
      @for (metric of metrics; track metric.label) {
        <div class="min-w-0 px-4 py-3.5">
          <p class="font-alternate text-[0.52rem] font-bold uppercase tracking-widest text-slate-400">{{ metric.label }}</p>
          <p class="mt-1 font-alternate text-lg font-bold text-[#291242]">{{ metric.value }}</p>
          @if (metric.detail) { <p class="mt-0.5 truncate text-[0.68rem] text-slate-500">{{ metric.detail }}</p> }
        </div>
      }
    </section>
  `,
})
export class EcosystemMetricsStripComponent {
  @Input() metrics: EcosystemMetric[] = [];
}
