// Base de Dados dos 163 Bairros oficiais de Salvador
// Divididos pelas 10 Prefeituras-Bairro (conforme GeoSalvador / SEFAZ Salvador)

export interface PrefeituraBairro {
  id: number;
  nome: string;
  cor: string;
  lat: number;
  lng: number;
  bairrosCount?: number;
}

export interface BairroSalvador {
  num: number;
  nome: string;
  pbId: number;
  pbNome: string;
  lat: number;
  lng: number;
}

export const SALVADOR_PREFEITURAS: PrefeituraBairro[] = [
  { id: 1, nome: "Divisão Centro/Brotas", cor: "#6366f1", lat: -12.973, lng: -38.502 },
  { id: 2, nome: "Divisão Subúrbio/Ilhas", cor: "#10b981", lat: -12.835, lng: -38.485 },
  { id: 3, nome: "Divisão Cajazeiras", cor: "#3b82f6", lat: -12.905, lng: -38.395 },
  { id: 4, nome: "Divisão Itapuã/Ipitanga", cor: "#14b8a6", lat: -12.935, lng: -38.355 },
  { id: 5, nome: "Divisão Cidade Baixa", cor: "#eab308", lat: -12.925, lng: -38.502 },
  { id: 6, nome: "Divisão Barra/Pituba", cor: "#f97316", lat: -12.999, lng: -38.485 },
  { id: 7, nome: "Divisão Liberdade/São Caetano", cor: "#a855f7", lat: -12.955, lng: -38.488 },
  { id: 8, nome: "Divisão Cabula/Beiru Tancredo Neves", cor: "#ec4899", lat: -12.955, lng: -38.448 },
  { id: 9, nome: "Divisão Pau da Lima", cor: "#ef4444", lat: -12.925, lng: -38.420 },
  { id: 10, nome: "Divisão Valéria", cor: "#6b7280", lat: -12.875, lng: -38.435 }
];

