import React, { useState, useEffect } from 'react';
import { ShopwareService } from './services/shopwareService';
import { Login, SchlafgutLogo } from './components/Login';
import { ShopConfig, AppStatus, DashboardData } from './types';
import { 
  RefreshCw,
  LogOut,
  TrendingUp,
  ChevronDown,
  Store
} from 'lucide-react';

// Channel Options
const CHANNELS = [
    { id: 'schlafgut.com', label: 'schlafgut.com' },
    { id: 'API Channelengine', label: 'API Channelengine' },
    { id: 'ALL', label: 'Alle Kanäle' }
];

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.LOGIN);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | undefined>();
  
  // Channel State
  const [selectedChannel, setSelectedChannel] = useState<string>('schlafgut.com');
  
  // We keep the config in state to allow refreshing
  const [currentConfig, setCurrentConfig] = useState<ShopConfig | null>(null);

  // Auto-Login check on Mount
  useEffect(() => {
    const savedCreds = localStorage.getItem('shopware-creds-v2');
    if (savedCreds) {
        try {
            const parsed = JSON.parse(savedCreds);
            const now = new Date().getTime();
            
            if (parsed.config && parsed.expiry && now < parsed.expiry) {
                setCurrentConfig(parsed.config);
                setStatus(AppStatus.LOADING);
            } else {
                localStorage.removeItem('shopware-creds-v2');
            }
        } catch (e) {
            localStorage.removeItem('shopware-creds-v2');
        }
    }
  }, []);

  // Effect to Fetch Data when Config or Channel changes
  useEffect(() => {
    const fetchData = async () => {
        if (!currentConfig) return;

        setStatus(AppStatus.LOADING);
        setError(undefined);

        try {
            const service = new ShopwareService(currentConfig);
            const channelFilter = selectedChannel === 'ALL' ? null : selectedChannel;
            const dashboardData = await service.getDashboardData(channelFilter);
            setData(dashboardData);
            setStatus(AppStatus.DASHBOARD);
        } catch (err) {
            if (status === AppStatus.LOGIN) {
                setError(err instanceof Error ? err.message : 'Verbindung fehlgeschlagen');
                setStatus(AppStatus.LOGIN);
            } else {
                console.error(err);
                setStatus(AppStatus.DASHBOARD); 
            }
        }
    };

    if (currentConfig) {
        fetchData();
    }
  }, [currentConfig, selectedChannel]);

  const handleLoginSubmit = (config: ShopConfig) => {
      setCurrentConfig(config);
  };

  const handleLogout = () => {
      localStorage.removeItem('shopware-creds-v2');
      setStatus(AppStatus.LOGIN);
      setData(null);
      setCurrentConfig(null);
      setSelectedChannel('schlafgut.com');
  };

  const handleRefresh = () => {
      if (currentConfig) {
         const fetchNow = async () => {
             setStatus(AppStatus.LOADING);
             try {
                 const service = new ShopwareService(currentConfig);
                 const channelFilter = selectedChannel === 'ALL' ? null : selectedChannel;
                 const res = await service.getDashboardData(channelFilter);
                 setData(res);
                 setStatus(AppStatus.DASHBOARD);
             } catch(e) {
                 setStatus(AppStatus.DASHBOARD);
             }
         };
         fetchNow();
      }
  };

  const getSelectedLabel = () => {
      return CHANNELS.find(c => c.id === selectedChannel)?.label || selectedChannel;
  };

  if (status === AppStatus.LOGIN || status === AppStatus.ERROR) {
    return (
      <Login 
        onConnect={handleLoginSubmit} 
        error={error} 
        isLoading={false} 
      />
    );
  }

  if (status === AppStatus.LOADING) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-white">
         <div className="mb-6 animate-pulse">
            <SchlafgutLogo className="h-24 w-auto text-black" />
         </div>
         <p className="text-gray-400 font-medium text-sm uppercase tracking-widest animate-pulse">Lade Daten...</p>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white sticky top-0 z-30 px-6 py-4 flex justify-between items-center border-b border-gray-100/50 backdrop-blur-xl bg-white/80">
        <div className="flex items-center space-x-4">
           <SchlafgutLogo className="h-10 w-auto text-black" />
           
           {/* Custom Dropdown Pill */}
           <div className="relative group">
               <div className="flex items-center bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all rounded-full px-4 py-2 cursor-pointer active:scale-95 duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                    <span className="text-gray-400 mr-2">
                        <Store size={14} />
                    </span>
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wide mr-2 max-w-[120px] truncate">
                        {getSelectedLabel()}
                    </span>
                    <ChevronDown size={14} className="text-gray-400" />
               </div>
               
               <select 
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               >
                   {CHANNELS.map(c => (
                       <option key={c.id} value={c.id}>{c.label}</option>
                   ))}
               </select>
           </div>
        </div>

        <div className="flex items-center space-x-2">
            <button 
                onClick={handleRefresh}
                className="p-2.5 rounded-full bg-gray-50 text-gray-900 hover:bg-black hover:text-white transition-all duration-200 active:scale-90"
            >
                <RefreshCw size={18} />
            </button>
            <button 
                onClick={handleLogout}
                className="p-2.5 rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 active:scale-90"
            >
                <LogOut size={18} />
            </button>
        </div>
      </header>

      <main className="px-6 pt-10 pb-12 max-w-md mx-auto flex flex-col items-center">
        
        {/* Live Badge */}
        <div className="inline-flex items-center justify-center space-x-2 bg-white border border-gray-200 px-4 py-1.5 rounded-full mb-12 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Live Heute</span>
        </div>

        {/* PRIMARY KPI: REVENUE */}
        <div className="text-center w-full mb-12 animate-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-[4rem] font-black text-black tracking-tighter leading-none">
                {data?.dailyRevenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </h2>
            <p className="text-gray-400 font-bold mt-4 text-sm uppercase tracking-widest">Umsatz</p>
        </div>

        {/* SECONDARY KPI: ORDER COUNT */}
        <div className="bg-gray-50 rounded-3xl p-8 w-full mb-8 flex flex-col items-center justify-center border border-gray-100 animate-in slide-in-from-bottom-8 duration-700 delay-100">
             <span className="text-gray-900 mb-3 bg-white p-3 rounded-2xl shadow-sm">
                <TrendingUp size={24} />
             </span>
             <span className="text-4xl font-black text-gray-900 mb-1 tracking-tight">{data?.totalOrders}</span>
             <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Bestellungen</span>
        </div>

      </main>
    </div>
  );
};

export default App;