'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Input, Select, SelectItem } from "@heroui/react";
import { 
  PieChart, 
  Pie,
  Cell,
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { 
  Calculator as CalcIcon, 
  Plus, 
  Trash2, 
  Info,
  X,
  ChevronDown,
  LayoutDashboard,
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { 
  CATEGORIES,
  calculateScore,
  CHART_COLORS,
  ANALYSIS_CHARTS,
  SIMULATION_CHARTS,
  INITIAL_DATA,
  RESULT_TYPES
} from './calculatorData';


const CategoryButton = ({ cat, isActive, onAdd, onRemove }) => {
  const [isDeleteHovered, setIsDeleteHovered] = useState(false);

  if (isActive) {
    return (
      <button
        onClick={() => onRemove(cat.id)}
        onMouseEnter={() => setIsDeleteHovered(false)}
        className={`group relative flex items-center justify-center gap-2 px-8 py-5 rounded-2xl font-bold transition-all border-2 overflow-hidden min-w-40 ${
          isDeleteHovered 
            ? 'bg-red-500 border-red-500 text-white' 
            : 'bg-green-50 border-primary-green text-primary-green'
        }`}
      >
        <span className={`flex items-center gap-2 transition-all duration-300 ${isDeleteHovered ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}>
          <cat.icon className="w-5 h-5" />
          {cat.name}
        </span>
        
        {/* Sure to Remove? Text */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 pointer-events-none ${isDeleteHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <span className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Sure to Remove?
          </span>
        </div>

        {/* Top-right X button */}
        <div 
          className={`absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full border transition-all ${
            isDeleteHovered 
              ? 'bg-white/20 border-white/40 text-white' 
              : 'bg-white border-primary-green/20 text-primary-green shadow-sm'
          }`}
          onMouseEnter={(e) => {
            e.stopPropagation();
            setIsDeleteHovered(true);
          }}
          onMouseLeave={() => setIsDeleteHovered(false)}
        >
          <X className="w-3 h-3" />
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => onAdd(cat.id)}
      className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold bg-white border-2 border-primary-green/20 text-primary-green hover:border-primary-green hover:bg-green-50 shadow-sm transition-all active:scale-95"
    >
      <cat.icon className="w-5 h-5" />
      {cat.name}
    </button>
  );
};

export default function Calculator() {
  const [activeSelections, setActiveSelections] = useState([]);
  const [data, setData] = useState(INITIAL_DATA);

  const [simulationData, setSimulationData] = useState(INITIAL_DATA);

  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategoryExpansion = (id) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };


  const totalScore = useMemo(() => calculateScore(data, activeSelections), [data, activeSelections]);
  const simTotalScore = useMemo(() => calculateScore(simulationData, activeSelections), [simulationData, activeSelections]);

  const dailyFootprint = totalScore.dailyFootprint || "0.00";
  const simDailyFootprint = simTotalScore.dailyFootprint || "0.00";

  const analysisChartsData = useMemo(() => {
    return Object.values(ANALYSIS_CHARTS).reduce((acc, chart) => {
      acc[chart.id] = chart.getData(data, activeSelections);
      return acc;
    }, {});
  }, [data, activeSelections]);

  const simulationChartsData = useMemo(() => {
    return Object.values(SIMULATION_CHARTS).reduce((acc, chart) => {
      acc[chart.id] = chart.getData(data, simulationData, activeSelections);
      return acc;
    }, {});
  }, [data, simulationData, activeSelections]);

  const addCategory = (id) => {
    if (!activeSelections.includes(id)) {
      setActiveSelections([...activeSelections, id]);
    }
  };

  const removeCategory = (id) => {
    setActiveSelections(activeSelections.filter(item => item !== id));
  };

  const updateValue = (catId, inputId, val) => {
    setData(prev => ({
      ...prev,
      [catId]: { ...prev[catId], [inputId]: val }
    }));
    // Also update simulationData when original data changes to keep them in sync
    // unless the user is specifically interacting with simulation controls
    setSimulationData(prev => ({
      ...prev,
      [catId]: { ...prev[catId], [inputId]: val }
    }));
  };

  const updateSimValue = (catId, inputId, val) => {
    setSimulationData(prev => ({
      ...prev,
      [catId]: { ...prev[catId], [inputId]: val }
    }));
  };

  const isAnalysisVisible = useMemo(() => {
    return activeSelections.length > 0 && parseFloat(dailyFootprint) > 0;
  }, [activeSelections, dailyFootprint]);

  const [showPopup, setShowPopup] = useState(false);
  const inputSectionRef = useRef(null);
  const analysisSectionRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!inputSectionRef.current || !analysisSectionRef.current) return;

      const inputRect = inputSectionRef.current.getBoundingClientRect();
      const simulationSection = document.getElementById('simulation-section');
      const simulationRect = simulationSection?.getBoundingClientRect();
      
      const reachedEndOfInput = inputRect.bottom <= window.innerHeight + 100;
      const reachedSimulation = simulationRect ? simulationRect.top <= window.innerHeight - 100 : false;

      // Show popup if analysis is visible and we've reached the end of inputs, 
      // but haven't reached the simulation section yet
      setShowPopup(isAnalysisVisible && reachedEndOfInput && !reachedSimulation);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAnalysisVisible]);

  return (
    <div className="max-w-350 mx-auto py-16 px-4 relative">
      <div className="grid xl:grid-cols-12 gap-8 items-start">
        {/* Sidebar Navigation - Fixed width column on XL screens */}
        <div className="hidden xl:block xl:col-span-2 sticky top-24">
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 px-4">Navigation</h4>
            <button 
              onClick={() => document.getElementById('input-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-green-50 transition-all text-gray-500 hover:text-primary-green text-left w-full"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-primary-green/10 flex items-center justify-center transition-colors shrink-0">
                <ClipboardList className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm">Info Input</span>
            </button>

            <button 
              onClick={() => isAnalysisVisible && document.getElementById('analysis-section')?.scrollIntoView({ behavior: 'smooth' })}
              disabled={!isAnalysisVisible}
              className={`group flex items-center gap-3 p-3 rounded-2xl transition-all text-left w-full ${
                isAnalysisVisible 
                  ? 'hover:bg-skyblue-50 text-gray-500 hover:text-primary-skyblue' 
                  : 'opacity-40 cursor-not-allowed text-gray-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                isAnalysisVisible ? 'bg-gray-100 group-hover:bg-primary-skyblue/10' : 'bg-gray-50'
              }`}>
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm truncate">Impact Analysis</span>
                {!isAnalysisVisible && <span className="text-[9px] font-black uppercase tracking-tighter text-gray-500/80">Inactive</span>}
              </div>
            </button>

            <button 
              onClick={() => isAnalysisVisible && document.getElementById('simulation-section')?.scrollIntoView({ behavior: 'smooth' })}
              disabled={!isAnalysisVisible}
              className={`group flex items-center gap-3 p-3 rounded-2xl transition-all text-left w-full ${
                isAnalysisVisible 
                  ? 'hover:bg-amber-50 text-gray-500 hover:text-amber-500' 
                  : 'opacity-40 cursor-not-allowed text-gray-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                isAnalysisVisible ? 'bg-gray-100 group-hover:bg-amber-500/10' : 'bg-gray-50'
              }`}>
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm truncate">What if? Scenario</span>
                {!isAnalysisVisible && <span className="text-[9px] font-black uppercase tracking-tighter text-gray-500/80">Inactive</span>}
              </div>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="xl:col-span-10">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-black text-primary-green mb-4">Impact Builder</h1>
            <p className="text-gray-500 text-xl max-w-2xl mx-auto">
              Add data points to build your environmental profile. You can add or remove any type of information.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-start" id="input-section" ref={inputSectionRef}>
            {/* Middle: Category Selection & Inputs */}
            <div className="lg:col-span-8 space-y-10">
          
          {/* Add more info section */}
          <section>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add information to your profile
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.values(CATEGORIES).map(cat => (
                <CategoryButton
                  key={cat.id}
                  cat={cat}
                  isActive={activeSelections.includes(cat.id)}
                  onAdd={addCategory}
                  onRemove={removeCategory}
                />
              ))}
            </div>
          </section>

          {/* Active Inputs */}
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {activeSelections.map(id => {
                const config = CATEGORIES[id];
                return (
                  <motion.div 
                    key={id} 
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="group bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden"
                  >
                    {/* Header with Title and Remove Button */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-primary-green">
                          <config.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-gray-800">{config.name}</h4>
                          <p className="text-xs text-gray-400">{config.description}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeCategory(id)}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-full border border-gray-100 shadow-sm outline-none"
                        title="Remove category"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4 pt-2">
                      {config.inputs.map((input) => {
                        if (input.isExtendable && !expandedCategories[id]) return null;
                        
                        return (
                          <div key={input.id} className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-primary-green/60 ml-1">
                              {input.name}
                            </label>
                            {input.renderInput === 'Select' && (
                              <Select
                                labelPlacement="outside"
                                label={null}
                                placeholder="Select an option"
                                className="w-full"
                                variant="bordered"
                                color="success"
                                selectedKeys={data[id][input.id] ? [String(data[id][input.id])] : []}
                                onSelectionChange={(keys) => {
                                  const val = Array.from(keys)[0];
                                  if (val !== undefined) {
                                    updateValue(id, input.id, val);
                                  }
                                }}
                                disableAnimation={false}
                                scrollShadowProps={{ isEnabled: false }}
                                popoverProps={{
                                  classNames: {
                                    content: "bg-white border border-gray-100 shadow-xl rounded-2xl",
                                  }
                                }}
                                classNames={{
                                  trigger: "bg-white border-2 border-gray-100 hover:border-primary-green hover:bg-green-50/30 transition-all rounded-2xl h-14 pl-4 pr-10 shadow-sm group-data-[focus=true]:border-primary-green group-data-[focus=true]:ring-0 outline-none",
                                  value: "font-bold text-gray-700 pl-2",
                                  innerWrapper: "gap-2",
                                  listbox: "bg-white p-2 gap-2",
                                  selectorIcon: "right-4",
                                }}
                              >
                                {input.options.map((opt) => (
                                  <SelectItem 
                                    key={opt.value} 
                                    value={opt.value}
                                    className="data-[hover=true]:bg-green-50 data-[hover=true]:text-primary-green transition-colors rounded-xl font-bold text-gray-700"
                                  >
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </Select>
                            )}

                            {input.renderInput === 'Input' && (
                              <Input
                                type="number"
                                labelPlacement="outside"
                                label={null}
                                placeholder={input.placeholder}
                                value={String(data[id][input.id] || '')}
                                onValueChange={(val) => updateValue(id, input.id, val)}
                                variant="bordered"
                                color="success"
                                endContent={
                                  <span className="text-xs font-black text-primary-green bg-green-50 px-3 py-1 rounded-lg ml-3 whitespace-nowrap min-w-fit">
                                    {input.unit}
                                  </span>
                                }
                                classNames={{
                                  inputWrapper: "bg-white border-2 border-gray-100 hover:border-primary-green group-data-[focus=true]:border-primary-green transition-all rounded-2xl h-14 shadow-sm group-data-[focus=true]:ring-0 outline-none",
                                  input: "font-bold text-gray-700 text-base outline-none",
                                }}
                              />
                            )}
                          </div>
                        );
                      })}

                      {config.inputs.some(i => i.isExtendable) && (
                        <button
                          onClick={() => toggleCategoryExpansion(id)}
                          className="w-full py-2 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary-green transition-colors group"
                        >
                          {expandedCategories[id] ? (
                            <>Show Less <ChevronDown className="w-4 h-4 rotate-180 transition-transform" /></>
                          ) : (
                            <>Show More Specifics <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" /></>
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {activeSelections.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-gray-50 rounded-4xl border-2 border-dashed border-gray-200"
              >
                <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-300">
                  <Plus className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-400 mb-2">Your profile is empty</h3>
                <p className="text-gray-400 max-w-xs mx-auto">Select a category above to start calculating your environmental footprint.</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Side: Real-time Result */}
        <div className="lg:col-span-4 sticky top-24">
          <div className="bg-primary-skyblue p-10 rounded-[2.5rem] text-white shadow-2xl shadow-primary-skyblue/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <CalcIcon className="w-32 h-32" />
            </div>

            <div className="relative z-10">
              <div className="space-y-8">
                {RESULT_TYPES.map((type) => (
                  <div key={type.id}>
                    <h2 className="text-sm font-black uppercase tracking-widest mb-2 opacity-80">{type.name}</h2>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-7xl font-black">{totalScore[type.id] || "0.00"}</span>
                      <span className="text-xl font-bold opacity-80">{type.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-blue-100 mt-4 mb-8 font-medium">Updated in real-time</p>

                  <div className="space-y-4">
                    <div className="bg-white/20 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                      <h4 className="font-bold mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Insight
                      </h4>
                      <div className="text-sm leading-relaxed opacity-90">
                        {dailyFootprint === "0.00" 
                          ? "Start adding your daily habits to see your impact calculation." 
                          : parseFloat(dailyFootprint) < 5 
                          ? "Great job! Your current profile indicates a low environmental impact. Keep it up!"
                          : "Your footprint is currently above the average. Try adding more detailed info or adjusting your habits to see how it changes."}
                      </div>
                    </div>

                    <div className="text-[10px] opacity-60 uppercase tracking-tighter font-bold flex justify-between">
                      <span>* Data points active: {activeSelections.length}</span>
                      {activeSelections.length > 0 && (
                        <button 
                          onClick={() => {
                            setActiveSelections([]);
                            setData(INITIAL_DATA);
                            setSimulationData(INITIAL_DATA);
                          }}
                          className="hover:text-red-200 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Clear all
                        </button>
                      )}
                    </div>
                  </div>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-primary-green shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Calculations are based on global average emission factors. For more specific school-related data, check our 
              <Link href="/posts" className="text-primary-skyblue font-bold ml-1 hover:underline">Research section</Link>.
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      <AnimatePresence>
        {isAnalysisVisible && (
          <motion.div
            ref={analysisSectionRef}
            id="analysis-section"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="mt-20 pt-20 border-t border-gray-100"
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-primary-green mb-4">Impact Analysis</h2>
              <p className="text-gray-500 text-lg">Detailed breakdown and global comparison of your footprint.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {Object.values(ANALYSIS_CHARTS).map(chart => (
                <div key={chart.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                    <div className={`w-2 h-6 ${chart.accentColor} rounded-full`} />
                    {chart.title}
                  </h3>
                  <div className="h-75 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {chart.type === 'pie' ? (
                        <PieChart>
                          <Pie
                            data={analysisChartsData[chart.id]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analysisChartsData[chart.id].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => [`${value} kg CO2e`, 'Impact']}
                          />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      ) : (
                        <BarChart data={analysisChartsData[chart.id]}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip 
                            cursor={{ fill: '#f8fafb' }}
                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar 
                            dataKey="value" 
                            radius={[10, 10, 10, 10]} 
                            barSize={40}
                          >
                            {analysisChartsData[chart.id].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                  {chart.footer && <p className="mt-4 text-xs text-gray-400 text-center italic">{chart.footer}</p>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
          </AnimatePresence>

          {/* Simulation Section */}
          <AnimatePresence>
            {isAnalysisVisible && (
              <motion.div
                id="simulation-section"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                className="mt-20 pt-20 border-t border-gray-100"
              >
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-black text-amber-500 mb-4 flex items-center justify-center gap-3">
                    <Sparkles className="w-8 h-8" />
                    &quot;What If&quot; Scenario Simulation
                  </h2>
                  <p className="text-gray-500 text-lg">Adjust your habits to see how changes would affect your total environmental impact.</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-12 items-start">
                  {/* Left: Simulation Controls */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                      <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-8 flex items-center gap-2">
                        Adjust Your Choices
                      </h3>
                      <div className="space-y-8">
                        {activeSelections.map(id => {
                          const config = CATEGORIES[id];
                          
                          return (
                            <div key={`sim-${id}`} className="space-y-6">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-amber-500">
                                  <config.icon className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="font-bold text-gray-800">{config.name}</p>
                                  <p className="text-xs text-gray-500">{config.description}</p>
                                </div>
                              </div>

                              <div className="grid gap-6 ml-4 pl-4 border-l-2 border-amber-100">
                                {config.inputs.map(input => {
                                  if (input.isExtendable && !expandedCategories[id]) return null;
                                  const value = simulationData[id][input.id];

                                  return (
                                    <div key={`sim-input-${input.id}`} className="space-y-3">
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs font-black uppercase tracking-widest text-amber-600/60">
                                          {input.name}
                                        </span>
                                        <span className="text-sm font-black text-amber-600">
                                          {input.renderSimulation === 'Options' 
                                            ? input.options.find(o => o.value === (value?.toString() || ''))?.label || 'Not selected'
                                            : `${value || 0} ${input.unit}`}
                                        </span>
                                      </div>

                                      {input.renderSimulation === 'Options' && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                          {input.options.map(opt => (
                                            <button
                                              key={opt.value}
                                              onClick={() => updateSimValue(id, input.id, opt.value)}
                                              className={`py-2 px-3 rounded-xl text-[10px] font-bold transition-all border-2 ${
                                                value === opt.value
                                                  ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                                                  : 'bg-white border-gray-100 text-gray-500 hover:border-amber-200'
                                              }`}
                                            >
                                              {opt.label}
                                            </button>
                                          ))}
                                        </div>
                                      )}

                                      {input.renderSimulation === 'Slider' && (
                                        <div className="relative pt-2">
                                          <input
                                            type="range"
                                            min="0"
                                            max={Math.max(data[id][input.id] * 2, 100)}
                                            step={input.unit === 'Liters / day' ? '10' : '1'}
                                            value={value}
                                            onChange={(e) => updateSimValue(id, input.id, parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                          />
                                          <div className="flex justify-between text-[8px] text-gray-400 mt-1 font-bold uppercase tracking-tighter">
                                            <span>0 {input.unit}</span>
                                            <span>Baseline: {data[id][input.id]}</span>
                                            <span>Max {Math.max(data[id][input.id] * 2, 100)}</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {config.inputs.some(i => i.isExtendable) && (
                                  <button
                                    onClick={() => toggleCategoryExpansion(id)}
                                    className="w-full py-2 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-amber-500 transition-colors group mt-2"
                                  >
                                    {expandedCategories[id] ? (
                                      <>Show Less <ChevronDown className="w-4 h-4 rotate-180 transition-transform" /></>
                                    ) : (
                                      <>Show More Specifics <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" /></>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right: Simulation Result */}
                  <div className="lg:col-span-5 space-y-6 sticky top-24">
                    <div className="bg-amber-500 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-amber-500/20 overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                        <Sparkles className="w-32 h-32" />
                      </div>

                      <div className="relative z-10">
                        <div className="space-y-8 mb-8">
                          {RESULT_TYPES.map((type) => (
                            <div key={`sim-res-${type.id}`}>
                              <h2 className="text-sm font-black uppercase tracking-widest mb-2 opacity-80">Simulated {type.name}</h2>
                              <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-7xl font-black">{simTotalScore[type.id] || "0.00"}</span>
                                <span className="text-xl font-bold opacity-80">{type.unit}</span>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1 ${
                                  parseFloat(simTotalScore[type.id] || 0) <= parseFloat(totalScore[type.id] || 0) 
                                    ? 'bg-green-400/30 text-green-50' 
                                    : 'bg-red-400/30 text-red-50'
                                }`}>
                                  {parseFloat(simTotalScore[type.id] || 0) <= parseFloat(totalScore[type.id] || 0) ? (
                                    <>Reduction: {(parseFloat(totalScore[type.id] || 0) - parseFloat(simTotalScore[type.id] || 0)).toFixed(2)} {type.unit.split(' ')[0]}</>
                                  ) : (
                                    <>Increase: {(parseFloat(simTotalScore[type.id] || 0) - parseFloat(totalScore[type.id] || 0)).toFixed(2)} {type.unit.split(' ')[0]}</>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-6">
                          {Object.values(SIMULATION_CHARTS).map(chart => (
                            <div key={chart.id} className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                              <h4 className="font-bold mb-4 flex items-center gap-2 text-xs uppercase tracking-widest opacity-80">
                                {chart.title}
                              </h4>
                              <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={simulationChartsData[chart.id]} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                    <XAxis 
                                      dataKey={chart.id === 'categoryComparison' ? 'category' : 'name'} 
                                      axisLine={false} 
                                      tickLine={false} 
                                      tick={{ fill: '#fff', fontSize: 8, fontWeight: 'bold' }} 
                                    />
                                    <YAxis 
                                      axisLine={false}
                                      tickLine={false}
                                      tick={{ fill: '#fff', fontSize: 8, fontWeight: 'bold' }}
                                    />
                                    <Tooltip 
                                      contentStyle={{ borderRadius: '1rem', border: 'none', color: '#000', fontSize: '12px' }}
                                      itemStyle={{ fontWeight: 'bold' }}
                                    />
                                    {chart.id === 'totalTrend' && (
                                      <Legend 
                                        verticalAlign="top" 
                                        align="right"
                                        iconType="circle"
                                        wrapperStyle={{ paddingBottom: '20px', fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                      />
                                    )}
                                    <Line 
                                      name={chart.id === 'totalTrend' ? 'Baseline' : 'Original'}
                                      type="monotone" 
                                      dataKey="original" 
                                      stroke="rgba(255,255,255,0.4)" 
                                      strokeWidth={2} 
                                      strokeDasharray="5 5"
                                      dot={{ fill: 'rgba(255,255,255,0.4)', r: 3 }}
                                    />
                                    <Line 
                                      name={chart.id === 'totalTrend' ? 'Projected' : 'Simulated'}
                                      type="monotone" 
                                      dataKey="simulated" 
                                      stroke="#fff" 
                                      strokeWidth={3} 
                                      dot={{ fill: '#fff', r: 4 }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          ))}
                          
                          <button 
                            onClick={() => setSimulationData({...data})}
                            className="w-full py-4 bg-white text-amber-600 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-amber-50 transition-colors shadow-lg"
                          >
                            Reset Simulation
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Reminder Pop-up */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, y: 100, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 100, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-50"
          >
            <button
              onClick={() => document.getElementById('simulation-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-amber-500 text-white px-8 py-5 rounded-full shadow-2xl flex items-center gap-4 hover:scale-105 active:scale-95 transition-all font-bold group border-4 border-white"
            >
              <div className="flex flex-col items-start leading-tight">
                <span className="text-xs opacity-80 uppercase tracking-widest font-black">Data Collected</span>
                <span>Try &quot;What If&quot; Simulation</span>
              </div>
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="bg-white/20 p-2 rounded-full"
              >
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
