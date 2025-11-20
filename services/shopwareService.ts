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

  async getDashboardData(channelFilter: string | null): Promise<DashboardData> {
    // Get Start of Day in Local Time, convert to UTC for API
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const isoStartString = startOfDay.toISOString();

    // Build Filter
    const filters: any[] = [
        {
            type: 'range',
            field: 'orderDateTime',
            parameters: {
                gte: isoStartString // Strict "Since Today 00:00"
            }
        }
    ];

    // Add Channel Filter if specific channel is selected (not null/All)
    if (channelFilter) {
        filters.push({
            type: 'equals',
            field: 'salesChannel.name',
            value: channelFilter
        });
    }

    // We perform a search that does TWO things:
    // 1. Aggregations: Calculates the SUM on the server for revenue
    // 2. Data: Gets the total count (hits) and recent orders
    const orderResponse = await this.fetchWithAuth('/search/order', {
      method: 'POST',
      body: JSON.stringify({
        page: 1,
        limit: 5, 
        'total-count-mode': 1, // Explicitly request exact total count
        filter: filters,
        sort: [{ field: 'orderDateTime', order: 'DESC' }],
        associations: {
          stateMachineState: {},
          orderCustomer: {},
          salesChannel: {}
        },
        // SERVER SIDE CALCULATION for Revenue
        aggregations: [
          {
            name: 'todaysStats',
            type: 'stats', 
            field: 'amountTotal'
          }
        ]
      })
    });

    if (!orderResponse.ok) throw new Error('Failed to fetch orders');
    const orderData = await orderResponse.json();

    // Parse the Server Aggregations for Revenue
    const stats = orderData.aggregations?.todaysStats;
    const totalRevenue = stats?.sum || 0;
    const averageBasket = stats?.avg || 0;

    // FIX: Use the main 'total' property from the search response for the count.
    const totalOrders = orderData.total || 0;

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
      salesChannels: [] 
    };
  }
}