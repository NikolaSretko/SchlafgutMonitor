import { ShopConfig, DashboardData, Order, SalesMetric, SalesChannelMetric } from '../types';

export class ShopwareService {
  private config: ShopConfig;
  private token: string | null = null;

  constructor(config: ShopConfig) {
    this.config = config;
  }

  private async authenticate(): Promise<string> {
    const response = await fetch(`${this.config.url}/api/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const data = await response.json();
    this.token = data.access_token;
    return this.token!;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
    if (!this.token) {
      await this.authenticate();
    }

    const response = await fetch(`${this.config.url}/api${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      await this.authenticate();
      return fetch(`${this.config.url}/api${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
    }

    return response;
  }

  async getDashboardData(
      channelFilter: string | null,
      startDate: Date,
      endDate: Date,
      onlyPaid: boolean
  ): Promise<DashboardData> {

    // Convert local dates to UTC strings preserving the intended local date
    // Instead of toISOString() which shifts timezone, we format as UTC directly
    const formatToUTC = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+00:00`;
    };

    const isoStartString = formatToUTC(startDate);
    const isoEndString = formatToUTC(endDate);

    // Build Filter - using 'orderDate' as per Shopware 6 API standard
    const filters: any[] = [
        {
            type: 'range',
            field: 'orderDate',
            parameters: {
                gte: isoStartString,
                lte: isoEndString
            }
        }
    ];

    // Add Channel Filter
    if (channelFilter) {
        filters.push({
            type: 'equals',
            field: 'salesChannel.name',
            value: channelFilter
        });
    }

    // Add Paid Filter
    if (onlyPaid) {
        filters.push({
            type: 'equals',
            field: 'transactions.stateMachineState.technicalName',
            value: 'paid'
        });
    }

    // Associations to fetch
    const associations: any = {
        stateMachineState: {},
        orderCustomer: {},
        salesChannel: {}
    };
    
    if (onlyPaid) {
        associations.transactions = {
            associations: {
                stateMachineState: {}
            }
        };
    }

    // Complex Aggregation to get Total Stats AND Channel Split in one go
    const response = await this.fetchWithAuth('/search/order', {
      method: 'POST',
      body: JSON.stringify({
        page: 1,
        limit: 5, 
        'total-count-mode': 1, 
        filter: filters,
        sort: [{ field: 'orderDateTime', order: 'DESC' }],
        associations: associations,
        aggregations: [
          // Total Sum
          {
            name: 'todaysStats',
            type: 'stats', 
            field: 'amountTotal'
          },
          // Group by Sales Channel
          {
            name: 'channels',
            type: 'terms',
            field: 'salesChannel.name',
            aggregation: {
               name: 'revenue',
               type: 'stats', // or sum
               field: 'amountTotal'
            }
          }
        ]
      })
    });

    if (!response.ok) throw new Error('Failed to fetch orders');
    const orderData = await response.json();

    // 1. Parse Total Stats
    const stats = orderData.aggregations?.todaysStats;
    const totalRevenue = stats?.sum || 0;
    const averageBasket = stats?.avg || 0;
    const totalOrders = orderData.total || 0;

    // 2. Parse Sales Channels
    const channelBuckets = orderData.aggregations?.channels?.buckets || [];
    const salesChannels: SalesChannelMetric[] = channelBuckets.map((bucket: any, index: number) => {
        const channelRevenue = bucket.revenue?.sum || 0;
        const percentage = totalRevenue > 0 ? (channelRevenue / totalRevenue) * 100 : 0;
        
        // Simple color rotation
        const colors = ['#000000', '#189eff', '#a8a8a8', '#e5e7eb'];
        
        return {
            name: bucket.key || 'Unknown',
            revenue: channelRevenue,
            percentage: Math.round(percentage),
            color: colors[index % colors.length]
        };
    });

    // 3. Parse Recent Orders
    const recentOrders: Order[] = orderData.data.map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      amountTotal: o.amountTotal,
      orderDateTime: o.orderDateTime,
      stateMachineState: {
        name: o.stateMachineState?.name || 'Unknown',
        technicalName: o.stateMachineState?.technicalName || 'unknown'
      },
      orderCustomer: {
        firstName: o.orderCustomer?.firstName || '',
        lastName: o.orderCustomer?.lastName || '',
        email: o.orderCustomer?.email || ''
      },
      salesChannel: {
        name: o.salesChannel?.name || 'Unknown'
      }
    }));

    return {
      totalRevenue: 0, 
      dailyRevenue: totalRevenue,
      totalOrders: totalOrders,
      averageBasket: averageBasket,
      recentOrders: recentOrders,
      salesHistory: [], 
      salesChannels: salesChannels 
    };
  }
}