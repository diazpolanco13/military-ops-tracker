/**
 * 🌍 Lista completa de países del mundo con códigos ISO3
 * Fuente: ISO 3166-1 alpha-3
 */
export const WORLD_COUNTRIES = [
  // Américas
  { code: 'ARG', name: 'Argentina', region: 'Sudamérica' },
  { code: 'BHS', name: 'Bahamas', region: 'Caribe' },
  { code: 'BRB', name: 'Barbados', region: 'Caribe' },
  { code: 'BLZ', name: 'Belice', region: 'Centroamérica' },
  { code: 'BOL', name: 'Bolivia', region: 'Sudamérica' },
  { code: 'BRA', name: 'Brasil', region: 'Sudamérica' },
  { code: 'CAN', name: 'Canadá', region: 'Norteamérica' },
  { code: 'CHL', name: 'Chile', region: 'Sudamérica' },
  { code: 'COL', name: 'Colombia', region: 'Sudamérica' },
  { code: 'CRI', name: 'Costa Rica', region: 'Centroamérica' },
  { code: 'CUB', name: 'Cuba', region: 'Caribe' },
  { code: 'DOM', name: 'República Dominicana', region: 'Caribe' },
  { code: 'ECU', name: 'Ecuador', region: 'Sudamérica' },
  { code: 'SLV', name: 'El Salvador', region: 'Centroamérica' },
  { code: 'GRD', name: 'Granada', region: 'Caribe' },
  { code: 'GTM', name: 'Guatemala', region: 'Centroamérica' },
  { code: 'GUY', name: 'Guyana', region: 'Sudamérica' },
  { code: 'HTI', name: 'Haití', region: 'Caribe' },
  { code: 'HND', name: 'Honduras', region: 'Centroamérica' },
  { code: 'JAM', name: 'Jamaica', region: 'Caribe' },
  { code: 'MEX', name: 'México', region: 'Norteamérica' },
  { code: 'NIC', name: 'Nicaragua', region: 'Centroamérica' },
  { code: 'PAN', name: 'Panamá', region: 'Centroamérica' },
  { code: 'PRY', name: 'Paraguay', region: 'Sudamérica' },
  { code: 'PER', name: 'Perú', region: 'Sudamérica' },
  { code: 'SUR', name: 'Suriname', region: 'Sudamérica' },
  { code: 'TTO', name: 'Trinidad y Tobago', region: 'Caribe' },
  { code: 'USA', name: 'Estados Unidos', region: 'Norteamérica' },
  { code: 'URY', name: 'Uruguay', region: 'Sudamérica' },
  { code: 'VEN', name: 'Venezuela', region: 'Sudamérica' },
  { code: 'ABW', name: 'Aruba', region: 'Caribe' },
  { code: 'CUW', name: 'Curaçao', region: 'Caribe' },
  
  // Europa
  { code: 'ALB', name: 'Albania', region: 'Europa' },
  { code: 'AND', name: 'Andorra', region: 'Europa' },
  { code: 'AUT', name: 'Austria', region: 'Europa' },
  { code: 'BEL', name: 'Bélgica', region: 'Europa' },
  { code: 'BGR', name: 'Bulgaria', region: 'Europa' },
  { code: 'HRV', name: 'Croacia', region: 'Europa' },
  { code: 'CYP', name: 'Chipre', region: 'Europa' },
  { code: 'CZE', name: 'República Checa', region: 'Europa' },
  { code: 'DNK', name: 'Dinamarca', region: 'Europa' },
  { code: 'EST', name: 'Estonia', region: 'Europa' },
  { code: 'FIN', name: 'Finlandia', region: 'Europa' },
  { code: 'FRA', name: 'Francia', region: 'Europa' },
  { code: 'DEU', name: 'Alemania', region: 'Europa' },
  { code: 'GRC', name: 'Grecia', region: 'Europa' },
  { code: 'HUN', name: 'Hungría', region: 'Europa' },
  { code: 'ISL', name: 'Islandia', region: 'Europa' },
  { code: 'IRL', name: 'Irlanda', region: 'Europa' },
  { code: 'ITA', name: 'Italia', region: 'Europa' },
  { code: 'LVA', name: 'Letonia', region: 'Europa' },
  { code: 'LTU', name: 'Lituania', region: 'Europa' },
  { code: 'LUX', name: 'Luxemburgo', region: 'Europa' },
  { code: 'MLT', name: 'Malta', region: 'Europa' },
  { code: 'NLD', name: 'Países Bajos', region: 'Europa' },
  { code: 'NOR', name: 'Noruega', region: 'Europa' },
  { code: 'POL', name: 'Polonia', region: 'Europa' },
  { code: 'PRT', name: 'Portugal', region: 'Europa' },
  { code: 'ROU', name: 'Rumanía', region: 'Europa' },
  { code: 'RUS', name: 'Rusia', region: 'Europa/Asia' },
  { code: 'SVK', name: 'Eslovaquia', region: 'Europa' },
  { code: 'SVN', name: 'Eslovenia', region: 'Europa' },
  { code: 'ESP', name: 'España', region: 'Europa' },
  { code: 'SWE', name: 'Suecia', region: 'Europa' },
  { code: 'CHE', name: 'Suiza', region: 'Europa' },
  { code: 'UKR', name: 'Ucrania', region: 'Europa' },
  { code: 'GBR', name: 'Reino Unido', region: 'Europa' },
  
  // Asia
  { code: 'CHN', name: 'China', region: 'Asia' },
  { code: 'JPN', name: 'Japón', region: 'Asia' },
  { code: 'KOR', name: 'Corea del Sur', region: 'Asia' },
  { code: 'PRK', name: 'Corea del Norte', region: 'Asia' },
  { code: 'IND', name: 'India', region: 'Asia' },
  { code: 'IDN', name: 'Indonesia', region: 'Asia' },
  { code: 'IRN', name: 'Irán', region: 'Asia' },
  { code: 'IRQ', name: 'Irak', region: 'Asia' },
  { code: 'ISR', name: 'Israel', region: 'Asia' },
  { code: 'SAU', name: 'Arabia Saudita', region: 'Asia' },
  { code: 'TUR', name: 'Turquía', region: 'Asia/Europa' },
  { code: 'ARE', name: 'Emiratos Árabes Unidos', region: 'Asia' },
  { code: 'VNM', name: 'Vietnam', region: 'Asia' },
  { code: 'THA', name: 'Tailandia', region: 'Asia' },
  { code: 'MYS', name: 'Malasia', region: 'Asia' },
  { code: 'SGP', name: 'Singapur', region: 'Asia' },
  { code: 'PHL', name: 'Filipinas', region: 'Asia' },
  { code: 'PAK', name: 'Pakistán', region: 'Asia' },
  
  // África
  { code: 'DZA', name: 'Argelia', region: 'África' },
  { code: 'EGY', name: 'Egipto', region: 'África' },
  { code: 'ZAF', name: 'Sudáfrica', region: 'África' },
  { code: 'NGA', name: 'Nigeria', region: 'África' },
  { code: 'KEN', name: 'Kenia', region: 'África' },
  { code: 'MAR', name: 'Marruecos', region: 'África' },
  { code: 'TUN', name: 'Túnez', region: 'África' },
  { code: 'LBY', name: 'Libia', region: 'África' },
  
  // Oceanía
  { code: 'AUS', name: 'Australia', region: 'Oceanía' },
  { code: 'NZL', name: 'Nueva Zelanda', region: 'Oceanía' },
  { code: 'FJI', name: 'Fiyi', region: 'Oceanía' },
];

/**
 * 🔍 Buscar países por nombre o código
 * @param {string} query - Término de búsqueda
 * @param {number} limit - Máximo de resultados (default: 10)
 * @returns {Array} Array de países que coinciden
 */
export function searchCountries(query, limit = 10) {
  if (!query || query.length < 2) return [];
  
  const searchLower = query.toLowerCase();
  
  return WORLD_COUNTRIES
    .filter(country => 
      country.name.toLowerCase().includes(searchLower) ||
      country.code.toLowerCase().includes(searchLower)
    )
    .slice(0, limit);
}

