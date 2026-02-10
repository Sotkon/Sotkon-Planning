
import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, AlertCircle, Info, Loader2 } from 'lucide-react';
import { Carga, cargaToLoadOrder, LoadOrder } from '@/lib/types';

const ShopfloorView: React.FC = () => {
  const [activeJobs, setActiveJobs] = useState<LoadOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCargas = async () => {
      try {
        const response = await fetch('/api/cargas');
        if (response.ok) {
          const cargas: Carga[] = await response.json();
          // Filtrar cargas com estado "AGENDADA" (estadoId = 3) para mostrar como jobs ativos
          const loadOrders = cargas
            .filter(c => c.estadoId === 3)
            .map(cargaToLoadOrder)
            .slice(0, 4);
          setActiveJobs(loadOrders);
        }
      } catch (error) {
        console.error('Error fetching cargas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCargas();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full overflow-y-auto pb-24">
      <div className="flex justify-between items-center border-l-4 border-blue-600 pl-6 bg-blue-600/5 py-4 rounded-r-xl">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Shopfloor Control</h2>
          <p className="text-blue-400 font-mono text-sm tracking-widest">STATION_ID: SOT-A1</p>
        </div>
        <div className="text-right px-8">
          <p className="text-gray-500 text-xs font-bold uppercase mb-1">Output</p>
          <p className="text-4xl font-bold text-emerald-500 tracking-tighter">98.2%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          <div className="col-span-2 flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : activeJobs.length === 0 ? (
          <div className="col-span-2 text-center py-20 text-gray-500">
            Sem jobs ativos de momento.
          </div>
        ) : null}
        {!loading && activeJobs.map((job) => (
          <div key={job.id} className="bg-[#1a1a1a] border-2 border-[#333] rounded-3xl p-8 flex flex-col justify-between hover:border-blue-600/50 transition-all duration-300">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-3xl font-bold text-white uppercase">{job.client}</h3>
                  <p className="text-gray-500 font-mono text-sm">{job.orderNumber}</p>
                </div>
                <div className="p-4 bg-[#252525] rounded-2xl border border-[#333]">
                  <Info className="text-gray-500" size={24} />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-gray-400 text-sm font-bold uppercase">Progress</span>
                    <span className="text-white text-xl font-black tracking-tighter">{job.progress}%</span>
                  </div>
                  <div className="h-6 bg-black rounded-full overflow-hidden border border-[#333]">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-1000 animate-pulse" 
                      style={{ width: `${job.progress}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button className="flex-1 bg-rose-600/10 text-rose-500 border border-rose-600/20 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-rose-600 hover:text-white transition-all">
                <Square size={20} /> PARAR
              </button>
              <button className="flex-1 bg-amber-600/10 text-amber-500 border border-amber-600/20 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-amber-600 hover:text-white transition-all">
                <Pause size={20} /> PAUSAR
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-rose-900/10 border-2 border-rose-500/20 p-6 rounded-2xl flex items-center gap-6">
        <div className="bg-rose-500 p-4 rounded-full text-white animate-bounce">
          <AlertCircle size={32} />
        </div>
        <div>
          <h4 className="text-xl font-bold text-white">ALERTA</h4>
          <p className="text-rose-400 font-medium">Manutenção agendada para daqui a 15 minutos.</p>
        </div>
      </div>
    </div>
  );
};

export default ShopfloorView;
