"use client";

import {
  ArrowLeft,
  Edit,
  CheckCircle,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  Share2,
  FileText,
  AlertTriangle,
  ShieldCheck,
  MoreHorizontal,
  Plus,
  Maximize2,
  Minimize2,
  Target,
  Info,
  ShieldAlert,
  AlignLeft,
  Search,
  Crosshair,
  Camera
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import type { CrimeReport, UserRole } from "@/types";
import { MapView } from "../shared/MapView";
import { ConfirmModal } from "../shared/ConfirmModal";
import { ChatbotPanel } from "../shared/ChatbotPanel";
import { useTranslations } from "next-intl";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CrimeReportDetailProps {
  report: CrimeReport;
  onBack: () => void;
  onEdit: (report: CrimeReport) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  userRole: UserRole[];
}

export function CrimeReportDetail({
  report,
  onBack,
  onEdit,
  onPublish,
  onDelete,
  userRole,
}: CrimeReportDetailProps) {
  const t = useTranslations("crimeReports");
  const tCommon = useTranslations("common");

  const [confirmAction, setConfirmAction] = useState<"publish" | "delete" | null>(null);

  const handleConfirmPublish = () => {
    onPublish(report.id);
    setConfirmAction(null);
  };

  const handleConfirmDelete = () => {
    onDelete(report.id);
    setConfirmAction(null);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const getSeverityStyles = (severity: number) => {
    switch (severity) {
      case 5:
        return { color: "text-red-600", bg: "bg-red-50", border: "border-red-100", dot: "bg-red-500", label: "High" };
      case 4:
        return { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100", dot: "bg-orange-500", label: "High" };
      case 3:
        return { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", dot: "bg-amber-500", label: "Medium" };
      case 2:
        return { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", dot: "bg-blue-500", label: "Low" };
      default:
        return { color: "text-green-600", bg: "bg-green-50", border: "border-green-100", dot: "bg-green-500", label: "Low" };
    }
  };

  const severity = getSeverityStyles(report.severity);

  const zones = [
    {
      type: "circle" as const,
      center: [report.latitude, report.longitude] as [number, number],
      radius: 500,
      color: "#ef4444",
    },
  ];

  const formattedId = `#TRK-${report.id.slice(-4).toUpperCase()}-${report.id.slice(0, 1).toUpperCase()}`;
  const formattedDate = new Date(report.date).toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  const formattedTime = new Date(report.date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <div className="w-full mx-auto pb-12 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <button
                onClick={onBack}
                className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                 <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{report.title}</h1>
                 <span className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm",
                    report.isPublic ? "bg-red-50 text-red-500 border-red-100" : "bg-amber-50 text-amber-500 border-amber-100"
                 )}>
                    {report.isPublic ? "ACTIVE" : "DRAFT"}
                 </span>
              </div>
           </div>
           <div className="flex items-center gap-2 text-sm text-gray-400 font-medium ml-1">
              <span>Report ID: {formattedId}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300 mx-1" />
              <span>Logged on {formattedDate}</span>
           </div>
        </div>

        <div className="flex items-center gap-3">
           {(userRole.includes("Reporter") || userRole.includes("User")) && (
              <>
                 <button
                   onClick={() => onEdit(report)}
                   className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-100 text-gray-700 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all hover:-translate-y-0.5"
                 >
                    <Edit className="w-4 h-4" />
                    Edit
                 </button>
                 {!report.isPublic && (
                   <button
                     onClick={() => setConfirmAction("publish")}
                     className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-xl font-bold text-sm shadow-md hover:bg-brand-600 transition-all hover:-translate-y-0.5"
                   >
                      <CheckCircle className="w-4 h-4" />
                      Publish
                   </button>
                 )}
                 <button
                   onClick={handleShare}
                   className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-100 text-gray-700 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all hover:-translate-y-0.5"
                 >
                    <Share2 className="w-4 h-4" />
                    Share
                 </button>
                 <button
                   onClick={() => setConfirmAction("delete")}
                   className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-sm shadow-sm hover:bg-red-100 transition-all hover:-translate-y-0.5"
                 >
                    <Trash2 className="w-4 h-4" />
                    Delete
                 </button>
              </>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Incident Details */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 h-full transition-all hover:shadow-md">
              <div className="flex items-center gap-4 mb-10">
                 <div className="p-3 bg-blue-50 rounded-2xl">
                    <Info className="w-6 h-6 text-blue-500" />
                 </div>
                 <h2 className="text-xl font-bold text-gray-800">Incident Details</h2>
              </div>

              <div className="space-y-10">
                 {/* Location */}
                 <div className="flex gap-5">
                    <div className="flex-shrink-0 mt-1">
                       <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                          <MapPin className="w-5 h-5 text-gray-400" />
                       </div>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Location</p>
                       <p className="text-sm font-bold text-gray-800 leading-tight">Coordinates Point</p>
                       <p className="text-xs text-gray-500 font-medium mt-1">
                          {report.latitude.toFixed(4)}° N, {report.longitude.toFixed(4)}° W
                       </p>
                    </div>
                 </div>

                 {/* Date & Time */}
                 <div className="flex gap-5">
                    <div className="flex-shrink-0 mt-1">
                       <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                          <Clock className="w-5 h-5 text-gray-400" />
                       </div>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Date & Time</p>
                       <p className="text-sm font-bold text-gray-800 leading-tight">{formattedDate}</p>
                       <p className="text-xs text-gray-500 font-medium mt-1">{formattedTime} Local Time</p>
                    </div>
                 </div>

                 {/* Severity */}
                 <div className="flex gap-5">
                    <div className="flex-shrink-0 mt-1">
                       <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                          <ShieldAlert className="w-5 h-5 text-gray-400" />
                       </div>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Severity</p>
                       <div className={cn(
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm",
                          severity.bg, severity.border
                       )}>
                          <div className={cn("w-2 h-2 rounded-full", severity.dot)} />
                          <span className={cn("text-xs font-black uppercase tracking-tight", severity.color)}>
                             {severity.label}
                          </span>
                       </div>
                    </div>
                 </div>

                 {/* Description */}
                 <div className="flex gap-5">
                    <div className="flex-shrink-0 mt-1">
                       <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                          <AlignLeft className="w-5 h-5 text-gray-400" />
                       </div>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Description</p>
                       <div className="text-sm text-gray-600 font-medium leading-relaxed prose prose-sm max-w-none">
                          {report.content?.startsWith("http") ? (
                             <iframe
                               title="Crime report content"
                               src={report.content}
                               className="w-full min-h-[300px] rounded-2xl border border-gray-100 bg-gray-50"
                             />
                          ) : report.content?.trim().startsWith("<") ? (
                             <div dangerouslySetInnerHTML={{ __html: report.content || "" }} />
                          ) : (
                             <p className="whitespace-pre-line">{report.content || "No detailed description provided."}</p>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column: Map View */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 h-full flex flex-col transition-all hover:shadow-md">
              <div className="flex items-center gap-4 mb-8">
                 <div className="p-3 bg-blue-50 rounded-2xl">
                    <Crosshair className="w-6 h-6 text-blue-500" />
                 </div>
                 <h2 className="text-xl font-bold text-gray-800">Command Map View</h2>
              </div>

              <div className="relative flex-1 rounded-[2rem] overflow-hidden border border-gray-50 shadow-inner">
                 <MapView
                   center={[report.latitude, report.longitude]}
                   markers={[
                     {
                       position: [report.latitude, report.longitude],
                       label: report.title,
                     },
                   ]}
                   zones={zones}
                 />

                 {/* Map Overlays */}
                 <div className="absolute top-6 left-6 z-10">
                    {/* <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-xl max-w-[200px]">
                       <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                          <p className="text-xs font-bold text-gray-900">Live Tracking Active</p>
                       </div>
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Radius: 500m</p>
                    </div> */}
                 </div>

                 {/* <div className="absolute bottom-6 right-6 z-10 flex gap-2">
                    <button className="p-3 bg-white/90 backdrop-blur-md rounded-xl border border-white/20 shadow-lg hover:bg-white transition-colors">
                       <Search className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-3 bg-white/90 backdrop-blur-md rounded-xl border border-white/20 shadow-lg hover:bg-white transition-colors">
                       <Maximize2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-3 bg-white/90 backdrop-blur-md rounded-xl border border-white/20 shadow-lg hover:bg-white transition-colors text-brand-600">
                       <Target className="w-4 h-4" />
                    </button>
                 </div> */}
              </div>
           </div>
        </div>

        {/* Bottom Section: Media Evidence */}
        <div className="lg:col-span-12">
           <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal-50 rounded-2xl">
                       <Camera className="w-6 h-6 text-teal-500" />
                    </div>
                    <div>
                       <h2 className="text-xl font-bold text-gray-800">Media Evidence</h2>
                       <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">COLLECTED ASSETS</p>
                    </div>
                 </div>
              </div>

              {report.photos && report.photos.length > 0 ? (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {report.photos.map((url, idx) => (
                       <div
                         key={idx}
                         className="group relative aspect-square rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm"
                       >
                         <Image
                           src={url}
                           alt="Crime scene photo"
                           fill
                           className="object-cover group-hover:scale-110 transition-transform duration-700"
                           unoptimized
                         />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/40 transition-colors">
                               <Maximize2 className="w-5 h-5" />
                            </button>
                         </div>
                       </div>
                    ))}
                 </div>
              ) : (
                 <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50">
                    <Camera className="w-12 h-12 text-gray-200 mb-3" />
                    <p className="text-gray-400 font-bold text-sm tracking-tight">No media evidence provided</p>
                 </div>
              )}
           </div>
        </div>
      </div>

      <ChatbotPanel
        documentId={report.contentDocId}
        title="Crime Report Chat"
        emptyState="Ask a question about this report."
      />

      {confirmAction === "publish" && (
        <ConfirmModal
          title={t("publishTitle")}
          message={t("publishMessage", { title: report.title })}
          onConfirm={handleConfirmPublish}
          onCancel={() => setConfirmAction(null)}
          confirmText={tCommon("publish")}
          confirmStyle="primary"
        />
      )}

      {confirmAction === "delete" && (
        <ConfirmModal
          title={t("deleteTitle")}
          message={t("deleteMessage", { title: report.title })}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmAction(null)}
          confirmText={tCommon("delete")}
          confirmStyle="danger"
        />
      )}
    </div>
  );
}
