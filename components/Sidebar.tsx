
import React, { useState, useMemo } from 'react';
import { NAVIGATION_ITEMS, NavItem } from '@/lib/constants';
import { LogOut, ChevronDown, ChevronRight } from 'lucide-react';
import { User, UserRole } from '@/lib/types';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout?: () => void;
  user: User;
}

const SotkonLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 60" className={className} xmlns="http://www.w3.org/2000/svg">
    <g fill="white" fontWeight="900" fontFamily="Inter, sans-serif">
      <text x="0" y="38" fontSize="42">s</text>
      <circle cx="56" cy="33" r="12" stroke="#92c83e" strokeWidth="8" fill="none" />
      <rect x="63" y="15" width="10" height="7" fill="#92c83e" rx="1" transform="rotate(-15 63 15)" />
      <text x="82" y="38" fontSize="42">tkon</text>
    </g>
    <text x="82" y="55" fill="#999" fontSize="14" fontWeight="400" fontFamily="Inter, sans-serif" letterSpacing="1">
      waste systems
    </text>
  </svg>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, onLogout, user }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Produção': true,
  });

  const toggleSection = (label: string) => {
    setExpandedSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const filteredNavItems = useMemo(() => {
    if (user.role === UserRole.ADMIN) return NAVIGATION_ITEMS;
    return NAVIGATION_ITEMS.map(item => {
      if (item.path === '/') return item;
      if (item.children) {
        const allowedChildren = item.children.filter(child => 
          ['/encomendas', '/planeamento'].includes(child.path)
        );
        if (allowedChildren.length > 0) return { ...item, children: allowedChildren };
        return null;
      }
      return null;
    }).filter(Boolean) as NavItem[];
  }, [user.role]);

  const isChildActive = (item: NavItem) => {
    return item.children?.some(child => child.path === currentPath);
  };

  return (
    <div className="w-64 bg-[#1a1a1a] h-screen border-r border-[#333] flex flex-col fixed left-0 top-0 z-50 shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-[#333] bg-[#1a1a1a]">
        <div className="flex flex-col gap-2">
          <SotkonLogo className="h-10 w-auto" />
          <div className="flex items-center gap-2 mt-2">
            <div className="h-[1px] flex-1 bg-blue-600/30"></div>
            <span className="text-[8px] font-black text-blue-500 tracking-[0.4em] uppercase">LOGISTICS</span>
            <div className="h-[1px] flex-1 bg-blue-600/30"></div>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
        {filteredNavItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedSections[item.label];
          const isActive = currentPath === item.path || isChildActive(item);

          return (
            <div key={item.label} className="mb-1">
              {hasChildren ? (
                <div>
                  <button
                    onClick={() => toggleSection(item.label)}
                    className={`w-full flex items-center justify-between px-6 py-2.5 transition-all text-left group ${
                      isActive ? 'text-white' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`${isActive ? 'text-blue-500' : 'text-blue-500/70'}`}>{item.icon}</span>
                      <span className="font-black text-[11px] uppercase tracking-widest">{item.label}</span>
                    </div>
                    {isExpanded ? <ChevronDown size={14} className="text-white/50" /> : <ChevronRight size={14} className="text-white/50" />}
                  </button>
                  
                  {isExpanded && (
                    <div className="bg-black/30 py-1 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                      {item.children?.map(child => {
                        const isChildActive = currentPath === child.path;
                        return (
                          <button
                            key={child.path}
                            onClick={() => onNavigate(child.path)}
                            className={`w-full flex items-center gap-3 pl-14 pr-6 py-2 transition-all text-left relative ${
                              isChildActive 
                                ? 'text-blue-500 font-bold' 
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {isChildActive && (
                              <div className="absolute left-10 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                            )}
                            <span className="text-[10px] font-bold uppercase tracking-wider">{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onNavigate(item.path!)}
                  className={`w-full flex items-center gap-3 px-6 py-2.5 transition-all text-left group ${
                    currentPath === item.path 
                      ? 'bg-blue-600/10 text-white border-r-4 border-blue-600' 
                      : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className={`${currentPath === item.path ? 'text-blue-500' : 'text-blue-500/70'}`}>{item.icon}</span>
                  <span className="font-black text-[11px] uppercase tracking-widest">{item.label}</span>
                </button>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-6 border-t border-[#333] bg-[#161616] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20 flex items-center justify-center text-white font-black text-xs border border-blue-400/20 shrink-0">
            {user.avatar || user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-black text-white truncate uppercase">{user.name}</p>
            <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">{user.role}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 text-white/50 hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
