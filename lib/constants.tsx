import React from 'react';
import {
  LayoutDashboard,
  Package,
  CalendarRange,
  Factory,
  ShieldCheck,
  Settings,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Warehouse,
  Truck,
  Users,
  Handshake,
  Shield,
  BarChart3,
  CreditCard,
  Trophy,
  ShoppingCart,
  Megaphone,
  UserCircle,
  BookOpen,
} from 'lucide-react';
import { LoadStatus } from './types';

export const STATUS_COLORS = {
  [LoadStatus.PENDING]: '#F59E0B',
  [LoadStatus.PREPARING]: '#3B82F6',
  [LoadStatus.COMPLETED]: '#10B981',
  [LoadStatus.CANCELLED]: '#EF4444',
  [LoadStatus.DELAYED]: '#8B5CF6',
};

export const STATUS_ICONS = {
  [LoadStatus.PENDING]: <Clock className="w-4 h-4 text-[#F59E0B]" />,
  [LoadStatus.PREPARING]: <Package className="w-4 h-4 text-[#3B82F6]" />,
  [LoadStatus.COMPLETED]: <CheckCircle2 className="w-4 h-4 text-[#10B981]" />,
  [LoadStatus.CANCELLED]: <XCircle className="w-4 h-4 text-[#EF4444]" />,
  [LoadStatus.DELAYED]: <AlertCircle className="w-4 h-4 text-[#8B5CF6]" />,
};

export interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: { label: string; icon: React.ReactNode; path: string }[];
}

export const NAVIGATION_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/' },
  {
    label: 'Produção',
    icon: <Factory size={18} />,
    children: [
      { label: 'Encomendas', icon: <Package size={16} />, path: '/encomendas' },
      { label: 'Planeamento', icon: <CalendarRange size={16} />, path: '/planeamento' },
      { label: 'Shopfloor', icon: <Factory size={16} />, path: '/shopfloor' },
      { label: 'Armazém', icon: <Warehouse size={16} />, path: '/armazem' },
      { label: 'Autocontrolo', icon: <ShieldCheck size={16} />, path: '/autocontrolo' },
      { label: 'Fornecedores', icon: <Users size={16} />, path: '/fornecedores' },
    ]
  },
  {
    label: 'Expedição',
    icon: <Truck size={18} />,
    children: [
      { label: 'Transportes', icon: <Truck size={16} />, path: '/transportes' },
      { label: 'Contratação', icon: <Handshake size={16} />, path: '/contratacao' },
      { label: 'Controlo', icon: <Shield size={16} />, path: '/controlo_exp' },
    ]
  },
  {
    label: 'Análises',
    icon: <BarChart3 size={18} />,
    children: [
      { label: 'Produtividade', icon: <BarChart3 size={16} />, path: '/produtividade' },
      { label: 'Créditos', icon: <CreditCard size={16} />, path: '/creditos' },
      { label: 'Concorrência', icon: <Trophy size={16} />, path: '/concorrencia' },
    ]
  },
  { label: 'Procurement', icon: <ShoppingCart size={18} />, path: '/procurement' },
  { label: 'Marketing', icon: <Megaphone size={18} />, path: '/marketing' },
  { label: 'CRM', icon: <UserCircle size={18} />, path: '/crm' },
  { label: 'Catálogo', icon: <BookOpen size={18} />, path: '/catalogo' },
  { label: 'Admin', icon: <Settings size={18} />, path: '/admin' },
];
 