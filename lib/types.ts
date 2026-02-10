// LoadStatus mantido para compatibilidade com componentes existentes
export enum LoadStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DELAYED = 'DELAYED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  VIEWER = 'VIEWER'
}

// Estados da BD: 1=Nova, 2=A definir, 3=Agendada, 4=Realizada
export type OrderState = 'NOVA' | 'A DEFINIR' | 'AGENDADA' | 'REALIZADA';

// Mapeamento de estadoId para OrderState
export const ESTADO_ID_MAP: Record<number, OrderState> = {
  1: 'NOVA',
  2: 'A DEFINIR',
  3: 'AGENDADA',
  4: 'REALIZADA'
};

export const ORDER_STATE_TO_ID: Record<OrderState, number> = {
  'NOVA': 1,
  'A DEFINIR': 2,
  'AGENDADA': 3,
  'REALIZADA': 4
};

// Markets/Countries da BD: 1=PT, 2=SP, 3=FR, 4=INT
export type Market = 'PT' | 'SP' | 'FR' | 'INT';

export const COUNTRY_ID_MAP: Record<number, Market> = {
  1: 'PT',
  2: 'SP',
  3: 'FR',
  4: 'INT'
};

export const MARKET_TO_ID: Record<Market, number> = {
  'PT': 1,
  'SP': 2,
  'FR': 3,
  'INT': 4
};

// Serviços da BD: 2=Transporte, 3=Instalação, 4=Obra civil, 5=Sotkis access, 6=Sotkis level, 7=Sotcare
export interface Services {
  transporte: boolean;
  instalacao: boolean;
  obraCivil: boolean;
  sotkisAccess: boolean;
  sotkisLevel: boolean;
  sotcare: boolean;
}

export const SERVICO_ID_MAP: Record<number, keyof Services> = {
  2: 'transporte',
  3: 'instalacao',
  4: 'obraCivil',
  5: 'sotkisAccess',
  6: 'sotkisLevel',
  7: 'sotcare'
};

export const SERVICE_TO_ID: Record<keyof Services, number> = {
  transporte: 2,
  instalacao: 3,
  obraCivil: 4,
  sotkisAccess: 5,
  sotkisLevel: 6,
  sotcare: 7
};

// Interface principal de Carga alinhada com tblPlanningCargas
export interface Carga {
  id: number;
  cliente: string | null;
  countryId: number | null;
  market: Market | null;
  encomendaDoCliente: string | null;
  encomendaPrimavera: string | null;
  projecto: string | null;
  estadoId: number | null;
  estado: OrderState | null;
  dataPrevistaDeCarga: string | null;
  contactosParaEntrega: string | null;
  mercadoria: string | null;
  condicoesDePagamento: string | null;
  mercadoriaQueFaltaEntregar: string | null;
  dateCreated: string | null;
  localizacao: string | null;
  idPrimavera: string | null;
  transportador: string | null;
  custosDeTransporte: number | null;
  prazoDeEntregaPrevisto: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  duracao: number | null;
  services: Services;
}

// Interface para criar/atualizar carga (sem id e campos calculados)
export interface CargaInput {
  cliente?: string | null;
  countryId?: number | null;
  encomendaDoCliente?: string | null;
  encomendaPrimavera?: string | null;
  projecto?: string | null;
  estadoId?: number | null;
  dataPrevistaDeCarga?: string | null;
  contactosParaEntrega?: string | null;
  mercadoria?: string | null;
  condicoesDePagamento?: string | null;
  mercadoriaQueFaltaEntregar?: string | null;
  localizacao?: string | null;
  idPrimavera?: string | null;
  transportador?: string | null;
  custosDeTransporte?: number | null;
  prazoDeEntregaPrevisto?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  services?: (keyof Services)[];
}

// Manter LoadOrder para compatibilidade durante migração (deprecated)
export interface LoadOrder {
  id: string;
  orderNumber: string;
  clientOrder: string;
  client: string;
  destination: string;
  country: string;
  market: Market;
  status: LoadStatus;
  orderState: OrderState;
  startDate: string; // dataPrevistaDeCarga - for filtering
  startTime: string;
  deliveryDeadline: string; // prazoDeEntregaPrevisto
  // Gantt bar dates (production period)
  ganttStart: string; // dataInicio - início da produção
  ganttEnd: string; // dataFim - fim da produção
  progress: number;
  weight: number;
  project: string;
  mercadoria: string;
  mercadoriaMissing: string;
  paymentConditions: string;
  transportador: string;
  transportCosts: number;
  contacts: string;
  services: Services;
  dateCreated?: string;
}

// Mapeamento de OrderState para LoadStatus
const ORDER_STATE_TO_LOAD_STATUS: Record<OrderState, LoadStatus> = {
  'NOVA': LoadStatus.PENDING,
  'A DEFINIR': LoadStatus.PENDING,
  'AGENDADA': LoadStatus.PREPARING,
  'REALIZADA': LoadStatus.COMPLETED
};

// Função para converter Carga para LoadOrder (compatibilidade)
export function cargaToLoadOrder(carga: Carga): LoadOrder {
  const orderState = carga.estado || 'NOVA';
  return {
    id: String(carga.id),
    orderNumber: carga.encomendaPrimavera || '',
    clientOrder: carga.encomendaDoCliente || '',
    client: carga.cliente || '',
    destination: carga.localizacao || '',
    country: carga.market || 'PT',
    market: carga.market || 'PT',
    status: ORDER_STATE_TO_LOAD_STATUS[orderState] || LoadStatus.PENDING,
    orderState: orderState,
    startDate: carga.dataPrevistaDeCarga || '', // Use dataPrevistaDeCarga for filtering
    startTime: '',
    deliveryDeadline: carga.prazoDeEntregaPrevisto || '',
    // Gantt bar uses dataInicio/dataFim (production period)
    // Fallback to dataPrevistaDeCarga if not set
    ganttStart: carga.dataInicio || carga.dataPrevistaDeCarga || '',
    ganttEnd: carga.dataFim || carga.dataPrevistaDeCarga || '',
    progress: 0,
    weight: 0,
    project: carga.projecto || '',
    mercadoria: carga.mercadoria || '',
    mercadoriaMissing: carga.mercadoriaQueFaltaEntregar || '',
    paymentConditions: carga.condicoesDePagamento || '',
    transportador: carga.transportador || '',
    transportCosts: carga.custosDeTransporte || 0,
    contacts: carga.contactosParaEntrega || '',
    services: carga.services,
    dateCreated: carga.dateCreated || ''
  };
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  passwordHash: string;
  avatar?: string;
  lastLogin?: string;
}

export enum ViewMode {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL'
}
