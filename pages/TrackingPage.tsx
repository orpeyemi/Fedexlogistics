import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Box } from '../components/Icons';
import { getShipmentByTracking } from '../services/storageService';
import { Shipment } from '../types';
import Timeline from '../components/Timeline';
import StatusBadge from '../components/StatusBadge';
import Chatbot from '../components/Chatbot';

const TrackingPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearched(true);
    const result = getShipmentByTracking(query.trim());
    if (result) {
      setShipment(result);
      setError('');
    } else {
      setShipment(null);
      setError('Tracking number not found. Please check your number and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      {/* Background Image - Logistics Theme */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      />

      {/* Hero / Header */}
      <header className="bg-[#4D148C] text-white pt-10 pb-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden z-10 shadow-lg">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          {/* Abstract pattern background */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-[#FF6600] rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute left-0 bottom-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
        </div>
        
        <nav className="flex justify-between items-center max-w-7xl mx-auto mb-16 relative z-10">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
            <span className="text-white">FedEx</span>
            <span className="text-[#FF6600]">Logistics</span>
          </div>
          {/* Admin link removed from public view */}
        </nav>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-6 drop-shadow-sm">
            Track your delivery in real-time
          </h1>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
            Enter your tracking number below to see exactly where your package is and when it will arrive.
          </p>
          
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-32 py-4 rounded-xl text-gray-900 bg-white border-0 shadow-lg ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#FF6600] sm:text-lg transition-shadow"
              placeholder="e.g., TRK-8859201"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 bg-[#FF6600] hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              Track <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          {searched && !shipment && !error && (
             <p className="mt-4 text-slate-400">Searching...</p>
          )}
        </div>
      </header>

      {/* Results Section */}
      <main className="-mt-24 px-4 sm:px-6 lg:px-8 pb-12 flex-1 relative z-20">
        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border-l-4 border-red-500 animate-fade-in">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                <Search className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No shipment found</h3>
              <p className="text-gray-500">{error}</p>
            </div>
          )}

          {shipment && (
            <div className="bg-white rounded-xl shadow-xl overflow-hidden animate-fade-in border border-gray-100">
              {/* Header Card */}
              <div className="p-6 sm:p-8 border-b border-gray-100 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Tracking Number</p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{shipment.trackingNumber}</h2>
                  </div>
                  <StatusBadge status={shipment.currentStatus} className="text-sm px-4 py-1.5 self-start sm:self-center" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                     <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Estimated Delivery</p>
                     <p className="text-lg font-medium text-gray-900">
                       {new Date(shipment.estimatedDelivery).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                     </p>
                  </div>
                  <div>
                     <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Destination</p>
                     <p className="text-lg font-medium text-gray-900">{shipment.destination}</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-6 sm:p-8 bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Shipment History</h3>
                <Timeline events={shipment.events} />
              </div>
            </div>
          )}
          
          {/* Quick links or footer info for empty state */}
          {!shipment && !error && !searched && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Global Coverage', desc: 'Track packages from over 200 countries.' },
                { title: 'Real-time Updates', desc: 'Get notified instantly when status changes.' },
                { title: 'Secure Handling', desc: 'Verified partners ensuring safe delivery.' },
              ].map((item, i) => (
                <div 
                  key={i} 
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-purple-300 transition-all duration-300 transform hover:-translate-y-2 cursor-default group"
                >
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-[#4D148C] transition-colors">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-slate-50/80 backdrop-blur-sm py-8 text-center text-sm text-gray-400 border-t border-gray-200 relative z-20">
        <p>© {new Date().getFullYear()} FedEx Logistics. All rights reserved.</p>
      </footer>
      
      <Chatbot />
    </div>
  );
};

export default TrackingPage;