// Dicionário com todos os 163 bairros oficiais de Salvador com coordenadas
export const SALVADOR_BAIRROS: Record<string, BairroSalvador> = {
  // Prefeitura Bairro I - Centro/Brotas (1 a 21)
  "COMERCIO": { num: 1, nome: "Comércio", pbId: 1, pbNome: "Centro/Brotas", lat: -12.971, lng: -38.513 },
  "SANTO ANTONIO": { num: 2, nome: "Santo Antônio", pbId: 1, pbNome: "Centro/Brotas", lat: -12.965, lng: -38.503 },
  "BARBALHO": { num: 3, nome: "Barbalho", pbId: 1, pbNome: "Centro/Brotas", lat: -12.962, lng: -38.498 },
  "MACAUBAS": { num: 4, nome: "Macaúbas", pbId: 1, pbNome: "Centro/Brotas", lat: -12.965, lng: -38.493 },
  "SAUDE": { num: 5, nome: "Saúde", pbId: 1, pbNome: "Centro/Brotas", lat: -12.968, lng: -38.503 },
  "CENTRO HISTORICO": { num: 6, nome: "Centro Histórico", pbId: 1, pbNome: "Centro/Brotas", lat: -12.972, lng: -38.508 },
  "PELOURINHO": { num: 6, nome: "Pelourinho", pbId: 1, pbNome: "Centro/Brotas", lat: -12.972, lng: -38.508 },
  "NAZARE": { num: 7, nome: "Nazaré", pbId: 1, pbNome: "Centro/Brotas", lat: -12.975, lng: -38.504 },
  "CENTRO": { num: 8, nome: "Centro", pbId: 1, pbNome: "Centro/Brotas", lat: -12.978, lng: -38.512 },
  "BARRIS": { num: 9, nome: "Barris", pbId: 1, pbNome: "Centro/Brotas", lat: -12.981, lng: -38.513 },
  "GARCIA": { num: 10, nome: "Garcia", pbId: 1, pbNome: "Centro/Brotas", lat: -12.986, lng: -38.511 },
  "TORORO": { num: 11, nome: "Tororó", pbId: 1, pbNome: "Centro/Brotas", lat: -12.980, lng: -38.504 },
  "BOA VISTA DE BROTAS": { num: 12, nome: "Boa Vista de Brotas", pbId: 1, pbNome: "Centro/Brotas", lat: -12.983, lng: -38.498 },
  "ENGENHO VELHO DE BROTAS": { num: 13, nome: "Engenho Velho de Brotas", pbId: 1, pbNome: "Centro/Brotas", lat: -12.984, lng: -38.490 },
  "ACUPE": { num: 14, nome: "Acupe", pbId: 1, pbNome: "Centro/Brotas", lat: -12.987, lng: -38.484 },
  "BROTAS": { num: 15, nome: "Brotas", pbId: 1, pbNome: "Centro/Brotas", lat: -12.980, lng: -38.485 },
  "CANDEAL": { num: 16, nome: "Candeal", pbId: 1, pbNome: "Centro/Brotas", lat: -12.988, lng: -38.472 },
  "COSME DE FARIAS": { num: 17, nome: "Cosme de Farias", pbId: 1, pbNome: "Centro/Brotas", lat: -12.973, lng: -38.487 },
  "MATATU": { num: 18, nome: "Matatu", pbId: 1, pbNome: "Centro/Brotas", lat: -12.969, lng: -38.490 },
  "SANTO AGOSTINHO": { num: 19, nome: "Santo Agostinho", pbId: 1, pbNome: "Centro/Brotas", lat: -12.964, lng: -38.486 },
  "VILA LAURA": { num: 20, nome: "Vila Laura", pbId: 1, pbNome: "Centro/Brotas", lat: -12.965, lng: -38.478 },
  "LUIZ ANSELMO": { num: 21, nome: "Luiz Anselmo", pbId: 1, pbNome: "Centro/Brotas", lat: -12.973, lng: -38.479 },

  // Prefeitura Bairro II - Subúrbio/Ilhas (22 a 36)
  "SAO TOME": { num: 22, nome: "São Tomé de Paripe", pbId: 2, pbNome: "Subúrbio/Ilhas", lat: -12.809, lng: -38.479 },
  "PARIPE": { num: 23, nome: "Paripe", pbId: 2, pbNome: "Subúrbio/Ilhas", lat: -12.815, lng: -38.471 },
  "FAZENDA COUTOS": { num: 24, nome: "Fazenda Coutos", pbId: 2, pbNome: "Subúrbio/Ilhas", lat: -12.825, lng: -38.468 },
  "COUTOS": { num: 25, nome: "Coutos", pbId: 2, pbNome: "Subúrbio/Ilhas", lat: -12.836, lng: -38.475 },
  "NOVA CONSTITUINTE": { num: 26, nome: "Nova Constituinte", pbId: 2, pbNome: "Subúrbio/Ilhas", lat: -12.833, lng: -38.455 },
  "PERI PERI": { num: 27, nome: "Periperi", pbId: 2, pbNome: "Subúrbio/Ilhas", lat: -12.846, lng: -38.470 },
  "PERIPERI": { num: 27, nome: "Periperi", pbId: 2, pbNome: "Subúrbio/Ilhas", lat: -12.846, lng: -38.470 },
  "PRAIA GRANDE": { num: 28, nome: "Praia Grande", pbId: 2, pbNome: "Subúrbio/Ilhas", lat: -12.855, lng: -38.479 },
  "ALTO DA TEREZINHA": { num: 29, nome: "Alto da Terezinha", pbId: 2, pbNome: "Subúrbio/Ilhas", lat: -12.856, lng: -38.466 },
  "RIO SENA": { num: 30, nome: "Rio Sena", pbId: 2, pbNome: "Subúrbio/Ilhas", lat: -12.859, lng: -38.460 },
  "ITACARANHA": { num: 31, nome: "Itacaranha", pbId: 2, pbNome: "Subúrbio/Ilhas", lat: -12.868, lng: -38.475 },
  "PLATAFORMA": { num: 32, nome: "Plataforma", pbId: 2, pbNome: "Subúrbio/Ilhas", lat: -12.878, lng: -38.478 },
  "SAO JOAO DO CABRITO": { num: 33, nome: "São João do Cabrito", pbId: 2, pbNome: "Subúrbio/Ilhas", lat: -12.888, lng: -38.480 },
  "ILHA DOS FRADES": { num: 34, nome: "Ilha dos Frades", pbId: 2, pbNome: "Subúrbio/Ilhas", lat: -12.802, lng: -38.605 },
  "ILHA DE BOM JESUS DOS PASSOS": { num: 35, nome: "Ilha de Bom Jesus dos Passos", pbId: 2, pbNome: "Subúrbio/Ilhas", lat: -12.766, lng: -38.607 },
  "ILHA DE MARE": { num: 36, nome: "Ilha de Maré", pbId: 2, pbNome: "Subúrbio/Ilhas", lat: -12.788, lng: -38.525 },

  // Prefeitura Bairro III - Cajazeiras (37 a 53)
  "CAJAZEIRAS": { num: 37, nome: "Cajazeiras", pbId: 3, pbNome: "Cajazeiras", lat: -12.910, lng: -38.398 },
  "CAJAZEIRAS XI": { num: 37, nome: "Cajazeiras XI", pbId: 3, pbNome: "Cajazeiras", lat: -12.903, lng: -38.388 },
  "CAJAZEIRAS II": { num: 38, nome: "Cajazeiras II", pbId: 3, pbNome: "Cajazeiras", lat: -12.909, lng: -38.406 },
  "CAJAZEIRAS VII": { num: 39, nome: "Cajazeiras VII", pbId: 3, pbNome: "Cajazeiras", lat: -12.905, lng: -38.401 },
  "AGUAS CLARAS": { num: 40, nome: "Águas Claras", pbId: 3, pbNome: "Cajazeiras", lat: -12.898, lng: -38.411 },
  "DOM AVELAR": { num: 41, nome: "Dom Avelar", pbId: 3, pbNome: "Cajazeiras", lat: -12.915, lng: -38.418 },
  "CAJAZEIRAS VI": { num: 42, nome: "Cajazeiras VI", pbId: 3, pbNome: "Cajazeiras", lat: -12.911, lng: -38.408 },
  "CAJAZEIRAS IV": { num: 43, nome: "Cajazeiras IV", pbId: 3, pbNome: "Cajazeiras", lat: -12.914, lng: -38.403 },
  "CAJAZEIRAS V": { num: 44, nome: "Cajazeiras V", pbId: 3, pbNome: "Cajazeiras", lat: -12.910, lng: -38.398 },
  "CAJAZEIRAS X": { num: 45, nome: "Cajazeiras X", pbId: 3, pbNome: "Cajazeiras", lat: -12.912, lng: -38.389 },
  "FAZENDA GRANDE I": { num: 46, nome: "Fazenda Grande I", pbId: 3, pbNome: "Cajazeiras", lat: -12.914, lng: -38.383 },
  "FAZENDA GRANDE II": { num: 47, nome: "Fazenda Grande II", pbId: 3, pbNome: "Cajazeiras", lat: -12.918, lng: -38.378 },
  "FAZENDA GRANDE III": { num: 48, nome: "Fazenda Grande III", pbId: 3, pbNome: "Cajazeiras", lat: -12.923, lng: -38.375 },
  "BOCA DA MATA": { num: 49, nome: "Boca da Mata", pbId: 3, pbNome: "Cajazeiras", lat: -12.926, lng: -38.368 },
  "CASTELO BRANCO": { num: 50, nome: "Castelo Branco", pbId: 3, pbNome: "Cajazeiras", lat: -12.921, lng: -38.401 },
  "CAJAZEIRAS VIII": { num: 51, nome: "Cajazeiras VIII", pbId: 3, pbNome: "Cajazeiras", lat: -12.918, lng: -38.394 },
  "JAGUARIPE I": { num: 52, nome: "Jaguaripe I", pbId: 3, pbNome: "Cajazeiras", lat: -12.925, lng: -38.385 },
  "FAZENDA GRANDE IV": { num: 53, nome: "Fazenda Grande IV", pbId: 3, pbNome: "Cajazeiras", lat: -12.931, lng: -38.377 },

  // Prefeitura Bairro IV - Itapuã/Ipitanga (54 a 70)
  "NOVA ESPERANCA": { num: 54, nome: "Nova Esperança", pbId: 4, pbNome: "Itapuã/Ipitanga", lat: -12.875, lng: -38.345 },
  "AREIA BRANCA": { num: 55, nome: "Areia Branca", pbId: 4, pbNome: "Itapuã/Ipitanga", lat: -12.890, lng: -38.330 },
  "CASSANGE": { num: 56, nome: "Cassange", pbId: 4, pbNome: "Itapuã/Ipitanga", lat: -12.905, lng: -38.345 },
  "ITINGA": { num: 57, nome: "Itinga", pbId: 4, pbNome: "Itapuã/Ipitanga", lat: -12.918, lng: -38.332 },
  "JARDIM DAS MARGARIDAS": { num: 58, nome: "Jardim das Margaridas", pbId: 4, pbNome: "Itapuã/Ipitanga", lat: -12.932, lng: -38.335 },
  "AEROPORTO": { num: 59, nome: "Aeroporto", pbId: 4, pbNome: "Itapuã/Ipitanga", lat: -12.915, lng: -38.310 },
  "SAO CRISTOVAO": { num: 60, nome: "São Cristóvão", pbId: 4, pbNome: "Itapuã/Ipitanga", lat: -12.930, lng: -38.322 },
  "MUSSURUNGA": { num: 61, nome: "Mussurunga", pbId: 4, pbNome: "Itapuã/Ipitanga", lat: -12.935, lng: -38.368 },
  "BAIRRO DA PAZ": { num: 62, nome: "Bairro da Paz", pbId: 4, pbNome: "Itapuã/Ipitanga", lat: -12.943, lng: -38.365 },
  "ALTO DO COQUEIRINHO": { num: 63, nome: "Alto do Coqueirinho", pbId: 4, pbNome: "Itapuã/Ipitanga", lat: -12.946, lng: -38.354 },
  "PIATA": { num: 64, nome: "Piatã", pbId: 4, pbNome: "Itapuã/Ipitanga", lat: -12.948, lng: -38.375 },
  "ITAPUA": { num: 65, nome: "Itapuã", pbId: 4, pbNome: "Itapuã/Ipitanga", lat: -12.951, lng: -38.355 },
  "STELLA MARIS": { num: 66, nome: "Stella Maris", pbId: 4, pbNome: "Itapuã/Ipitanga", lat: -12.948, lng: -38.330 },
  "PATAMARES": { num: 67, nome: "Patamares", pbId: 4, pbNome: "Itapuã/Ipitanga", lat: -12.953, lng: -38.395 },
  "PITUACU": { num: 68, nome: "Pituaçu", pbId: 4, pbNome: "Itapuã/Ipitanga", lat: -12.960, lng: -38.410 },
  "IMBUI": { num: 69, nome: "Imbuí", pbId: 4, pbNome: "Itapuã/Ipitanga", lat: -12.975, lng: -38.435 },
  "BOCA DO RIO": { num: 70, nome: "Boca do Rio", pbId: 4, pbNome: "Itapuã/Ipitanga", lat: -12.972, lng: -38.418 },

  // Prefeitura Bairro V - Cidade Baixa (71 a 84)
  "RIBEIRA": { num: 71, nome: "Ribeira", pbId: 5, pbNome: "Cidade Baixa", lat: -12.913, lng: -38.502 },
  "MANGUEIRA": { num: 72, nome: "Mangueira", pbId: 5, pbNome: "Cidade Baixa", lat: -12.923, lng: -38.498 },
  "BONFIM": { num: 73, nome: "Bonfim", pbId: 5, pbNome: "Cidade Baixa", lat: -12.924, lng: -38.507 },
  "MONTE SERRAT": { num: 74, nome: "Monte Serrat", pbId: 5, pbNome: "Cidade Baixa", lat: -12.930, lng: -38.513 },
  "BOA VIAGEM": { num: 75, nome: "Boa Viagem", pbId: 5, pbNome: "Cidade Baixa", lat: -12.934, lng: -38.510 },
  "MASSARANDUBA": { num: 76, nome: "Massaranduba", pbId: 5, pbNome: "Cidade Baixa", lat: -12.932, lng: -38.493 },
  "VILA RUY BARBOSA / JARDIM CRUZEIRO": { num: 77, nome: "Vila Ruy Barbosa / Jardim Cruzeiro", pbId: 5, pbNome: "Cidade Baixa", lat: -12.934, lng: -38.489 },
  "ROMA": { num: 78, nome: "Roma", pbId: 5, pbNome: "Cidade Baixa", lat: -12.938, lng: -38.503 },
  "CAMINHO DE AREIA": { num: 79, nome: "Caminho de Areia", pbId: 5, pbNome: "Cidade Baixa", lat: -12.939, lng: -38.495 },
  "URUGUAI": { num: 80, nome: "Uruguai", pbId: 5, pbNome: "Cidade Baixa", lat: -12.939, lng: -38.487 },
  "MARES": { num: 81, nome: "Mares", pbId: 5, pbNome: "Cidade Baixa", lat: -12.943, lng: -38.494 },
  "SANTA LUZIA": { num: 82, nome: "Santa Luzia", pbId: 5, pbNome: "Cidade Baixa", lat: -12.940, lng: -38.483 },
  "CALCADA": { num: 83, nome: "Calçada", pbId: 5, pbNome: "Cidade Baixa", lat: -12.948, lng: -38.498 },
  "LOBATO": { num: 84, nome: "Lobato", pbId: 5, pbNome: "Cidade Baixa", lat: -12.915, lng: -38.478 },

  // Prefeitura Bairro VI - Barra/Pituba (85 a 105)
  "VITORIA": { num: 85, nome: "Vitória", pbId: 6, pbNome: "Barra/Pituba", lat: -12.995, lng: -38.525 },
  "CANELA": { num: 86, nome: "Canela", pbId: 6, pbNome: "Barra/Pituba", lat: -12.993, lng: -38.518 },
  "GRACA": { num: 87, nome: "Graça", pbId: 6, pbNome: "Barra/Pituba", lat: -12.998, lng: -38.521 },
  "BARRA": { num: 88, nome: "Barra", pbId: 6, pbNome: "Barra/Pituba", lat: -13.003, lng: -38.527 },
  "ONDINA": { num: 89, nome: "Ondina", pbId: 6, pbNome: "Barra/Pituba", lat: -13.007, lng: -38.508 },
  "CALABAR": { num: 90, nome: "Calabar", pbId: 6, pbNome: "Barra/Pituba", lat: -12.999, lng: -38.513 },
  "ALTO DAS POMBAS": { num: 91, nome: "Alto das Pombas", pbId: 6, pbNome: "Barra/Pituba", lat: -12.996, lng: -38.509 },
  "FEDERACAO": { num: 92, nome: "Federação", pbId: 6, pbNome: "Barra/Pituba", lat: -12.992, lng: -38.506 },
  "ENGENHO VELHO DA FEDERACAO": { num: 93, nome: "Engenho Velho da Federação", pbId: 6, pbNome: "Barra/Pituba", lat: -12.990, lng: -38.501 },
  "RIO VERMELHO": { num: 94, nome: "Rio Vermelho", pbId: 6, pbNome: "Barra/Pituba", lat: -13.013, lng: -38.490 },
  "CHAPADA DO RIO VERMELHO": { num: 95, nome: "Chapada do Rio Vermelho", pbId: 6, pbNome: "Barra/Pituba", lat: -12.995, lng: -38.479 },
  "VALE DAS PEDRINHAS": { num: 96, nome: "Vale das Pedrinhas", pbId: 6, pbNome: "Barra/Pituba", lat: -13.002, lng: -38.475 },
  "SANTA CRUZ": { num: 97, nome: "Santa Cruz", pbId: 6, pbNome: "Barra/Pituba", lat: -13.000, lng: -38.470 },
  "NORDESTE DE AMARALINA": { num: 98, nome: "Nordeste de Amaralina", pbId: 6, pbNome: "Barra/Pituba", lat: -13.008, lng: -38.473 },
  "AMARALINA": { num: 99, nome: "Amaralina", pbId: 6, pbNome: "Barra/Pituba", lat: -13.012, lng: -38.477 },
  "PITUBA": { num: 100, nome: "Pituba", pbId: 6, pbNome: "Barra/Pituba", lat: -13.000, lng: -38.455 },
  "ITAIGARA": { num: 101, nome: "Itaigara", pbId: 6, pbNome: "Barra/Pituba", lat: -12.995, lng: -38.452 },
  "CAMINHO DAS ARVORES": { num: 102, nome: "Caminho das Árvores", pbId: 6, pbNome: "Barra/Pituba", lat: -12.986, lng: -38.450 },
  "STIEP": { num: 103, nome: "Stiep", pbId: 6, pbNome: "Barra/Pituba", lat: -12.983, lng: -38.439 },
  "COSTA AZUL": { num: 104, nome: "Costa Azul", pbId: 6, pbNome: "Barra/Pituba", lat: -12.993, lng: -38.441 },
  "JARDIM ARMACAO": { num: 105, nome: "Jardim Armação", pbId: 6, pbNome: "Barra/Pituba", lat: -12.990, lng: -38.431 },

  // Prefeitura Bairro VII - Liberdade/São Caetano (106 a 124)
  "ALTO DO CABRITO": { num: 106, nome: "Alto do Cabrito", pbId: 7, pbNome: "Liberdade/São Caetano", lat: -12.905, lng: -38.468 },
  "MARECHAL RONDON": { num: 107, nome: "Marechal Rondon", pbId: 7, pbNome: "Liberdade/São Caetano", lat: -12.915, lng: -38.458 },
  "CAMPINAS DE PIRAJA": { num: 108, nome: "Campinas de Pirajá", pbId: 7, pbNome: "Liberdade/São Caetano", lat: -12.925, lng: -38.456 },
  "BOA VISTA DE SAO CAETANO": { num: 109, nome: "Boa Vista de São Caetano", pbId: 7, pbNome: "Liberdade/São Caetano", lat: -12.935, lng: -38.464 },
  "CAPELINHA": { num: 110, nome: "Capelinha", pbId: 7, pbNome: "Liberdade/São Caetano", lat: -12.940, lng: -38.471 },
  "SAO CAETANO": { num: 111, nome: "São Caetano", pbId: 7, pbNome: "Liberdade/São Caetano", lat: -12.943, lng: -38.463 },
  "FAZENDA GRANDE DO RETIRO": { num: 112, nome: "Fazenda Grande do Retiro", pbId: 7, pbNome: "Liberdade/São Caetano", lat: -12.946, lng: -38.455 },
  "BOM JUA": { num: 113, nome: "Bom Juá", pbId: 7, pbNome: "Liberdade/São Caetano", lat: -12.949, lng: -38.448 },
  "LIBERDADE": { num: 114, nome: "Liberdade", pbId: 7, pbNome: "Liberdade/São Caetano", lat: -12.951, lng: -38.483 },
  "CURUZU": { num: 115, nome: "Curuzu", pbId: 7, pbNome: "Liberdade/São Caetano", lat: -12.953, lng: -38.478 },
  "SANTA MONICA": { num: 116, nome: "Santa Mônica", pbId: 7, pbNome: "Liberdade/São Caetano", lat: -12.956, lng: -38.472 },
  "LAPINHA": { num: 117, nome: "Lapinha", pbId: 7, pbNome: "Liberdade/São Caetano", lat: -12.956, lng: -38.490 },
  "PERO VAZ": { num: 118, nome: "Pero Vaz", pbId: 7, pbNome: "Liberdade/São Caetano", lat: -12.959, lng: -38.480 },
  "CAIXA D'AGUA": { num: 119, nome: "Caixa D'Água", pbId: 7, pbNome: "Liberdade/São Caetano", lat: -12.961, lng: -38.487 },
  "BAIXA DE QUINTAS": { num: 120, nome: "Baixa de Quintas", pbId: 7, pbNome: "Liberdade/São Caetano", lat: -12.963, lng: -38.493 },
  "IAPI": { num: 121, nome: "IAPI", pbId: 7, pbNome: "Liberdade/São Caetano", lat: -12.966, lng: -38.476 },
  "RETIRO": { num: 122, nome: "Retiro", pbId: 7, pbNome: "Liberdade/São Caetano", lat: -12.959, lng: -38.459 },
  "PAU MIUDO": { num: 123, nome: "Pau Miúdo", pbId: 7, pbNome: "Liberdade/São Caetano", lat: -12.968, lng: -38.480 },
  "CIDADE NOVA": { num: 124, nome: "Cidade Nova", pbId: 7, pbNome: "Liberdade/São Caetano", lat: -12.971, lng: -38.487 },

  // Prefeitura Bairro VIII - Cabula/Tancredo Neves (125 a 146)
  "TANCREDO NEVES": { num: 133, nome: "Tancredo Neves", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.963, lng: -38.438 },
  "BEIRU": { num: 133, nome: "Beiru / Tancredo Neves", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.963, lng: -38.438 },
  "GRANJAS RURAIS PRESIDENTE VARGAS": { num: 125, nome: "Granjas Rurais Presidente Vargas", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.935, lng: -38.435 },
  "CALABETAO": { num: 126, nome: "Calabetão", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.946, lng: -38.436 },
  "JARDIM SANTO INACIO": { num: 127, nome: "Jardim Santo Inácio", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.945, lng: -38.427 },
  "MATA ESCURA": { num: 128, nome: "Mata Escura", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.951, lng: -38.423 },
  "SUSSUARANA": { num: 129, nome: "Sussuarana", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.953, lng: -38.406 },
  "NOVA SUSSUARANA": { num: 130, nome: "Nova Sussuarana", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.959, lng: -38.398 },
  "ARRAIAL DO RETIRO": { num: 131, nome: "Arraial do Retiro", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.956, lng: -38.450 },
  "BARREIRAS": { num: 132, nome: "Barreiras", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.960, lng: -38.447 },
  "BEIRU/TANCREDO NEVES": { num: 133, nome: "Beiru/Tancredo Neves", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.963, lng: -38.438 },
  "ARENOSO": { num: 134, nome: "Arenoso", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.969, lng: -38.433 },
  "NOVO HORIZONTE": { num: 135, nome: "Novo Horizonte", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.966, lng: -38.420 },
  "CAB": { num: 136, nome: "CAB", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.952, lng: -38.375 },
  "SAO GONCALO": { num: 137, nome: "São Gonçalo", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.969, lng: -38.450 },
  "ENGOMADEIRA": { num: 138, nome: "Engomadeira", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.973, lng: -38.448 },
  "CABULA": { num: 139, nome: "Cabula", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.975, lng: -38.440 },
  "RESGATE": { num: 140, nome: "Resgate", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.979, lng: -38.444 },
  "PERNAMBUES": { num: 141, nome: "Pernambués", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.976, lng: -38.455 },
  "SARAMANDAIA": { num: 142, nome: "Saramandaia", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.978, lng: -38.468 },
  "CABULA VI": { num: 143, nome: "Cabula VI", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.960, lng: -38.411 },
  "DORON": { num: 144, nome: "Doron", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.966, lng: -38.406 },
  "SABOEIRO": { num: 145, nome: "Saboeiro", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.972, lng: -38.409 },
  "NARANDIBA": { num: 146, nome: "Narandiba", pbId: 8, pbNome: "Cabula/Tancredo Neves", lat: -12.969, lng: -38.423 },

  // Prefeitura Bairro IX - Pau da Lima (147 a 159)
  "PORTO SECO PIRAJA": { num: 147, nome: "Porto Seco Pirajá", pbId: 9, pbNome: "Pau da Lima", lat: -12.915, lng: -38.418 },
  "JARDIM CAJAZEIRAS": { num: 148, nome: "Jardim Cajazeiras", pbId: 9, pbNome: "Pau da Lima", lat: -12.923, lng: -38.413 },
  "VILA CANARIA": { num: 149, nome: "Vila Canária", pbId: 9, pbNome: "Pau da Lima", lat: -12.918, lng: -38.408 },
  "PAU DA LIMA": { num: 150, nome: "Pau da Lima", pbId: 9, pbNome: "Pau da Lima", lat: -12.926, lng: -38.401 },
  "SETE DE ABRIL": { num: 151, nome: "Sete de Abril", pbId: 9, pbNome: "Pau da Lima", lat: -12.924, lng: -38.393 },
  "SAO MARCOS": { num: 152, nome: "São Marcos", pbId: 9, pbNome: "Pau da Lima", lat: -12.936, lng: -38.408 },
  "JARDIM NOVA ESPERANCA": { num: 153, nome: "Jardim Nova Esperança", pbId: 9, pbNome: "Pau da Lima", lat: -12.928, lng: -38.383 },
  "NOVO MAROTINHO": { num: 154, nome: "Novo Marotinho", pbId: 9, pbNome: "Pau da Lima", lat: -12.933, lng: -38.388 },
  "CANABRAVA": { num: 155, nome: "Canabrava", pbId: 9, pbNome: "Pau da Lima", lat: -12.942, lng: -38.398 },
  "SAO RAFAEL": { num: 156, nome: "São Rafael", pbId: 9, pbNome: "Pau da Lima", lat: -12.948, lng: -38.394 },
  "VALE DOS LAGOS": { num: 157, nome: "Vale dos Lagos", pbId: 9, pbNome: "Pau da Lima", lat: -12.951, lng: -38.385 },
  "NOVA BRASILIA": { num: 158, nome: "Nova Brasília", pbId: 9, pbNome: "Pau da Lima", lat: -12.939, lng: -38.375 },
  "TROBOGY": { num: 159, nome: "Trobogy", pbId: 9, pbNome: "Pau da Lima", lat: -12.948, lng: -38.368 },

  // Prefeitura Bairro X - Valéria (160 a 163)
  "PIRAJA": { num: 160, nome: "Pirajá", pbId: 10, pbNome: "Valéria", lat: -12.905, lng: -38.441 },
  "VALERIA": { num: 161, nome: "Valéria", pbId: 10, pbNome: "Valéria", lat: -12.875, lng: -38.448 },
  "PALESTINA": { num: 162, nome: "Palestina", pbId: 10, pbNome: "Valéria", lat: -12.868, lng: -38.411 },
  "MORADAS DA LAGOA": { num: 163, nome: "Moradas da Lagoa", pbId: 10, pbNome: "Valéria", lat: -12.872, lng: -38.395 }
};

