export const SYSTEM_CONFIG = {
  sources: {
    tota: { name: 'Lago Tota', capacity: 250, current: 250 },
    tejar: { name: 'Río Tejar', capacity: 15, current: 15 },
    pozo: { name: 'Pozo Profundo', capacity: 10, current: 10 }
  },
  plants: {
    chacon: { name: 'El Chacón', capacity: 365, storage: 10000 },
    sur: { name: 'El Sur', capacity: 60, storage: 0 },
    mode: { name: 'El Mode', capacity: 30, storage: 856 }
  },
  sectors: [
    { id: 1, name: 'Sector 1 (Sur)', population: 10000, currentLoss: 71, demand: 60 },
    { id: 2, name: 'Sector 2', population: 6000, currentLoss: 4, demand: 35 },
    { id: 3, name: 'Sector 3 (Centro)', population: 30000, currentLoss: 41, demand: 88 },
    { id: 4, name: 'Sector 4', population: 25000, currentLoss: 26, demand: 75 },
    { id: 5, name: 'Sector 5 (Mode Rural)', population: 4000, currentLoss: 62, demand: 15 },
    { id: 6, name: 'Sector 6', population: 2000, currentLoss: 43, demand: 9 },
    { id: 7, name: 'Sector 7', population: 2000, currentLoss: 9, demand: 10 },
    { id: 8, name: 'Sector 8 (Norte)', population: 22000, currentLoss: 38, demand: 72 },
    { id: 9, name: 'Sector 9', population: 7000, currentLoss: 44, demand: 20 },
    { id: 10, name: 'Sector 10 (Santa Bárbara)', population: 3000, currentLoss: 39, demand: 11 }
  ]
};