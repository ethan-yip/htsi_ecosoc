import { Icon } from '@iconify/react';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import { FOCUS_COLOR, ROLE_COLOR, CONSTRAINT_COLOR } from '../lib/map/clusterEntries';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  labels: {
    ROLE_LABELS: Record<string, string>;
    FOCUS_LABELS: Record<string, string>;
    CONSTRAINT_LABELS: Record<string, string>;
  };
  countries: string[];
}

export interface FilterState {
  showArcs: boolean;
  colorBy: 'focus' | 'role' | 'constraint';
  selectedCountries: string[];
  selectedRoles: string[];
  selectedConstraints: string[];
  selectedFocusAreas: string[];
}

export function FilterModal({ isOpen, onClose, filters, setFilters, labels, countries }: FilterModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      gsap.fromTo(modalRef.current, { y: '100dvh', opacity: 0 }, { y: '0', opacity: 1, duration: 0.5, ease: 'power3.out' });
    }
  }, [isOpen]);

  const handleClose = () => {
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(modalRef.current, { y: '100dvh', opacity: 0, duration: 0.4, ease: 'power3.in' })
      .to(overlayRef.current, { opacity: 0, duration: 0.2 }, '-=0.2');
  };

  const toggleItem = (list: string[], item: string, key: keyof FilterState) => {
    const newList = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
    setFilters({ ...filters, [key]: newList });
  };

  if (!isOpen) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div ref={modalRef} className="relative w-full max-w-2xl max-h-[90dvh] rounded-[24px] bg-[#2a080e] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icon icon="mdi:filter-variant" className="h-6 w-6 text-[#B14242]" />
            Filters
          </h2>
          <button onClick={handleClose} className="text-white/50 hover:text-white transition-colors">
            <Icon icon="mdi:close" className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-7 custom-scrollbar">
          {/* Visualization Settings */}
          <section className="space-y-3.5">
            <p className="text-sm font-bold text-[#b3b3b3]">Visualization</p>
            <div className="flex flex-col md:flex-row gap-7">
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#b3b3b3]">Color Code By</p>
                <div className="flex flex-wrap gap-2">
                  {(['focus', 'role', 'constraint'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setFilters({ ...filters, colorBy: mode })}
                      className={`w-fit max-w-full rounded-[15px] px-4 py-2.5 text-center text-sm font-medium transition-all ${
                        filters.colorBy === mode 
                          ? 'bg-[#B14242] text-white shadow-lg' 
                          : 'bg-[rgba(255,255,255,0.1)] text-[#cfcfcf] hover:bg-[rgba(255,255,255,0.15)]'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#b3b3b3]">Display Options</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, showArcs: !filters.showArcs })}
                    className={`w-fit max-w-full rounded-[15px] px-4 py-2.5 text-center text-sm font-medium transition-all flex items-center gap-2 ${
                      filters.showArcs 
                        ? 'bg-[#B14242] text-white shadow-lg' 
                        : 'bg-[rgba(255,255,255,0.1)] text-[#cfcfcf] hover:bg-[rgba(255,255,255,0.15)]'
                    }`}
                  >
                    <Icon icon={filters.showArcs ? "mdi:eye" : "mdi:eye-off"} className="h-4 w-4" />
                    Show Connection Arcs
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Categorical Filters */}
          <FilterSection 
            title="Focus Areas" 
            items={labels.FOCUS_LABELS} 
            selected={filters.selectedFocusAreas} 
            onToggle={(id) => toggleItem(filters.selectedFocusAreas, id, 'selectedFocusAreas')}
            colors={FOCUS_COLOR}
          />

          <div className="flex flex-col gap-7">
            <FilterSection 
              title="Role Types" 
              items={labels.ROLE_LABELS} 
              selected={filters.selectedRoles} 
              onToggle={(id) => toggleItem(filters.selectedRoles, id, 'selectedRoles')}
              colors={ROLE_COLOR}
            />
            <FilterSection 
              title="Constraints" 
              items={labels.CONSTRAINT_LABELS} 
              selected={filters.selectedConstraints} 
              onToggle={(id) => toggleItem(filters.selectedConstraints, id, 'selectedConstraints')}
              colors={CONSTRAINT_COLOR}
            />
          </div>

          <section className="space-y-2">
            <p className="text-sm font-bold text-[#b3b3b3]">Countries</p>
            <div className="flex flex-wrap gap-2">
              {countries.sort().map(country => {
                const isSelected = filters.selectedCountries.includes(country);
                return (
                  <button
                    key={country}
                    onClick={() => toggleItem(filters.selectedCountries, country, 'selectedCountries')}
                    className={`w-fit max-w-full rounded-[15px] px-4 py-2.5 text-center text-sm font-medium transition-all ${
                      isSelected 
                        ? 'bg-[#B14242] text-white shadow-lg' 
                        : 'bg-[rgba(255,255,255,0.1)] text-[#cfcfcf] hover:bg-[rgba(255,255,255,0.15)]'
                    }`}
                  >
                    {country}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-white/10 bg-black/20 shrink-0 flex gap-3">
          <button
            onClick={() => setFilters({
              showArcs: true,
              colorBy: 'focus',
              selectedCountries: [],
              selectedRoles: [],
              selectedConstraints: [],
              selectedFocusAreas: []
            })}
            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm font-bold transition-all"
          >
            Reset All
          </button>
          <button
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl bg-[#B14242] hover:bg-[#a13b3b] text-white font-bold transition-all shadow-lg active:scale-[0.98]"
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, items, selected, onToggle, colors }: { title: string, items: Record<string, string>, selected: string[], onToggle: (id: string) => void, colors?: Record<string, string> }) {
  return (
    <section className="space-y-2">
      <p className="text-sm font-bold text-[#b3b3b3]">{title}</p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(items).map(([id, label]) => {
          const isSelected = selected.includes(id);
          return (
            <button
              key={id}
              onClick={() => onToggle(id)}
              className={`w-fit max-w-full rounded-[15px] px-4 py-2.5 text-center text-sm font-medium transition-all flex items-center gap-2 ${
                isSelected 
                  ? 'bg-[#B14242] text-white shadow-lg' 
                  : 'bg-[rgba(255,255,255,0.1)] text-[#cfcfcf] hover:bg-[rgba(255,255,255,0.15)]'
              }`}
            >
              {colors && colors[id] && (
                <div 
                  className={`h-2 w-2 rounded-full shrink-0 transition-transform ${isSelected ? 'scale-110' : ''}`} 
                  style={{ backgroundColor: colors[id] }} 
                />
              )}
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