// Remove acentos e converte string para uppercase normalizado
export function normalizeString(str: string): string {
  return (str || '')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

// Encontra um bairro na base fazendo normalizacao e busca inteligente
export function findBairro(bairroInput: string): BairroSalvador | null {
  if (!bairroInput) return null;
  
  const cleanInput = normalizeString(bairroInput).replace(/[\s\/\-]+/g, "");
  if (!cleanInput) return null;
  
  // 1. Match exato
  for (const key of Object.keys(SALVADOR_BAIRROS)) {
    const cleanKey = key.replace(/[\s\/\-]+/g, "");
    if (cleanKey === cleanInput) {
      return SALVADOR_BAIRROS[key];
    }
  }
  
  // 2. Match por inclusão
  for (const key of Object.keys(SALVADOR_BAIRROS)) {
    const cleanKey = key.replace(/[\s\/\-]+/g, "");
    if (cleanKey.length >= 4 && (cleanInput.includes(cleanKey) || cleanKey.includes(cleanInput))) {
      return SALVADOR_BAIRROS[key];
    }
  }
  
  return null;
}

// Infere o bairro a partir do nome da congregação, setor ou texto livre
export function inferBairroFromText(text: string): BairroSalvador | null {
  if (!text) return null;
  const normalized = normalizeString(text);
  
  // Procura se o texto contém algum dos nomes de bairros
  for (const [key, bairro] of Object.entries(SALVADOR_BAIRROS)) {
    if (key.length >= 4 && normalized.includes(key)) {
      return bairro;
    }
  }
  return null;
}
