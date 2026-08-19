import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'pnmc',
    loadComponent: () => import('./features/pnmc/pages/sobre-el-pnmc-page/sobre-el-pnmc-page.component').then(m => m.SobreElPnmcPageComponent),
  },
  {
    path: 'ejes',
    loadComponent: () => import('./features/content/pages/ejes-page/ejes-page.component').then(m => m.EjesPageComponent),
  },
  {
    path: 'ejes/componentes/:componentId',
    loadComponent: () => import('./features/content/pages/component-detail-page/component-detail-page.component').then(m => m.ComponentDetailPageComponent),
  },
  {
    path: 'noticias',
    loadComponent: () => import('./features/news/pages/noticias-page/noticias-page.component').then(m => m.NoticiasPageComponent),
  },
  {
    path: 'noticias/:articleId',
    loadComponent: () => import('./features/news/pages/noticias-page/noticias-page.component').then(m => m.NoticiasPageComponent),
  },
  {
    path: 'agenda',
    loadComponent: () => import('./features/agenda/pages/agenda-page/agenda-page.component').then(m => m.AgendaPageComponent),
  },
  {
    path: 'editorial',
    loadComponent: () => import('./features/editorial/pages/editorial-page/editorial-page.component').then(m => m.EditorialPageComponent),
  },
  {
    path: 'galeria',
    loadComponent: () => import('./features/gallery/pages/galeria-page/galeria-page.component').then(m => m.GaleriaPageComponent),
  },
  {
    path: 'mapa',
    loadComponent: () => import('./features/map/pages/mapa-ecosistemico-page/mapa-ecosistemico-page.component').then(m => m.MapaEcosistemicoPageComponent),
  },
  {
    path: 'simus/escuelas/:schoolId',
    loadComponent: () => import('./features/ecosystem/pages/school-detail-page/school-detail-page.component').then(m => m.SchoolDetailPageComponent),
  },
  {
    path: 'simus/escuelas',
    loadComponent: () => import('./features/ecosystem/pages/schools-page/schools-page.component').then(m => m.SchoolsPageComponent),
  },
  {
    path: 'simus/festivales/:festivalId',
    loadComponent: () => import('./features/ecosystem/pages/festival-publico-detalle-page/festival-publico-detalle-page.component').then(m => m.FestivalPublicoDetallePageComponent),
  },
  {
    path: 'simus/festivales',
    loadComponent: () => import('./features/ecosystem/pages/festivales-publicos-page/festivales-publicos-page.component').then(m => m.FestivalesPublicosPageComponent),
  },
  {
    path: 'registro',
    loadComponent: () => import('./features/external-access/external-access-page.component').then(m => m.ExternalAccessPageComponent),
  },
  {
    path: 'simus/participa',
    redirectTo: 'registro',
    pathMatch: 'full',
  },
  {
    path: 'simus/ingresar',
    loadComponent: () => import('./features/external-access/external-access-page.component').then(m => m.ExternalAccessPageComponent),
    data: { modoAcceso: 'ingresar' },
  },
  {
    path: 'simus/:section',
    loadComponent: () => import('./features/ecosystem/pages/ecosystem-coming-soon-page/ecosystem-coming-soon-page.component').then(m => m.EcosystemComingSoonPageComponent),
  },
  {
    path: 'simus',
    loadComponent: () => import('./features/simus/pages/simus-home-page/simus-home-page.component').then(m => m.SimusHomePageComponent),
  },
  // Rutas antiguas de "Ecosistema" (ahora integrado dentro de SIMUS): se conservan como redirecciones
  // para no romper enlaces o marcadores existentes.
  { path: 'ecosistema/escuelas/:schoolId', redirectTo: 'simus/escuelas/:schoolId' },
  { path: 'ecosistema/escuelas', redirectTo: 'simus/escuelas', pathMatch: 'full' },
  { path: 'ecosistema/:module', redirectTo: 'simus/:module' },
  { path: 'ecosistema', redirectTo: 'simus', pathMatch: 'full' },
  { path: 'mapa/participa', redirectTo: 'colaboradores', pathMatch: 'full' },
  {
    path: 'estrategia/circulacion',
    loadComponent: () => import('./features/content/pages/strategy-page/strategy-page.component').then(m => m.StrategyPageComponent),
    data: { strategy: 'circulacion' },
  },
  {
    path: 'estrategia/investigacion',
    loadComponent: () => import('./features/content/pages/strategy-page/strategy-page.component').then(m => m.StrategyPageComponent),
    data: { strategy: 'investigacion' },
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-shell-page/admin-shell-page.component').then(m => m.AdminShellPageComponent),
  },
  {
    path: 'colaboradores',
    loadComponent: () => import('./features/admin/admin-shell-page/admin-shell-page.component').then(m => m.AdminShellPageComponent),
  },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found-page.component').then(m => m.NotFoundPageComponent),
  },
];
