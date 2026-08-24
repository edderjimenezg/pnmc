import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideMap } from '@lucide/angular';

@Component({
  selector: 'app-ecosystem-map-access',
  standalone: true,
  imports: [LucideMap],
  template: `
    <div class="mt-8 border-t border-slate-200 pt-6 lg:mt-auto">
      <p class="mb-3 font-alternate text-[0.52rem] font-bold uppercase tracking-widest text-slate-400">Exploración territorial</p>
      <button type="button" (click)="activate.emit()" class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-alternate text-[0.6rem] font-bold uppercase tracking-widest text-slate-700 transition hover:border-[#087b3e] hover:bg-[#00DA5E]/10 hover:text-[#087b3e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A849] focus-visible:ring-offset-2"><svg lucideMap [size]="15"></svg>{{ label }}</button>
    </div>
  `,
})
export class EcosystemMapAccessComponent {
  @Input() label = 'Ver registros en el mapa';
  @Output() activate = new EventEmitter<void>();
}
