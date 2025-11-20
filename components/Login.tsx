import React, { useState } from 'react';
import { ShopConfig } from '../types';
import { AlertCircle } from 'lucide-react';

interface LoginProps {
  onConnect: (config: ShopConfig) => void;
  error?: string;
  isLoading: boolean;
}

export const Login: React.FC<LoginProps> = ({ onConnect, error, isLoading }) => {
  // URL is hardcoded now
  const FIXED_URL = 'https://www.schlafgut.com';
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const config = { url: FIXED_URL, clientId, clientSecret };
    
    if (rememberMe) {
        const now = new Date();
        const expiry = now.getTime() + (30 * 24 * 60 * 60 * 1000);
        const storageData = { config: config, expiry: expiry };
        localStorage.setItem('shopware-creds-v2', JSON.stringify(storageData));
    } else {
        localStorage.removeItem('shopware-creds-v2');
    }

    onConnect(config);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-6 pb-safe-bottom">
      <div className="max-w-md w-full space-y-10">
        <div className="text-center">
          <div className="mb-10 flex justify-center">
             <img
               src="/Logo.png"
               alt="Schlafgut Logo"
               className="h-28 w-auto"
             />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Login</h2>
          <p className="mt-2 text-sm text-gray-400 font-medium">
            schlafgut.com
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 border border-red-100 animate-in fade-in slide-in-from-top-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Fehler</h3>
                <p className="mt-1 text-xs text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white sm:p-8 space-y-6">
            <form className="space-y-5" onSubmit={handleSubmit}>
              
              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase mb-2 ml-1 tracking-wider">Access Key ID</label>
                <input
                  type="text"
                  required
                  placeholder="SWIA..."
                  className="block w-full px-4 py-4 bg-gray-50 border-0 rounded-xl text-gray-900 font-bold focus:bg-white focus:ring-2 focus:ring-black transition-all outline-none placeholder-gray-300"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase mb-2 ml-1 tracking-wider">Secret Access Key</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="block w-full px-4 py-4 bg-gray-50 border-0 rounded-xl text-gray-900 font-bold focus:bg-white focus:ring-2 focus:ring-black transition-all outline-none placeholder-gray-300"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                />
              </div>

              <div className="flex items-center ml-1 pt-2">
                <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded cursor-pointer accent-black"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-gray-600 cursor-pointer select-none">
                    30 Tage angemeldet bleiben
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-xl shadow-gray-200 text-base font-bold text-white bg-black hover:scale-[1.02] focus:outline-none active:scale-[0.98] transition-all duration-200 mt-6"
              >
                {isLoading ? 'Verbinde...' : 'Anmelden'}
              </button>
            </form>
        </div>
      </div>
    </div>
  );
};