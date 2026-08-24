import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideLayoutGrid, LucideList } from '@lucide/angular';
import { EcosystemMetric, EcosystemMetricsStripComponent } from '../ecosystem-metrics-strip/ecosystem-metrics-strip.component';

export type EcosystemView = 'lista' | 'mosaico';

@Component({
  selector: 'app-ecosystem-exploration-toolbar',
  standalone: true,
  imports: [EcosystemMetricsStripComponent, LucideLayoutGrid, LucideList],
  template: `
    <section class="grid gap-4 border-b border-slate-100 pb-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <app-ecosystem-metrics-strip [metrics]="metrics"></app-ecosystem-metrics-strip>
      <div class="flex shrink-0 items-center self-center justify-self-start rounded-xl border border-slate-200 bg-white p-1 lg:justify-self-end" role="group" aria-label="Modo de visualización">
        <button type="button" (click)="vistaChange.emit('lista')" [class]="'rounded-lg px-3 py-2 ' + (vista === 'lista' ? 'bg-[#291242] text-white' : 'text-slate-500 hover:bg-slate-50')"><svg lucideList [size]="15"></svg><span class="sr-only">Lista</span></button>
        <button type="button" (click)="vistaChange.emit('mosaico')" [class]="'rounded-lg px-3 py-2 ' + (vista === 'mosaico' ? 'bg-[#291242] text-white' : 'text-slate-500 hover:bg-slate-50')"><svg lucideLayoutGrid [size]="15"></svg><span class="sr-only">Mosaico</span></button>
      </div>
    </section>
  `,
})
export class EcosystemExplorationToolbarComponent {
  @Input() metrics: EcosystemMetric[] = [];
  @Input() vista: EcosystemView = 'lista';
  @Output() vistaChange = new EventEmitter<EcosystemView>();
}
