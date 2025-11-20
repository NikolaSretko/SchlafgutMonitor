import React, { useState, useEffect } from 'react';
import { ShopwareService } from './services/shopwareService';
import { Login } from './components/Login';
import { ShopConfig, AppStatus, DashboardData } from './types';
import { SalesChannelList } from './components/SalesChannelList';
import { 
  RefreshCw,
  LogOut,
  TrendingUp,
  ChevronDown,
  Store,
  Calendar,
  CheckCircle2,
  Filter,
  X
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
  
  // State
  const [selectedChannel, setSelectedChannel] = useState<string>('schlafgut.com');
  const [currentConfig, setCurrentConfig] = useState<ShopConfig | null>(null);

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateMode, setDateMode] = useState<'today' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [onlyPaid, setOnlyPaid] = useState<boolean>(false);

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

  // Effect to Fetch Data
  useEffect(() => {
    const fetchData = async () => {
        if (!currentConfig) return;

        setStatus(AppStatus.LOADING);
        setError(undefined);

        try {
            const service = new ShopwareService(currentConfig);
            const channelFilter = selectedChannel === 'ALL' ? null : selectedChannel;
            
            // Date Logic
            let start: Date;
            let end: Date;

            if (dateMode === 'today') {
                const now = new Date();
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            } else {
                start = new Date(customStartDate);
                start.setHours(0, 0, 0, 0);
                end = new Date(customEndDate);
                end.setHours(23, 59, 59, 999);
            }

            const dashboardData = await service.getDashboardData(
                channelFilter, 
                start, 
                end, 
                onlyPaid
            );
            
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
  }, [currentConfig, selectedChannel, dateMode, customStartDate, customEndDate, onlyPaid]);

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
                 
                 let start: Date;
                 let end: Date;
                 if (dateMode === 'today') {
                     const now = new Date();
                     start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                     end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                 } else {
                     start = new Date(customStartDate);
                     start.setHours(0,0,0,0);
                     end = new Date(customEndDate);
                     end.setHours(23,59,59,999);
                 }

                 const res = await service.getDashboardData(channelFilter, start, end, onlyPaid);
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
            <img 
               src="public/logo.png" 
               alt="Schlafgut" 
               className="h-24 w-auto"
            />
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
           <img 
             src="public/logo.png" 
             alt="Schlafgut" 
             className="h-10 w-auto"
           />
           
           {/* Custom Dropdown Pill */}
           <div className="relative group hidden sm:block">
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
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`p-2.5 rounded-full transition-all duration-200 active:scale-90 ${isFilterOpen ? 'bg-black text-white' : 'bg-gray-50 text-gray-900 hover:bg-gray-100'}`}
            >
                {isFilterOpen ? <X size={18} /> : <Filter size={18} />}
            </button>
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

      {/* Filter Bar (Collapsible) */}
      {isFilterOpen && (
          <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 animate-in slide-in-from-top-2">
              <div className="flex flex-col space-y-4 max-w-md mx-auto">
                  
                  {/* Mode Switcher */}
                  <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                      <button 
                        onClick={() => setDateMode('today')}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${dateMode === 'today' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                          Heute
                      </button>
                      <button 
                        onClick={() => setDateMode('custom')}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${dateMode === 'custom' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                          Zeitraum
                      </button>
                  </div>

                  {/* Custom Date Inputs */}
                  {dateMode === 'custom' && (
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Von</label>
                              <div className="relative">
                                <input 
                                    type="date" 
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-black focus:outline-none appearance-none"
                                />
                              </div>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Bis</label>
                              <div className="relative">
                                <input 
                                    type="date" 
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-black focus:outline-none appearance-none"
                                />
                              </div>
                          </div>
                      </div>
                  )}

                  {/* Paid Filter */}
                  <div 
                    onClick={() => setOnlyPaid(!onlyPaid)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${onlyPaid ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                  >
                      <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 transition-colors ${onlyPaid ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-300'}`}>
                              {onlyPaid && <CheckCircle2 size={12} />}
                          </div>
                          <span className={`text-sm font-bold ${onlyPaid ? 'text-green-800' : 'text-gray-600'}`}>Nur bezahlte Bestellungen</span>
                      </div>
                  </div>

              </div>
          </div>
      )}

      <main className="px-6 pt-10 pb-12 max-w-md mx-auto flex flex-col items-center">
        
        {/* Dynamic Badge */}
        <div className="inline-flex items-center justify-center space-x-2 bg-white border border-gray-200 px-4 py-1.5 rounded-full mb-12 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${dateMode === 'today' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                {dateMode === 'today' ? 'Live Heute' : 'Filter aktiv'}
            </span>
            {onlyPaid && (
                 <span className="ml-1 pl-2 border-l border-gray-200 text-[10px] font-bold text-green-600 uppercase tracking-widest">Paid</span>
            )}
        </div>

        {/* PRIMARY KPI: REVENUE */}
        <div className="text-center w-full mb-12 animate-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-[4rem] font-black text-black tracking-tighter leading-none">
                {data?.dailyRevenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </h2>
            <p className="text-gray-400 font-bold mt-4 text-sm uppercase tracking-widest">
                {onlyPaid ? 'Umsatz (Bezahlt)' : 'Umsatz (Gesamt)'}
            </p>
        </div>

        {/* SECONDARY KPI: ORDER COUNT */}
        <div className="bg-gray-50 rounded-3xl p-8 w-full mb-8 flex flex-col items-center justify-center border border-gray-100 animate-in slide-in-from-bottom-8 duration-700 delay-100">
             <span className="text-gray-900 mb-3 bg-white p-3 rounded-2xl shadow-sm">
                <TrendingUp size={24} />
             </span>
             <span className="text-4xl font-black text-gray-900 mb-1 tracking-tight">{data?.totalOrders}</span>
             <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                {onlyPaid ? 'Bezahlte Orders' : 'Bestellungen'}
             </span>
        </div>

        {/* SALES CHANNELS - Back by popular demand */}
        {data?.salesChannels && data.salesChannels.length > 0 && (
            <div className="w-full animate-in slide-in-from-bottom-10 duration-700 delay-200">
                <SalesChannelList channels={data.salesChannels} />
            </div>
        )}

      </main>
    </div>
  );
};

export default App;