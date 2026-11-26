export const NODOS_INFO = {
  web_server: {
    nombre: 'Servidor Web',
    puerto: ':80 / :443',
    zona: 'Zona Pública (DMZ)',
  },
  api_gateway: {
    nombre: 'Servidor de Aplicaciones (API)',
    puerto: ':443',
    zona: 'Capa de Servicios',
  },
  auth_service: {
    nombre: 'Servicio de Autenticación',
    puerto: ':22 / :443',
    zona: 'Control de Acceso',
  },
  db_server: {
    nombre: 'Servidor de Base de Datos',
    puerto: ':5432',
    zona: 'Red Interna Crítica',
  },
};

export function obtenerNombreNodo(idNodo) {
  return NODOS_INFO[idNodo]?.nombre || idNodo;
}

const CLASES_NN = {
  Normal: 'Tráfico Normal',
  DDoS: 'Ataque DDoS',
  'Brute Force': 'Fuerza Bruta',
  'Data Exfiltration': 'Exfiltración de Datos',
};

export function traducirClaseNN(clase) {
  return CLASES_NN[clase] || clase;
}

const ACCIONES_AGENTE = {
  ALLOW: 'PERMITIR ACCESO',
  RATE_LIMIT: 'LIMITAR VELOCIDAD',
  BLOCK_IP: 'BLOQUEAR IP',
  BLOCK_AND_ISOLATE: 'BLOQUEAR Y AISLAR',
  DROP_BLACKLISTED: 'DESCARTAR (LISTA NEGRA)',
};

export function traducirAccionAgente(accion) {
  return ACCIONES_AGENTE[accion] || accion;
}