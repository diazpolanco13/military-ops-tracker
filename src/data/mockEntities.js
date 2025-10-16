/**
 * 🚢 ENTIDADES MILITARES DEL CARIBE
 * Destructores y Fragatas de la US Navy + Avión de reconocimiento
 */

export const MOCK_ENTITIES = [
  // 🔴 DESTRUCTORES (DDG - Arleigh Burke class)
  {
    id: '1',
    name: 'USS Arleigh Burke',
    class: 'DDG-51',
    type: 'destructor',
    latitude: 18.4655,
    longitude: -66.1057, // Puerto Rico
    status: 'activo',
    heading: 45,
    speed: 18.5,
    armamento: 'Misiles Tomahawk, SM-2/3, Torpedos',
  },
  {
    id: '2',
    name: 'USS The Sullivans',
    class: 'DDG-68',
    type: 'destructor',
    latitude: 12.5844,
    longitude: -69.7006, // Sur de Curazao
    status: 'patrullando',
    heading: 270,
    speed: 22.0,
    armamento: 'Misiles Tomahawk, SM-2/3, Torpedos',
  },

  // 🔵 FRAGATAS (FFG - Oliver Hazard Perry & Constellation class)
  {
    id: '3',
    name: 'USS Samuel B. Roberts',
    class: 'FFG-58',
    type: 'fragata',
    latitude: 12.5211,
    longitude: -69.9683, // Aruba
    status: 'estacionado',
    heading: 0,
    speed: 0,
    armamento: 'Misiles SM-1, Cañón Mk 75, Torpedos Mk 46',
  },
  {
    id: '4',
    name: 'USS Constellation',
    class: 'FFG-62',
    type: 'fragata',
    latitude: 10.4806,
    longitude: -66.9036, // Norte de Venezuela
    status: 'vigilancia',
    heading: 135,
    speed: 15.0,
    armamento: 'Misiles NSM, RAM, Cañón Mk 110',
  },

  // 🟡 AVIÓN DE RECONOCIMIENTO
  {
    id: '5',
    name: 'P-8A Poseidon',
    class: 'Patrulla Marítima',
    type: 'avion',
    latitude: 15.2,
    longitude: -68.5, // Sobre el Caribe
    status: 'en_vuelo',
    heading: 180,
    speed: 450,
    altitude: 9000,
    armamento: 'Torpedos Mk 54, Misiles AGM-84 Harpoon',
  },
];

