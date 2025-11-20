import React from 'react';
import { Order } from '../types';
import { Package, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface RecentOrdersProps {
  orders: Order[];
}

const getStatusIcon = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes('bezahlt') || s.includes('abgeschlossen') || s.includes('paid')) return <CheckCircle2 size={16} className="text-green-500" />;
  if (s.includes('storniert') || s.includes('cancel')) return <XCircle size={16} className="text-red-500" />;
  if (s.includes('offen') || s.includes('open')) return <AlertCircle size={16} className="text-yellow-500" />;
  return <Package size={16} className="text-blue-500" />;
};

const getStatusColor = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes('bezahlt') || s.includes('abgeschlossen') || s.includes('paid')) return 'bg-green-50 text-green-700';
  if (s.includes('storniert') || s.includes('cancel')) return 'bg-red-50 text-red-700';
  if (s.includes('offen') || s.includes('open')) return 'bg-yellow-50 text-yellow-700';
  return 'bg-blue-50 text-blue-700';
};

export const RecentOrders: React.FC<RecentOrdersProps> = ({ orders }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bestellung</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kunde</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Summe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{order.orderNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs mr-3">
                      {order.orderCustomer.firstName.charAt(0)}{order.orderCustomer.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.orderCustomer.firstName} {order.orderCustomer.lastName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.stateMachineState.name)}`}>
                    <span className="mr-1.5">{getStatusIcon(order.stateMachineState.name)}</span>
                    {order.stateMachineState.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                  {order.amountTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};