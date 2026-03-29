"use client";

import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Navigation, 
  ChevronRight, 
  Search,
  CheckCircle,
  Flag,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Major Indian States and cities for a guided experience
const INDIA_DATA: Record<string, string[]> = {
  // ── 28 STATES ──
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Ziro", "Pasighat", "Along"],
  "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Nagaon", "Tinsukia"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Arrah"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Rajnandgaon", "Jagdalpur"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar"],
  "Haryana": ["Faridabad", "Gurugram", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Solan", "Mandi", "Hamirpur"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi", "Kalaburagi", "Davanagere"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam", "Alappuzha", "Palakkad"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad", "Solapur", "Amravati", "Navi Mumbai"],
  "Manipur": ["Imphal", "Churachandpur", "Thoubal", "Ukhrul"],
  "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongpoh"],
  "Mizoram": ["Aizawl", "Lunglei", "Saiha", "Champhai"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara"],
  "Sikkim": ["Gangtok", "Namchi", "Geyzing", "Mangan"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam"],
  "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailasahar"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Meerut", "Varanasi", "Prayagraj", "Bareilly", "Aligarh"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda"],

  // ── 8 UNION TERRITORIES ──
  "Andaman and Nicobar Islands": ["Port Blair", "Diglipur", "Mayabunder"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "Central Delhi", "West Delhi", "East Delhi"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Kathua"],
  "Ladakh": ["Leh", "Kargil"],
  "Lakshadweep": ["Kavaratti", "Agatti", "Minicoy"],
  "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam"]
};

interface GuidedAddressSelectorProps {
  onSelect: (data: { state: string; city: string; area: string }) => void;
  onClose?: () => void;
  className?: string;
}

export default function GuidedAddressSelector({ onSelect, onClose, className }: GuidedAddressSelectorProps) {
  const [step, setStep] = useState(1); // 1: State, 2: City, 3: Area
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [area, setArea] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const states = Object.keys(INDIA_DATA).filter(s => 
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cities = selectedState ? INDIA_DATA[selectedState].filter(c => 
    c.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
    setSearchQuery("");
    setStep(2);
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setSearchQuery("");
    setStep(3);
  };

  const handleFinalize = () => {
    onSelect({
      state: selectedState,
      city: selectedCity,
      area: area
    });
  };

  return (
    <div className={cn("bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden", className)}>
      <div className="bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shrink-0">
                <Flag className="w-5 h-5" />
             </div>
             <div className="min-w-0">
                <h3 className="text-white font-black text-sm uppercase tracking-widest truncate">Guided Selector</h3>
                <p className="text-white/50 text-[10px] uppercase font-bold tracking-tighter">India Regional Path</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-1">
                {[1, 2, 3].map((i) => (
                   <div 
                     key={i} 
                     className={cn(
                       "w-2 h-2 rounded-full transition-all duration-300",
                       i === step ? "w-6 bg-orange-600" : "bg-white/20"
                     )} 
                   />
                ))}
             </div>
             {onClose && (
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all touch-manipulation"
                >
                   <X className="w-5 h-5" />
                </button>
             )}
          </div>
        </div>

        {step < 3 && (
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input 
                 type="text" 
                 placeholder={step === 1 ? "Search State..." : "Search City..."}
                 className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white text-xs font-bold outline-none focus:border-orange-600/50 transition-all placeholder:text-white/20"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
        )}
      </div>

      <div className="p-4 max-h-[300px] overflow-y-auto no-scrollbar">
         <AnimatePresence mode="wait">
            {step === 1 && (
               <motion.div 
                 key="states" 
                 initial={{ opacity: 0, x: -10 }} 
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 10 }}
                 className="grid grid-cols-1 gap-2"
               >
                  {states.map(state => (
                     <button 
                        key={state}
                        onClick={() => handleStateSelect(state)}
                        className="flex items-center justify-between p-5 rounded-2xl hover:bg-orange-50 border border-transparent hover:border-orange-100 transition-all group touch-manipulation"
                     >
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-orange-600 transition-colors shadow-sm">
                              {state[0]}
                           </div>
                           <span className="text-[13px] font-black text-slate-700 uppercase tracking-tight">{state}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                     </button>
                  ))}
               </motion.div>
            )}

            {step === 2 && (
               <motion.div 
                 key="cities" 
                 initial={{ opacity: 0, x: -10 }} 
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 10 }}
                 className="grid grid-cols-1 gap-2"
               >
                  <button 
                     onClick={() => setStep(1)}
                     className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 flex items-center gap-1"
                  >
                     ← Back to States
                  </button>
                  {cities.map(city => (
                     <button 
                        key={city}
                        onClick={() => handleCitySelect(city)}
                        className="flex items-center justify-between p-4 rounded-2xl hover:bg-orange-50 border border-transparent hover:border-orange-100 transition-all group"
                     >
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-orange-600 transition-colors shadow-sm">
                              <Building2 className="w-4 h-4" />
                           </div>
                           <span className="text-[12px] font-black text-slate-700 uppercase tracking-tight">{city}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                     </button>
                  ))}
               </motion.div>
            )}

            {step === 3 && (
               <motion.div 
                 key="area" 
                 initial={{ opacity: 0, scale: 0.95 }} 
                 animate={{ opacity: 1, scale: 1 }}
                 className="p-2 space-y-4"
               >
                  <div className="space-y-4">
                     <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location Details</span>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <div className="flex items-center gap-2 mb-1">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{selectedState}</span>
                           </div>
                           <div className="text-xl font-black text-slate-900 italic tracking-tighter">
                              {selectedCity}
                           </div>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specific Area / Landmark</label>
                        <div className="relative">
                           <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                           <input 
                              type="text" 
                              placeholder="e.g. Bandra West, Near Metro..."
                              className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 text-xs font-bold outline-none focus:border-orange-600 transition-all placeholder:text-slate-300"
                              value={area}
                              onChange={(e) => setArea(e.target.value)}
                           />
                        </div>
                     </div>

                     <button 
                        onClick={handleFinalize}
                        className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-slate-100 active:scale-95 flex items-center justify-center gap-2"
                     >
                        Sync to Map <MapPin className="w-4 h-4" />
                     </button>
                     
                     <button 
                        onClick={() => setStep(2)}
                        className="w-full py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center"
                     >
                        Change City
                     </button>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
}
