"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  DownloadCloud, 
  FileText, 
  FileSpreadsheet, 
  Printer, 
  TrendingUp,
  Calendar,
  Users,
  Utensils,
  Truck,
  Scale
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { toast } from "sonner";
import { Skeleton } from "boneyard-js/react";
import { DonutChart } from "@/components/donut-chart";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/line-charts-6";
import { format } from "date-fns";

interface ReportData {
  summary: {
    totalDonations: number;
    activeDonations: number;
    totalPickups: number;
    completedPickups: number;
    newUsers: number;
    totalWeight: number;
  };
  donations: any[];
  pickups: any[];
  users: any[];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const YEARS = [2024, 2025, 2026, 2027];

export default function DataReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  const printRef = useRef<HTMLDivElement>(null);

  const fetchReportData = async (month: number, year: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/data-reports?month=${month}&year=${year}`);
      if (!res.ok) throw new Error("Failed to fetch report data");
      const json = await res.json();
      setData(json);
    } catch (error) {
      toast.error("Failed to load report data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  const handleDownloadCSV = (dataset: any[], filename: string) => {
    if (!dataset || dataset.length === 0) {
      toast.warning(`No data available for ${filename}`);
      return;
    }
    const headers = Object.keys(dataset[0]).join(",");
    const rows = dataset.map(obj => 
      Object.values(obj).map(val => {
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${MONTHS[selectedMonth]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success(`${filename} CSV Exort Successful`);
  };

  const handleDownloadExcel = (dataset: any[], filename: string) => {
    if (!dataset || dataset.length === 0) {
      toast.warning(`No data available for ${filename}`);
      return;
    }
    const headers = Object.keys(dataset[0]);
    let table = '<table border="1"><thead><tr>' + headers.map(h => `<th style="background-color: #f3f4f6; font-weight: bold; padding: 8px;">${h.toUpperCase()}</th>`).join('') + '</tr></thead><tbody>';
    dataset.forEach(row => {
      table += '<tr>' + Object.values(row).map(v => `<td style="padding: 4px;">${v === null || v === undefined ? '' : String(v).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`).join('') + '</tr>';
    });
    table += '</tbody></table>';

    const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${MONTHS[selectedMonth]}_${selectedYear}.xls`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success(`${filename} Excel Export Successful`);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const chartData = data ? [
    { name: "Donations", total: data?.summary?.totalDonations || 0 },
    { name: "Pickups", total: data?.summary?.totalPickups || 0 },
    { name: "New Users", total: data?.summary?.newUsers || 0 },
  ] : [];

  const chartConfig = {
    donations: {
      label: "Donations",
      color: "#f97316",
    },
    pickups: {
      label: "Deliveries",
      color: "#3b82f6",
    }
  };

  const lineChartData = data ? Array.from({ length: new Date(selectedYear, selectedMonth + 1, 0).getDate() }, (_, i) => {
    const day = i + 1;
    const donationsCount = data?.donations?.filter((d: any) => new Date(d.createdAt).getDate() === day).length || 0;
    const pickupsCount = data?.pickups?.filter((p: any) => new Date(p.createdAt).getDate() === day).length || 0;
    return { day, donations: donationsCount, pickups: pickupsCount };
  }) : [];

  const userRoleData = data ? [
    { label: "Donors", value: data?.users?.filter((u: any) => u.role === "DONOR").length || 0, color: "#f97316" },
    { label: "NGOs", value: data?.users?.filter((u: any) => u.role === "NGO").length || 0, color: "#3b82f6" },
    { label: "Community", value: data?.users?.filter((u: any) => u.role === "COMMUNITY").length || 0, color: "#8b5cf6" },
    { label: "Riders", value: data?.users?.filter((u: any) => u.role === "RIDER").length || 0, color: "#10b981" },
  ] : [];

  return (
    <div className="w-full space-y-6 print:m-0 print:p-0">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; box-sizing: border-box; }
          .print-hide { display: none !important; }
          .print-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 20px !important; }
          .print-break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
        }
      `}} />

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print-hide bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-orange-600" />
            Analytics & Reports
          </h1>
          <p className="text-gray-500 mt-1">Generate and export comprehensive monthly reports.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1.5 focus-within:ring-2 focus-within:ring-orange-500/50 transition-all">
            <Calendar className="h-4 w-4 text-gray-500 ml-2" />
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent border-none text-sm font-medium text-gray-700 outline-none cursor-pointer py-1 pl-1 pr-6"
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent border-none text-sm font-medium text-gray-700 outline-none cursor-pointer py-1 pl-1 pr-6 border-l border-gray-300"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleDownloadCSV(data?.donations || [], "Donations_Report")}
              disabled={loading || !data}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:text-orange-600 transition-colors disabled:opacity-50"
            >
              <FileText className="h-4 w-4" /> CSV
            </button>
            <button 
              onClick={() => handleDownloadExcel(data?.donations || [], "Donations_Report")}
              disabled={loading || !data}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </button>
            <button 
              onClick={handlePrintPDF}
              disabled={loading || !data}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
            >
              <Printer className="h-4 w-4" /> Print / PDF
            </button>
          </div>
        </div>
      </div>

      <Skeleton name="admin-data-report-skeleton" loading={loading}>
        <div id="printable-report" ref={printRef} className="space-y-6">
          <div className="hidden print:block mb-8 pb-4 border-b-2 border-gray-900">
            <h1 className="text-3xl font-black text-gray-900">ShareBite Monthly Report</h1>
            <p className="text-gray-600 text-lg">Period: {MONTHS[selectedMonth]} {selectedYear}</p>
            <p className="text-gray-500 text-sm mt-1">Generated on: {format(new Date(), 'PPpp')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print-grid">
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 print-break-inside-avoid">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Total Donations</h3>
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Utensils className="h-5 w-5" /></div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{data?.summary?.totalDonations || 0}</div>
              <p className="text-xs text-emerald-600 font-medium mt-1">{data?.summary?.activeDonations || 0} Currently Active</p>
            </motion.div>

            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 print-break-inside-avoid">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Pickups / Deliveries</h3>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Truck className="h-5 w-5" /></div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{data?.summary?.totalPickups || 0}</div>
              <p className="text-xs text-emerald-600 font-medium mt-1">{data?.summary?.completedPickups || 0} Completed Delivery</p>
            </motion.div>

            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 print-break-inside-avoid">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Food Saved (kg)</h3>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Scale className="h-5 w-5" /></div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{(data?.summary?.totalWeight || 0).toFixed(1)}</div>
              <p className="text-xs text-gray-500 font-medium mt-1">Total Weight Diverted</p>
            </motion.div>

            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.3}} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 print-break-inside-avoid">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">New Registrations</h3>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users className="h-5 w-5" /></div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{data?.summary?.newUsers || 0}</div>
              <p className="text-xs text-gray-500 font-medium mt-1">Across all roles</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.4}} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print-break-inside-avoid">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Daily Activity Trend</h3>
              <div className="h-64 mt-4 w-full">
                 <ChartContainer config={chartConfig} className="w-full h-full max-h-[250px]">
                    <LineChart data={lineChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                       <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(v) => String(v)} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                       <ChartTooltip content={<ChartTooltipContent />} />
                       <Line type="monotone" dataKey="donations" stroke="var(--color-donations)" strokeWidth={3} dot={false} />
                       <Line type="monotone" dataKey="pickups" stroke="var(--color-pickups)" strokeWidth={3} dot={false} />
                    </LineChart>
                 </ChartContainer>
              </div>
            </motion.div>
            
            <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.5}} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print-break-inside-avoid flex flex-col items-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2 self-start w-full">New Users Breakdown</h3>
              <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[220px]">
                {userRoleData.filter((d: any) => d.value > 0).length > 0 ? (
                  <DonutChart 
                    data={userRoleData.filter((d: any) => d.value > 0)} 
                    size={220} 
                    strokeWidth={24}
                    centerContent={<div className="text-center"><p className="text-3xl font-bold text-gray-900">{data?.summary?.newUsers || 0}</p><p className="text-xs text-gray-500 font-medium">Total Users</p></div>}
                  />
                ) : (
                  <div className="p-8 bg-gray-50 rounded-2xl text-center border border-gray-100">
                    <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 font-medium text-sm">No new users this month</p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-6 w-full pt-4 border-t border-gray-100">
                {userRoleData.filter((d: any) => d.value > 0).map((d: any, i: number) => (
                   <div key={i} className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                      <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: d.color}}></div>
                      {d.label} <span className="text-gray-900 ml-0.5">{d.value}</span>
                   </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.6}} className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print-break-inside-avoid flex flex-col justify-center">
               <h3 className="text-lg font-bold text-gray-900 mb-6">Detailed Data Export</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 shadow-[0_2px_10px_-4px_rgba(249,115,22,0.1)] flex flex-col hover:border-orange-300 transition-all duration-300 group">
                     <div className="flex-1 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Utensils className="h-4 w-4 text-orange-600" />
                          <p className="font-bold text-gray-900 text-base">Donations Data</p>
                        </div>
                        <p className="text-sm font-medium text-gray-500">{data?.donations?.length || 0} records generated</p>
                     </div>
                     <div className="flex gap-2 print-hide w-full">
                        <button onClick={() => handleDownloadCSV(data?.donations || [], "Donations_Report")} className="flex-1 py-1.5 text-xs font-bold bg-white shadow-sm border border-gray-200 rounded-lg text-gray-700 hover:text-orange-600 hover:border-orange-200 transition-all">CSV EXPORT</button>
                        <button onClick={() => handleDownloadExcel(data?.donations || [], "Donations_Report")} className="flex-1 py-1.5 text-xs font-bold bg-white shadow-sm border border-gray-200 rounded-lg text-gray-700 hover:text-emerald-600 hover:border-emerald-200 transition-all">EXCEL EXPORT</button>
                     </div>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 shadow-[0_2px_10px_-4px_rgba(59,130,246,0.1)] flex flex-col hover:border-blue-300 transition-all duration-300 group">
                     <div className="flex-1 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Truck className="h-4 w-4 text-blue-600" />
                          <p className="font-bold text-gray-900 text-base">Deliveries Data</p>
                        </div>
                        <p className="text-sm font-medium text-gray-500">{data?.pickups?.length || 0} records generated</p>
                     </div>
                     <div className="flex gap-2 print-hide w-full">
                        <button onClick={() => handleDownloadCSV(data?.pickups || [], "Pickups_Report")} className="flex-1 py-1.5 text-xs font-bold bg-white shadow-sm border border-gray-200 rounded-lg text-gray-700 hover:text-orange-600 hover:border-orange-200 transition-all">CSV EXPORT</button>
                        <button onClick={() => handleDownloadExcel(data?.pickups || [], "Pickups_Report")} className="flex-1 py-1.5 text-xs font-bold bg-white shadow-sm border border-gray-200 rounded-lg text-gray-700 hover:text-emerald-600 hover:border-emerald-200 transition-all">EXCEL EXPORT</button>
                     </div>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 shadow-[0_2px_10px_-4px_rgba(168,85,247,0.1)] flex flex-col hover:border-purple-300 transition-all duration-300 group">
                     <div className="flex-1 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-4 w-4 text-purple-600" />
                          <p className="font-bold text-gray-900 text-base">Users Data</p>
                        </div>
                        <p className="text-sm font-medium text-gray-500">{data?.users?.length || 0} records generated</p>
                     </div>
                     <div className="flex gap-2 print-hide w-full">
                        <button onClick={() => handleDownloadCSV(data?.users || [], "Users_Report")} className="flex-1 py-1.5 text-xs font-bold bg-white shadow-sm border border-gray-200 rounded-lg text-gray-700 hover:text-orange-600 hover:border-orange-200 transition-all">CSV EXPORT</button>
                        <button onClick={() => handleDownloadExcel(data?.users || [], "Users_Report")} className="flex-1 py-1.5 text-xs font-bold bg-white shadow-sm border border-gray-200 rounded-lg text-gray-700 hover:text-emerald-600 hover:border-emerald-200 transition-all">EXCEL EXPORT</button>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        </div>
      </Skeleton>
    </div>
  );
}
