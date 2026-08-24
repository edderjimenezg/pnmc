export type EcosystemCategory = {
  title: string;
  route: string;
  layer: string;
  description: string;
  status: 'Disponible' | 'Próximamente';
  icon: 'school' | 'groups' | 'agents' | 'spaces' | 'festivals' | 'markets' | 'networks' | 'luthier';
  countKey?: 'schools' | 'festivals' | 'markets' | 'networks' | 'lutiers';
  group: 'actors' | 'processes';
};

// Los 8 tipos de actores/procesos del ecosistema musical (SIMUS). Compartido entre
// la página de SIMUS y el preview del Home para no duplicar la lista en dos sitios.
export const ECOSYSTEM_CATEGORIES: EcosystemCategory[] = [
  { title: 'Escuelas de música', route: 'ecosistema-musical/escuelas', layer: 'Escuelas de Música', description: 'Procesos formativos, capacidades pedagógicas y presencia territorial.', status: 'Disponible', icon: 'school', countKey: 'schools', group: 'actors' },
  { title: 'Agrupaciones', route: 'ecosistema-musical/agrupaciones', layer: 'General', description: 'Procesos colectivos, formatos y prácticas musicales.', status: 'Próximamente', icon: 'groups', group: 'actors' },
  { title: 'Agentes', route: 'ecosistema-musical/agentes', layer: 'General', description: 'Personas, organizaciones y oficios que articulan el sector.', status: 'Próximamente', icon: 'agents', group: 'actors' },
  { title: 'Escenarios', route: 'ecosistema-musical/escenarios', layer: 'General', description: 'Infraestructura y lugares para creación y circulación.', status: 'Próximamente', icon: 'spaces', group: 'actors' },
  { title: 'Festivales', route: 'ecosistema-musical/festivales', layer: 'Festivales', description: 'Celebraciones, encuentros y circuitos de circulación.', status: 'Disponible', icon: 'festivals', countKey: 'festivals', group: 'processes' },
  { title: 'Mercados musicales', route: 'ecosistema-musical/mercados-musicales', layer: 'Mercados Musicales', description: 'Nodos de intercambio, visibilización y profesionalización.', status: 'Próximamente', icon: 'markets', countKey: 'markets', group: 'processes' },
  { title: 'Redes y documentación', route: 'ecosistema-musical/redes-documentacion', layer: 'Redes de Documentación', description: 'Memoria, archivos, investigación y redes de conocimiento.', status: 'Próximamente', icon: 'networks', countKey: 'networks', group: 'processes' },
  { title: 'Lutería', route: 'ecosistema-musical/luteria', layer: 'Lutieres', description: 'Saberes, construcción y reparación de instrumentos.', status: 'Próximamente', icon: 'luthier', countKey: 'lutiers', group: 'processes' },
];
