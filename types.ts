export interface ShopConfig {
  url: string;
  clientId: string;
  clientSecret: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  amountTotal: number;
  orderDateTime: string;
  stateMachineState: {
    name: string;
    technicalName: string;
  };
  orderCustomer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  salesChannel?: {
    name: string;
  };
}

export interface SalesMetric {
  date: string;
  revenue: number;
  orders: number;
}

export interface SalesChannelMetric {
  name: string;
  revenue: number;
  percentage: number;
  color: string;
}

export interface DashboardData {
  totalRevenue: number;
  dailyRevenue: number; // Today's revenue
  totalOrders: number;
  averageBasket: number;
  recentOrders: Order[];
  salesHistory: SalesMetric[];
  salesChannels: SalesChannelMetric[];
}

export enum AppStatus {
  LOGIN = 'LOGIN',
  LOADING = 'LOADING',
  DASHBOARD = 'DASHBOARD',
  ERROR = 'ERROR'
}