import Select from 'react-select';
import * as FlagIcons from 'country-flag-icons/react/3x2';

/**
 * Lista de países militarmente relevantes con códigos ISO 3166-1 alpha-2
 * Ordenados por relevancia geopolítica en el Caribe y América
 */
const COUNTRIES = [
  // América del Norte
  { code: 'US', name: 'Estados Unidos', region: 'América del Norte' },
  { code: 'CA', name: 'Canadá', region: 'América del Norte' },
  { code: 'MX', name: 'México', region: 'América del Norte' },
  
  // Caribe
  { code: 'CU', name: 'Cuba', region: 'Caribe' },
  { code: 'HT', name: 'Haití', region: 'Caribe' },
  { code: 'DO', name: 'República Dominicana', region: 'Caribe' },
  { code: 'PR', name: 'Puerto Rico', region: 'Caribe' },
  { code: 'JM', name: 'Jamaica', region: 'Caribe' },
  { code: 'BS', name: 'Bahamas', region: 'Caribe' },
  { code: 'TT', name: 'Trinidad y Tobago', region: 'Caribe' },
  { code: 'BB', name: 'Barbados', region: 'Caribe' },
  
  // América Central
  { code: 'GT', name: 'Guatemala', region: 'América Central' },
  { code: 'HN', name: 'Honduras', region: 'América Central' },
  { code: 'SV', name: 'El Salvador', region: 'América Central' },
  { code: 'NI', name: 'Nicaragua', region: 'América Central' },
  { code: 'CR', name: 'Costa Rica', region: 'América Central' },
  { code: 'PA', name: 'Panamá', region: 'América Central' },
  { code: 'BZ', name: 'Belice', region: 'América Central' },
  
  // América del Sur
  { code: 'VE', name: 'Venezuela', region: 'América del Sur' },
  { code: 'CO', name: 'Colombia', region: 'América del Sur' },
  { code: 'BR', name: 'Brasil', region: 'América del Sur' },
  { code: 'AR', name: 'Argentina', region: 'América del Sur' },
  { code: 'CL', name: 'Chile', region: 'América del Sur' },
  { code: 'PE', name: 'Perú', region: 'América del Sur' },
  { code: 'EC', name: 'Ecuador', region: 'América del Sur' },
  { code: 'GY', name: 'Guyana', region: 'América del Sur' },
  
  // Europa (OTAN y aliados)
  { code: 'GB', name: 'Reino Unido', region: 'Europa' },
  { code: 'FR', name: 'Francia', region: 'Europa' },
  { code: 'DE', name: 'Alemania', region: 'Europa' },
  { code: 'ES', name: 'España', region: 'Europa' },
  { code: 'IT', name: 'Italia', region: 'Europa' },
  { code: 'NL', name: 'Países Bajos', region: 'Europa' },
  { code: 'RU', name: 'Rusia', region: 'Europa' },
  
  // Asia y Medio Oriente
  { code: 'CN', name: 'China', region: 'Asia' },
  { code: 'JP', name: 'Japón', region: 'Asia' },
  { code: 'KR', name: 'Corea del Sur', region: 'Asia' },
  { code: 'IN', name: 'India', region: 'Asia' },
  { code: 'IL', name: 'Israel', region: 'Medio Oriente' },
  { code: 'SA', name: 'Arabia Saudita', region: 'Medio Oriente' },
  { code: 'IR', name: 'Irán', region: 'Medio Oriente' },
  
  // Otros
  { code: 'AU', name: 'Australia', region: 'Oceanía' },
];

/**
 * Componente para renderizar la opción con bandera
 */
const CountryOption = ({ data, innerRef, innerProps }) => {
  const FlagIcon = FlagIcons[data.code];
  
  return (
    <div
      ref={innerRef}
      {...innerProps}
      className="flex items-center gap-3 px-3 py-2 hover:bg-slate-700 cursor-pointer transition-colors"
    >
      {FlagIcon ? (
        <FlagIcon 
          className="w-6 h-4 rounded-sm shadow-sm border border-slate-600"
          title={data.name}
        />
      ) : (
        <div className="w-6 h-4 bg-slate-600 rounded-sm" />
      )}
      <div className="flex flex-col">
        <span className="text-sm text-white font-medium">{data.name}</span>
        <span className="text-xs text-slate-400">{data.region}</span>
      </div>
    </div>
  );
};

