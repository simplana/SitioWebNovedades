export interface Corregimiento {
  name: string;
}

export interface Province {
  name: string;
  corregimientos: string[];
}

export const PANAMA_PROVINCES: Province[] = [
  {
    name: 'Panamá',
    corregimientos: [
      'Ancón',
      'Bella Vista',
      'Betania',
      'Calidonia',
      'Chilibre',
      'Curundú',
      'El Chorrillo',
      'Juan Díaz',
      'Las Cumbres',
      'Las Mañanitas',
      'Pacora',
      'Parque Lefevre',
      'Pedregal',
      'Pueblo Nuevo',
      'Río Abajo',
      'San Felipe',
      'San Francisco',
      'San Martín',
      'Santa Ana',
      'Tocumen',
      '24 de Diciembre'
    ]
  },
  {
    name: 'Panamá Oeste',
    corregimientos: [
      'Arraijan',
      'Burunga',
      'Cerro Silvestre',
      'Juan Demóstenes Arosemena',
      'La Chorrera',
      'Nueva Gorgona',
      'Playa Leona',
      'Puerto Caimito',
      'Vacamonte'
    ]
  },
  {
    name: 'Colón',
    corregimientos: [
      'Barrio Norte',
      'Barrio Sur',
      'Buena Vista',
      'Cativá',
      'Cristóbal',
      'Escobal',
      'María Chiquita',
      'Nuevo San Juan',
      'Puerto Pilón',
      'Sabanitas',
      'Santa Rosa'
    ]
  },
  {
    name: 'Chiriquí',
    corregimientos: [
      'David',
      'Boquete',
      'Bugaba',
      'Dolega',
      'Gualaca',
      'Remedios',
      'Renacimiento',
      'San Félix',
      'San Lorenzo',
      'Tolé'
    ]
  },
  {
    name: 'Coclé',
    corregimientos: [
      'Aguadulce',
      'Antón',
      'La Pintada',
      'Natá',
      'Olá',
      'Penonomé'
    ]
  },
  {
    name: 'Herrera',
    corregimientos: [
      'Chitré',
      'Las Minas',
      'Los Pozos',
      'Ocú',
      'Parita',
      'Pesé',
      'Santa María'
    ]
  },
  {
    name: 'Los Santos',
    corregimientos: [
      'Guararé',
      'Las Tablas',
      'Los Santos',
      'Macaracas',
      'Pedasí',
      'Pocrí',
      'Tonosí'
    ]
  },
  {
    name: 'Veraguas',
    corregimientos: [
      'Atalaya',
      'Calobre',
      'Cañazas',
      'La Mesa',
      'Las Palmas',
      'Montijo',
      'Río de Jesús',
      'San Francisco',
      'Santa Fe',
      'Santiago',
      'Soná'
    ]
  },
  {
    name: 'Bocas del Toro',
    corregimientos: [
      'Almirante',
      'Bocas del Toro',
      'Changuinola',
      'Chiriquí Grande'
    ]
  },
  {
    name: 'Darién',
    corregimientos: [
      'Chepigana',
      'Pinogana'
    ]
  },
  {
    name: 'Comarca Guna Yala',
    corregimientos: [
      'Ailigandí',
      'Narganá',
      'Puerto Obaldía',
      'Tubualá'
    ]
  },
  {
    name: 'Comarca Emberá-Wounaan',
    corregimientos: [
      'Cémaco',
      'Sambú'
    ]
  },
  {
    name: 'Comarca Ngäbe-Buglé',
    corregimientos: [
      'Besikó',
      'Kankintú',
      'Kusapín',
      'Mironó',
      'Müna',
      'Nole Duima',
      'Ñürüm',
      'Santa Catalina o Calovébora',
      'Jirondai'
    ]
  }
];

export const getCorregimientosByProvince = (provinceName: string): string[] => {
  const province = PANAMA_PROVINCES.find(p => p.name === provinceName);
  return province ? province.corregimientos : [];
};

export const getProvinceNames = (): string[] => {
  return PANAMA_PROVINCES.map(p => p.name);
};
