
import React, { useState } from 'react';
import { ShieldCheck, CheckSquare, Camera, Save } from 'lucide-react';

const AutocontroloView: React.FC = () => {
  const [checks, setChecks] = useState({
    packaging: false,
    weight_match: false,
    labels: false,
    sealed: false,
  });

  const toggleCheck = (id: keyof typeof checks) => {
    setChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const progress = (Object.values(checks).filter(Boolean).length / Object.values(checks).length) * 100;

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto pb-24">
      <div className="mb-10 text-center">
        <ShieldCheck size={48} className="mx-auto text-emerald-500 mb-4" />
        <h2 className="text-3xl font-bold text-white">Autocontrolo</h2>
        <p className="text-gray-500 mt-2">Validação de conformidade antes da expedição.</p>
      </div>

      <div className="bg-[#1a1a1a] border border-[#333] rounded-3xl p-8 space-y-8 shadow-2xl">
        <div className="flex justify-between items-center bg-[#252525] p-6 rounded-2xl border border-[#333]">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Carga</p>
            <p className="text-2xl font-black text-white">SOT-20240042</p>
          </div>
          <div className="text-right">
             <p className="text-xs font-bold text-emerald-500 mb-1">CONFORMIDADE</p>
             <p className="text-2xl font-bold text-white">{progress}%</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { id: 'packaging', label: 'Integridade da Embalagem' },
            { id: 'weight_match', label: 'Conferência de Peso' },
            { id: 'labels', label: 'Rotulagem QR/Barcode' },
            { id: 'sealed', label: 'Selagem de Segurança' },
          ].map((item) => (
            <div 
              key={item.id}
              onClick={() => toggleCheck(item.id as keyof typeof checks)}
              className={`p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex items-center justify-between group ${
                checks[item.id as keyof typeof checks] 
                ? 'border-emerald-500/50 bg-emerald-500/5' 
                : 'border-[#333] hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl border-2 ${
                  checks[item.id as keyof typeof checks] ? 'bg-emerald-500 border-emerald-500' : 'border-[#444]'
                }`}>
                  <CheckSquare className={checks[item.id as keyof typeof checks] ? 'text-white' : 'text-[#444]'} />
                </div>
                <p className="text-white font-bold">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button className="flex-1 bg-[#252525] hover:bg-[#333] border border-[#444] p-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2">
            <Camera size={20} /> Foto
          </button>
          <button 
            disabled={progress < 100}
            className={`flex-[2] p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              progress === 100 ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            <Save size={20} /> Finalizar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutocontroloView;
