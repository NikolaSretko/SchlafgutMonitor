import React from 'react';
import { SalesChannelMetric } from '../types';
import { Globe, Smartphone, ShoppingBag } from 'lucide-react';

interface Props {
  channels: SalesChannelMetric[];
}

const getIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('instagram') || n.includes('facebook') || n.includes('social')) return <Smartphone size={18} />;
  if (n.includes('amazon') || n.includes('ebay')) return <ShoppingBag size={18} />;
  return <Globe size={18} />;
};

export const SalesChannelList: React.FC<Props> = ({ channels }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Sales Channels</h3>
      <div className="space-y-4">
        {channels.map((channel, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center text-white shadow-sm mr-3"
                style={{ backgroundColor: channel.color }}
              >
                {getIcon(channel.name)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{channel.name}</p>
                <p className="text-xs text-gray-500">{channel.percentage}% of sales</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">${channel.revenue.toFixed(2)}</p>
              <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                <div 
                    className="h-full rounded-full" 
                    style={{ width: `${channel.percentage}%`, backgroundColor: channel.color }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};