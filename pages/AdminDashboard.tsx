import React, { useState, useEffect } from 'react';
import { 
  getShipments, 
  saveShipment, 
  generateId, 
  deleteShipment,
  getShipmentByTracking
} from '../services/storageService';
import { generateStatusMessage, parseManifest, getSmartActionSuggestion } from '../services/geminiService';
import { Shipment, ShipmentStatus, TrackingEvent } from '../types';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Truck, 
  MapPin, 
  Calendar, 
  X, 
  Sparkles,
  FileText,
  LogOut,
  LayoutDashboard,
  ArrowRight,
  Trash2,
  Filter,
  CalendarRange,
  ChevronDown,
  ChevronUp
} from '../components/Icons';
import { Link, useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Row Expansion
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isParseModalOpen, setIsParseModalOpen] = useState(false);
  
  // Selected shipment for editing/updating
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<Shipment & { estimatedDeliveryDate: string }>>({
    sender: '',
    recipient: '',
    origin: '',
    destination: '',
    trackingNumber: '',
    estimatedDeliveryDate: ''
  });

  const [newEventData, setNewEventData] = useState({
    status: ShipmentStatus.IN_TRANSIT,
    location: '',
    description: '',
    useAI: false,
    editEstimatedDelivery: ''
  });

  const [manifestText, setManifestText] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setShipments(getShipments());
    setSelectedIds(new Set()); // Clear selection on refresh
    setExpandedId(null); // Collapse all on refresh
  };

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    const id = generateId();
    const now = new Date().toISOString();
    
    // Auto-generate tracking if empty
    const tracking = formData.trackingNumber || `TRK-${Math.floor(Math.random() * 1000000)}`;

    // Handle estimated delivery date
    const deliveryDate = formData.estimatedDeliveryDate 
      ? new Date(formData.estimatedDeliveryDate).toISOString() 
      : new Date(Date.now() + 86400000 * 5).toISOString(); // Default +5 days

    const newShipment: Shipment = {
      id,
      trackingNumber: tracking,
      sender: formData.sender || 'Unknown',
      recipient: formData.recipient || 'Unknown',
      origin: formData.origin || 'Unknown',
      destination: formData.destination || 'Unknown',
      currentStatus: ShipmentStatus.CREATED,
      estimatedDelivery: deliveryDate,
      lastUpdated: now,
      events: [
        {
          id: generateId(),
          timestamp: now,
          location: formData.origin || 'Origin',
          status: ShipmentStatus.CREATED,
          description: 'Shipment information received'
        }
      ]
    };

    saveShipment(newShipment);
    setIsAddModalOpen(false);
    setFormData({});
    refreshData();
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;

    let description = newEventData.description;

    if (newEventData.useAI && process.env.API_KEY) {
        setIsProcessingAI(true);
        description = await generateStatusMessage(
            newEventData.status, 
            newEventData.location, 
            newEventData.description || "Standard update"
        );
        setIsProcessingAI(false);
    }

    const newEvent: TrackingEvent = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      location: newEventData.location,
      status: newEventData.status,
      description: description
    };

    // Update the shipment's estimated delivery if the date was changed
    const updatedEstimatedDelivery = newEventData.editEstimatedDelivery
       ? new Date(newEventData.editEstimatedDelivery).toISOString()
       : selectedShipment.estimatedDelivery;

    const updatedShipment: Shipment = {
      ...selectedShipment,
      currentStatus: newEventData.status,
      estimatedDelivery: updatedEstimatedDelivery,
      lastUpdated: new Date().toISOString(),
      events: [newEvent, ...selectedShipment.events]
    };

    saveShipment(updatedShipment);
    setIsUpdateModalOpen(false);
    setNewEventData({ status: ShipmentStatus.IN_TRANSIT, location: '', description: '', useAI: false, editEstimatedDelivery: '' });
    refreshData();
  };

  const handleSmartParse = async () => {
    if (!manifestText.trim()) return;
    setIsProcessingAI(true);
    try {
      const parsedData = await parseManifest(manifestText);
      // Add each parsed item
      parsedData.forEach(item => {
        const id = generateId();
        const now = new Date().toISOString();
        const newShipment: Shipment = {
          id,
          trackingNumber: item.trackingNumber || `TRK-${Math.floor(Math.random() * 1000000)}`,
          sender: item.sender || 'Unknown',
          recipient: item.recipient || 'Unknown',
          origin: item.origin || 'Unknown',
          destination: item.destination || 'Unknown',
          currentStatus: ShipmentStatus.CREATED,
          estimatedDelivery: new Date(Date.now() + (item.estimatedDeliveryDays || 5) * 86400000).toISOString(),
          lastUpdated: now,
          events: [
            {
              id: generateId(),
              timestamp: now,
              location: item.origin || 'Origin',
              status: ShipmentStatus.CREATED,
              description: 'Imported from manifest'
            }
          ]
        };
        saveShipment(newShipment);
      });
      setManifestText('');
      setIsParseModalOpen(false);
      refreshData();
    } catch (err) {
      alert("Failed to parse manifest. Please try again.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this shipment?')) {
      deleteShipment(id);
      refreshData();
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} selected shipments?`)) {
      selectedIds.forEach(id => deleteShipment(id));
      refreshData();
    }
  };
  
  const openUpdateModal = (shipment: Shipment) => {
      setSelectedShipment(shipment);
      // Convert ISO string to YYYY-MM-DD for date input
      const dateStr = shipment.estimatedDelivery 
        ? new Date(shipment.estimatedDelivery).toISOString().split('T')[0] 
        : '';

      setNewEventData({
          status: ShipmentStatus.IN_TRANSIT,
          location: '',
          description: '',
          useAI: false,
          editEstimatedDelivery: dateStr
      });
      setIsUpdateModalOpen(true);
      // Fetch a quick suggestion
      getSmartActionSuggestion(shipment.currentStatus).then(setAiSuggestion);
  }

  const toggleRow = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  // Filtering Logic
  const filteredShipments = shipments.filter(s => {
    const matchesSearch = 
      s.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.recipient.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || s.currentStatus === statusFilter;
    
    let matchesDate = true;
    if (dateStart || dateEnd) {
      // Filter by Estimated Delivery Date
      const d = new Date(s.estimatedDelivery).setHours(0,0,0,0);
      if (dateStart) {
        if (d < new Date(dateStart).setHours(0,0,0,0)) matchesDate = false;
      }
      if (dateEnd) {
        if (d > new Date(dateEnd).setHours(23,59,59,999)) matchesDate = false;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Selection Logic
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredShipments.length && filteredShipments.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredShipments.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#4D148C] text-white hidden md:flex flex-col shrink-0">
        <div className="p-6 border-b border-[#5E1F9F]">
           <div className="flex items-center gap-2 font-bold text-xl">
             <div className="flex flex-col leading-none">
              <span>FedEx</span>
              <span className="text-[#FF6600] text-sm">Logistics</span>
             </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-[#FF6600] rounded-lg text-white font-medium">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </a>
          <div className="px-4 py-3 text-slate-300 hover:text-white flex items-center gap-3 cursor-not-allowed">
            <FileText className="w-5 h-5" /> Reports
          </div>
        </nav>

        <div className="p-4 border-t border-[#5E1F9F]">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
            Logout to Public
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0 z-20">
          <h1 className="text-xl font-bold text-gray-800">Shipments Overview</h1>
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm border border-purple-200">
               AD
             </div>
          </div>
        </header>

        {/* Toolbar & Filters */}
        <div className="p-6 pb-0 space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search tracking # or recipient..." 
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF6600] focus:border-[#FF6600] outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div className="relative min-w-[160px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF6600] outline-none appearance-none bg-white cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  {Object.values(ShipmentStatus).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ArrowRight className="w-3 h-3 rotate-90" />
                </div>
              </div>

              {/* Date Range */}
              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
                <CalendarRange className="w-4 h-4 text-gray-400 shrink-0" />
                <input 
                  type="date" 
                  className="outline-none text-sm bg-transparent w-full"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  placeholder="Start"
                />
                <span className="text-gray-400">-</span>
                <input 
                  type="date" 
                  className="outline-none text-sm bg-transparent w-full"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  placeholder="End"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
               {selectedIds.size > 0 && (
                 <button 
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors border border-red-200 animate-fade-in"
                 >
                   <Trash2 className="w-4 h-4" />
                   Delete ({selectedIds.size})
                 </button>
               )}

               <button 
                onClick={() => setIsParseModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors border border-indigo-200"
              >
                <Sparkles className="w-4 h-4" />
                Smart Import
              </button>
              
              <button 
                onClick={() => { setFormData({}); setIsAddModalOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF6600] hover:bg-orange-600 text-white rounded-lg font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Shipment
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-auto custom-scrollbar relative">
             <table className="w-full text-left border-collapse">
               <thead className="bg-gray-50 sticky top-0 z-10">
                 <tr>
                   <th className="px-6 py-4 border-b border-gray-200 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-[#FF6600] focus:ring-[#FF6600] w-4 h-4 cursor-pointer"
                        checked={filteredShipments.length > 0 && selectedIds.size === filteredShipments.length}
                        onChange={toggleSelectAll}
                      />
                   </th>
                   <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Tracking ID</th>
                   <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Recipient</th>
                   <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Route</th>
                   <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Status</th>
                   <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Est. Delivery</th>
                   <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {filteredShipments.map(shipment => {
                   const isSelected = selectedIds.has(shipment.id);
                   const isExpanded = expandedId === shipment.id;

                   return (
                    <React.Fragment key={shipment.id}>
                      <tr 
                        onClick={() => toggleRow(shipment.id)}
                        className={`transition-colors cursor-pointer group ${isSelected ? 'bg-orange-50' : isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'} ${isExpanded ? 'border-b-0' : ''}`}
                      >
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-[#FF6600] focus:ring-[#FF6600] w-4 h-4 cursor-pointer"
                            checked={isSelected}
                            onChange={() => toggleSelect(shipment.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            <span className="font-medium text-[#4D148C]">{shipment.trackingNumber}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{shipment.recipient}</div>
                          <div className="text-xs text-gray-500">{shipment.sender}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            {shipment.origin.split(',')[0]} <span className="text-gray-400">→</span> {shipment.destination.split(',')[0]}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={shipment.currentStatus} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => openUpdateModal(shipment)}
                              className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                            >
                              Update
                            </button>
                            <button 
                              onClick={() => handleDelete(shipment.id)}
                              className="text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50">
                          <td colSpan={7} className="px-6 py-0 pb-6 border-b border-gray-200 shadow-inner">
                            <div className="pl-14 pt-4 animate-fade-in">
                              <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#FF6600]"/> Full Tracking History
                              </h4>
                              <div className="bg-white rounded-lg p-6 border border-gray-200 max-w-4xl">
                                <Timeline events={shipment.events} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                   );
                 })}
                 {filteredShipments.length === 0 && (
                   <tr>
                     <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                       <div className="flex flex-col items-center gap-2">
                         <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <Search className="w-5 h-5 text-gray-400" />
                         </div>
                         <p>No shipments found matching your filters.</p>
                       </div>
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>
      </main>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Create New Shipment</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleCreateShipment} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number (Optional)</label>
                   <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6600] outline-none" 
                      placeholder="Leave blank to auto-generate"
                      value={formData.trackingNumber || ''}
                      onChange={e => setFormData({...formData, trackingNumber: e.target.value})}
                    />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Sender</label>
                   <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6600] outline-none" value={formData.sender || ''} onChange={e => setFormData({...formData, sender: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                   <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6600] outline-none" value={formData.recipient || ''} onChange={e => setFormData({...formData, recipient: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                   <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6600] outline-none" value={formData.origin || ''} onChange={e => setFormData({...formData, origin: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                   <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6600] outline-none" value={formData.destination || ''} onChange={e => setFormData({...formData, destination: e.target.value})} />
                </div>
                <div className="col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery Date</label>
                   <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6600] outline-none"
                    value={formData.estimatedDeliveryDate || ''}
                    onChange={e => setFormData({...formData, estimatedDeliveryDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#FF6600] text-white font-medium rounded-lg hover:bg-orange-600">Create Shipment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parse Manifest Modal */}
      {isParseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white">
              <div className="flex items-center gap-2 text-indigo-800">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold">Smart Import (Gemini AI)</h2>
              </div>
              <button onClick={() => setIsParseModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Paste unstructured text (e.g., an email from a supplier or a list of orders). AI will extract the shipment details automatically.</p>
              <textarea 
                className="w-full h-40 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono bg-gray-50"
                placeholder={`Example: 
Shipping to John Doe in Seattle from Acme Corp (NY). Tracking: TRK-9921.
Order for Jane Smith, destination Miami, FL, sent from Warehouse A.`}
                value={manifestText}
                onChange={e => setManifestText(e.target.value)}
              />
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setIsParseModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
                <button 
                  onClick={handleSmartParse} 
                  disabled={isProcessingAI || !manifestText}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessingAI ? 'Analyzing...' : 'Parse & Import'}
                  {!isProcessingAI && <ArrowRight className="w-4 h-4"/>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Shipment Modal */}
      {isUpdateModalOpen && selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Update Status: <span className="text-[#4D148C]">{selectedShipment.trackingNumber}</span></h2>
              <button onClick={() => setIsUpdateModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleUpdateEvent} className="p-6 space-y-4">
              {aiSuggestion && (
                  <div className="text-xs bg-indigo-50 text-indigo-700 p-2 rounded border border-indigo-100 flex gap-2 items-center">
                      <Sparkles className="w-3 h-3" />
                      Tip: {aiSuggestion}
                  </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6600] outline-none"
                      value={newEventData.status}
                      onChange={(e) => setNewEventData({...newEventData, status: e.target.value as ShipmentStatus})}
                    >
                      {Object.values(ShipmentStatus).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                 </div>
                 
                 <div className="col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
                   <input 
                      type="text" 
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6600] outline-none"
                      value={newEventData.location}
                      onChange={(e) => setNewEventData({...newEventData, location: e.target.value})}
                      placeholder="City, State"
                    />
                 </div>

                 <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery Date</label>
                    <input 
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6600] outline-none"
                      value={newEventData.editEstimatedDelivery}
                      onChange={(e) => setNewEventData({...newEventData, editEstimatedDelivery: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">Modify if schedule has changed</p>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6600] outline-none h-24 resize-none"
                  value={newEventData.description}
                  onChange={(e) => setNewEventData({...newEventData, description: e.target.value})}
                  placeholder="Details about the event..."
                />
              </div>

              <div className="flex items-center gap-2">
                 <input 
                    type="checkbox" 
                    id="useAI" 
                    checked={newEventData.useAI} 
                    onChange={e => setNewEventData({...newEventData, useAI: e.target.checked})}
                    className="w-4 h-4 text-[#FF6600] rounded focus:ring-[#FF6600] border-gray-300"
                 />
                 <label htmlFor="useAI" className="text-sm text-gray-700 flex items-center gap-1 cursor-pointer select-none">
                   <Sparkles className="w-3 h-3 text-indigo-500" />
                   Generate professional message using AI
                 </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsUpdateModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
                <button 
                    type="submit" 
                    disabled={isProcessingAI}
                    className="px-4 py-2 bg-[#FF6600] text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                    {isProcessingAI ? 'Generating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;