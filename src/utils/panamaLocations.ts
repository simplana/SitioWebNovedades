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
      // Distrito de Panamá
      'Ancón', 'Bella Vista', 'Betania', 'Calidonia', 'Chilibre', 'Curundú', 'El Chorrillo',
      'Juan Díaz', 'Las Cumbres', 'Las Mañanitas', 'Pacora', 'Parque Lefevre', 'Pedregal',
      'Pueblo Nuevo', 'Río Abajo', 'San Felipe', 'San Francisco', 'San Martín', 'Santa Ana',
      'Tocumen', '24 de Diciembre',
      // Distrito de Balboa
      'Balboa', 'La Ensenada', 'Pedro González',
      // Distrito de Chepo
      'Cañita', 'Chepo', 'Chepillo', 'El Llano', 'Las Margaritas', 'Tortí',
      // Distrito de Chimán
      'Chimán', 'Gonzalo Vásquez', 'Pasiga', 'Unión Santeña',
      // Distrito de San Miguelito
      'Amelia Denis de Icaza', 'Arnulfo Arias', 'Belisario Frías', 'Belisario Porras',
      'José Domingo Espinar', 'Mateo Iturralde', 'Rufina Alfaro', 'Victoriano Lorenzo',
      // Distrito de Taboga
      'Taboga'
    ]
  },
  {
    name: 'Panamá Oeste',
    corregimientos: [
      // Distrito de Arraiján
      'Arraiján', 'Burunga', 'Cerro Silvestre', 'Juan Demóstenes Arosemena', 'Nuevo Emperador', 'Santa Clara', 'Veracruz', 'Vista Alegre',
      // Distrito de Capira
      'Capira', 'Cermeno', 'Cirí de Los Sotos', 'Cirí Grande', 'El Cacao', 'La Trinidad', 'Las Ollas Arriba', 'Lídice', 'Villa Carmen', 'Villa Rosario',
      // Distrito de Chame
      'Bejuco', 'Buenos Aires', 'Cabuya', 'Chame', 'Chicá', 'El Líbano', 'Las Lajas', 'Nueva Gorgona', 'Punta Chame', 'Sajalices', 'Sorá',
      // Distrito de La Chorrera
      'Arosemena', 'Barrio Balboa', 'Barrio Colón', 'El Arado', 'El Coco', 'Feuillet', 'Guadalupe', 'Herrera', 'Hurtado', 'Iturralde', 'La Chorrera', 'La Represa', 'Los Díaz', 'Mendoza', 'Playa Leona', 'Puerto Caimito', 'Santa Rita',
      // Distrito de San Carlos
      'El Espino', 'El Higo', 'Guayabito', 'La Ermita', 'La Laguna', 'Las Uvas', 'Los Llanitos', 'San Carlos', 'San José'
    ]
  },
  {
    name: 'Colón',
    corregimientos: [
      // Distrito de Colón
      'Barrio Norte', 'Barrio Sur', 'Buena Vista', 'Cativá', 'Cristóbal', 'Escobal', 'Nueva Providencia', 'Puerto Pilón', 'Salamanca', 'San Juan', 'Santa Rosa',
      // Distrito de Chagres
      'El Guabo', 'Palmas Bellas', 'Piña', 'Salud',
      // Distrito de Donoso
      'Coclé del Norte', 'Donoso', 'El Guásimo', 'Gobea', 'Miguel de la Borda', 'Río Indio',
      // Distrito de Portobelo
      'Cacique', 'Garrote', 'María Chiquita', 'Nombre de Dios', 'Portobelo',
      // Distrito de Santa Isabel
      'Miramar', 'Palenque', 'Santa Isabel'
    ]
  },
  {
    name: 'Chiriquí',
    corregimientos: [
      // Distrito de Alanje
      'Alanje', 'Cañas Gordas', 'Divala', 'Guarumal', 'Palo Grande', 'Progreso', 'Río Sereno', 'Santo Tomás',
      // Distrito de Barú
      'Baco', 'Barriles', 'Bijagual', 'Limones', 'Progreso', 'Puerto Armuelles', 'Rodolfo Aguilar Delgado',
      // Distrito de Boquerón
      'Boquerón', 'Cordillera', 'Guabal', 'Guayabal', 'Paraíso', 'Pedregal', 'Tijeras',
      // Distrito de Boquete
      'Alto Boquete', 'Bajo Boquete', 'Caldera', 'Jaramillo', 'Los Naranjos', 'Palmira',
      // Distrito de Bugaba
      'Aserrío de Gariché', 'Bugaba', 'Cerro Punta', 'Gómez', 'La Concepción', 'San Andrés', 'Santa Marta', 'Santa Rosa', 'Sortová', 'Volcán',
      // Distrito de David
      'David', 'Chiriquí', 'Las Lomas', 'Pedregal', 'San Carlos', 'San Pablo Nuevo', 'San Pablo Viejo',
      // Distrito de Dolega
      'Dolega', 'Dos Ríos', 'Los Algarrobos', 'Los Anastacios', 'Potrerillos', 'Potrerillos Abajo', 'Tinajas',
      // Distrito de Gualaca
      'Gualaca', 'Hornito', 'Los Ángeles', 'Paja de Sombrero', 'Rincón',
      // Distrito de Remedios
      'El Bale', 'El Porvenir', 'El Prado', 'Remedios', 'Santa Lucía',
      // Distrito de Renacimiento
      'Breñón', 'Cañas Gordas', 'Hornito', 'Monte Lirio', 'Plaza de Caisán', 'Río Sereno', 'Santa Clara',
      // Distrito de San Félix
      'Las Lajas', 'San Félix', 'San Isidro', 'Santa Cruz',
      // Distrito de San Lorenzo
      'Boca Chica', 'Boca del Monte', 'Horconcitos', 'San Juan', 'San Lorenzo',
      // Distrito de Tolé
      'Bella Vista', 'Cerro Viejo', 'Juay', 'Lajas Adentro', 'Llano Grande', 'Potrero de Caña', 'Quebrada de Piedra', 'Tolé', 'Veladero'
    ]
  },
  {
    name: 'Coclé',
    corregimientos: [
      // Distrito de Aguadulce
      'Aguadulce', 'Barrios Unidos', 'El Cristo', 'El Roble', 'Pocrí',
      // Distrito de Antón
      'Antón', 'Caballero', 'El Chirú', 'El Retiro', 'El Valle', 'Juan Díaz', 'Río Hato', 'San Juan de Dios',
      // Distrito de La Pintada
      'El Harino', 'El Potrero', 'La Pintada', 'Las Lomas', 'Llano Grande', 'Pedregoso',
      // Distrito de Natá
      'Capellanía', 'El Caño', 'Guzmán', 'Las Huacas', 'Natá', 'Toza',
      // Distrito de Olá
      'El Copé', 'El Palmar', 'La Pava', 'Olá', 'San Mateo',
      // Distrito de Penonomé
      'Coclé', 'Chiguirí Arriba', 'El Coco', 'Pajonal', 'Penonomé', 'Río Grande', 'Río Indio', 'Toabré', 'Tulú'
    ]
  },
  {
    name: 'Herrera',
    corregimientos: [
      // Distrito de Chitré
      'Chitré', 'La Arena', 'Llano Bonito', 'Monagrillo', 'San Juan Bautista',
      // Distrito de Las Minas
      'Chepo', 'Chumical', 'El Toro', 'Las Minas', 'Leones', 'Quebrada del Rosario', 'Quebrada El Ciprián',
      // Distrito de Los Pozos
      'Capurí', 'El Calabacito', 'El Cedro', 'El Ciruelo', 'La Arena', 'La Pitaloza', 'Las Llanas', 'Los Cerritos', 'Los Pozos', 'Sabanagrande',
      // Distrito de Ocú
      'Cerro Largo', 'El Tijera', 'Llano Grande', 'Los Llanos', 'Ocú', 'Peñas Chatas', 'Río Grande', 'Llano de La Cruz',
      // Distrito de Parita
      'Cabuya', 'Los Castillos', 'Llano de Piedra', 'Parita', 'París', 'Portobelillo', 'Potuga',
      // Distrito de Pesé
      'El Barrero', 'El Pedregoso', 'El Porvenir', 'Las Cabras', 'Pesé', 'Rincón Hondo', 'Sabana Grande', 'Santa Rita',
      // Distrito de Santa María
      'Chupampa', 'El Rincón', 'El Toro', 'Los Canelos', 'Rompió', 'Santa María'
    ]
  },
  {
    name: 'Los Santos',
    corregimientos: [
      // Distrito de Guararé
      'El Espinal', 'El Hato', 'El Macano', 'El Sitio', 'Guararé', 'La Enea', 'La Pasera', 'Las Trancas', 'Llano Abajo', 'Puerto Escondido',
      // Distrito de Las Tablas
      'Bajo Corral', 'El Caño', 'El Cocal', 'El Manantial', 'El Muñoz', 'El Pedregoso', 'El Cedro', 'La Colorada', 'La Laja', 'La Miel', 'La Palma', 'Las Palmitas', 'Las Tablas', 'Nuario', 'Palmira', 'Peña Blanca', 'Pocrí', 'Santa Ana', 'Sesteadero', 'Valle Rico', 'Vallerriquito',
      // Distrito de Los Santos
      'Agua Buena', 'Guánico Abajo', 'La Espigadilla', 'La Villa de Los Santos', 'Las Cruces', 'Los Ángeles', 'Los Olivos', 'Santa Librada y Rufina', 'Villa Lourdes',
      // Distrito de Macaracas
      'Bahía Honda', 'Bajos de Güera', 'Chupá', 'Corozal', 'El Cañafístulo', 'El Cedro', 'El Cocal', 'Espino Amarillo', 'La Mesa', 'La Tiza', 'Las Palmas', 'Llano de Piedras', 'Macaracas', 'Mogollón', 'Oria Arriba', 'Peña Blanca', 'Río Hondo', 'San José',
      // Distrito de Pedasí
      'Los Asientos', 'Mariabé', 'Oria Arriba', 'Pedasí', 'Purio',
      // Distrito de Pocrí
      'El Cañafístulo', 'El Cortezo', 'El Ejido', 'Las Palmitas', 'Lajamina', 'Paritilla', 'Pocrí', 'Sabana Grande',
      // Distrito de Tonosí
      'Altos de Güera', 'Cambutal', 'Cañas', 'El Bebedero', 'El Cacao', 'Flores', 'Guánico', 'La Tronosa', 'Las Tablas', 'Tonosí'
    ]
  },
  {
    name: 'Veraguas',
    corregimientos: [
      // Distrito de Atalaya
      'Atalaya', 'El Barrito', 'El Cocla', 'El Picador', 'La Carrillo', 'La Montañuela', 'La Garceana', 'San Antonio',
      // Distrito de Calobre
      'Barnizal', 'Calobre', 'Chitra', 'El Cocla', 'La Laguna', 'La Raya de Calobre', 'La Tetilla', 'La Yeguada', 'Las Guías',
      // Distrito de Cañazas
      'Cañazas', 'Cerro de Casa', 'El Aromillo', 'El Picador', 'Las Huacas', 'Las Palmas', 'Los Valles',
      // Distrito de La Mesa
      'El Prado', 'La Mesa', 'Llano Grande', 'Santa Lucía',
      // Distrito de Las Palmas
      'Boró', 'El María', 'El Pájaro', 'El Potrero', 'Las Palmas', 'Llano de Piedra', 'Lola',
      // Distrito de Montijo
      'Arenas', 'Cébaco', 'Costa Hermosa', 'Gobernadora', 'La Garceana', 'Leones', 'Montijo', 'Pilón', 'Piña', 'Puerto Vidal', 'Tebario', 'Uvala',
      // Distrito de Río de Jesús
      'Los Castillos', 'Río de Jesús', 'San José', 'Utirá',
      // Distrito de San Francisco
      'Corral Falso', 'Las Huacas', 'Remance', 'San Francisco', 'San Isidro', 'Santa Fé',
      // Distrito de Santa Fe
      'Calovébora', 'El Alto', 'El Cuay', 'El Pantano', 'Gatuncito', 'Los Hatillos', 'Río Luis', 'Santa Fe',
      // Distrito de Santiago
      'Canto del Llano', 'Carlos Santana Ávila', 'El Algarrobo', 'El Llanito', 'La Colorada', 'La Peña', 'La Raya de Santa María', 'La Trinidad', 'Las Palmas', 'Los Algarrobos', 'Ponuga', 'San Marcelo', 'San Martín de Porres', 'San Pedro del Espino', 'Santiago', 'Urracá',
      // Distrito de Soná
      'Bahía Honda', 'Calidonia', 'El Marañón', 'Guarumal', 'La Soledad', 'Quebrada de Oro', 'Río Grande', 'Soná'
    ]
  },
  {
    name: 'Bocas del Toro',
    corregimientos: [
      // Distrito de Almirante
      'Almirante', 'Nance de Risco', 'Valle de Risco',
      // Distrito de Bocas del Toro
      'Bastimentos', 'Bocas del Toro', 'Cauchero', 'Punta Laurel', 'Tierra Oscura',
      // Distrito de Changuinola
      'Changuinola', 'El Empalme', 'El Silencio', 'Guabito', 'Las Delicias', 'Teribe', 'Valle del Risco',
      // Distrito de Chiriquí Grande
      'Chiriquí Grande', 'Miramar', 'Punta Peña', 'Punta Robalo', 'Rambala'
    ]
  },
  {
    name: 'Darién',
    corregimientos: [
      // Distrito de Chepigana
      'Chepigana', 'Garachiné', 'Jaqué', 'La Palma', 'Puerto Piña', 'Río Congo', 'Río Iglesias', 'Santa Fe', 'Setegantí', 'Taimatí', 'Tuhé', 'Yape',
      // Distrito de Pinogana
      'Agua Fría', 'Boca de Cupe', 'El Real de Santa María', 'Garachine', 'Metetí', 'Pinogana', 'Púcuro', 'Río Balsas', 'Yaviza'
    ]
  },
  {
    name: 'Comarca Guna Yala',
    corregimientos: [
      'Ailigandí', 'Narganá', 'Puerto Obaldía', 'Tubualá'
    ]
  },
  {
    name: 'Comarca Emberá-Wounaan',
    corregimientos: [
      'Cémaco', 'Sambú'
    ]
  },
  {
    name: 'Comarca Ngäbe-Buglé',
    corregimientos: [
      'Besikó', 'Kankintú', 'Kusapín', 'Mironó', 'Müna', 'Nole Duima', 'Ñürüm', 'Santa Catalina o Calovébora', 'Jirondai'
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