/**
 * Componente para renderizar el valor seleccionado con bandera
 */
const CountryValue = ({ data }) => {
  const FlagIcon = FlagIcons[data.code];
  
  return (
    <div className="flex items-center gap-2">
      {FlagIcon ? (
        <FlagIcon 
          className="w-5 h-3.5 rounded-sm shadow-sm border border-slate-600"
          title={data.name}
        />
      ) : (
        <div className="w-5 h-3.5 bg-slate-600 rounded-sm" />
      )}
      <span className="text-white text-sm">{data.name}</span>
    </div>
  );
};

/**
 * Selector de países con banderas para formularios
 * @param {string} value - Código ISO 3166-1 alpha-2 del país seleccionado
 * @param {function} onChange - Callback cuando cambia la selección (recibe código ISO)
 * @param {string} placeholder - Texto placeholder
 */
export default function CountrySelector({ value, onChange, placeholder = 'Seleccionar país...' }) {
  // Encontrar el país seleccionado
  const selectedCountry = COUNTRIES.find(c => c.code === value);
  
  // Convertir a formato react-select
  const options = COUNTRIES.map(country => ({
    value: country.code,
    label: country.name,
    ...country
  }));

  const selectedOption = selectedCountry ? {
    value: selectedCountry.code,
    label: selectedCountry.name,
    ...selectedCountry
  } : null;

  const handleChange = (option) => {
    onChange(option ? option.value : null);
  };

  return (
    <Select
      value={selectedOption}
      onChange={handleChange}
      options={options}
      placeholder={placeholder}
      isClearable
      isSearchable
      components={{
        Option: CountryOption,
        SingleValue: CountryValue,
      }}
      styles={{
        control: (base, state) => ({
          ...base,
          backgroundColor: '#334155', // slate-700
          borderColor: state.isFocused ? '#3b82f6' : '#475569', // blue-500 : slate-600
          borderRadius: '0.5rem',
          padding: '0.125rem',
          boxShadow: 'none',
          '&:hover': {
            borderColor: '#3b82f6'
          }
        }),
        menu: (base) => ({
          ...base,
          backgroundColor: '#1e293b', // slate-800
          borderRadius: '0.5rem',
          border: '1px solid #475569', // slate-600
          marginTop: '4px',
          zIndex: 100
        }),
        menuList: (base) => ({
          ...base,
          padding: '4px',
          maxHeight: '300px',
          '::-webkit-scrollbar': {
            width: '8px'
          },
          '::-webkit-scrollbar-track': {
            background: '#1e293b'
          },
          '::-webkit-scrollbar-thumb': {
            background: '#475569',
            borderRadius: '4px'
          }
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isFocused ? '#334155' : 'transparent',
          color: '#fff',
          cursor: 'pointer',
          padding: 0
        }),
        input: (base) => ({
          ...base,
          color: '#fff'
        }),
        placeholder: (base) => ({
          ...base,
          color: '#94a3b8' // slate-400
        }),
        singleValue: (base) => ({
          ...base,
          color: '#fff'
        }),
        clearIndicator: (base) => ({
          ...base,
          color: '#94a3b8',
          '&:hover': {
            color: '#fff'
          }
        }),
        dropdownIndicator: (base) => ({
          ...base,
          color: '#94a3b8',
          '&:hover': {
            color: '#fff'
          }
        })
      }}
      noOptionsMessage={() => 'No se encontró el país'}
      filterOption={(option, inputValue) => {
        return option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
               option.data.region.toLowerCase().includes(inputValue.toLowerCase());
      }}
    />
  );
}

/**
 * Función helper para obtener el componente de bandera por código ISO
 * @param {string} countryCode - Código ISO 3166-1 alpha-2
 * @returns {React.Component|null} Componente de bandera o null
 */
export function getFlagComponent(countryCode) {
  if (!countryCode) return null;
  return FlagIcons[countryCode.toUpperCase()] || null;
}

/**
 * Función helper para obtener el nombre del país por código ISO
 * @param {string} countryCode - Código ISO 3166-1 alpha-2
 * @returns {string} Nombre del país o código si no se encuentra
 */
export function getCountryName(countryCode) {
  const country = COUNTRIES.find(c => c.code === countryCode);
  return country ? country.name : countryCode;
}

