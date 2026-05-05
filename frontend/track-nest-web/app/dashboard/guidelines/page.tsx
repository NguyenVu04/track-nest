"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, FileText, Trash2, Eye, MoreVertical, Calendar, ChevronRight, Clock, Users, ArrowRight, ListFilter, SlidersHorizontal, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Guideline } from "@/types";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { Loading } from "@/components/loading/Loading";
import { toast } from "sonner";
import { criminalReportsService } from "@/services/criminalReportsService";
import { PageTransition } from "@/components/animations/PageTransition";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function GuidelinesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchGuidelines = async () => {
      try {
        setIsLoading(true);
        const response = await criminalReportsService.listGuidelinesDocuments({
          isPublic: false,
          page: 0,
          size: 100,
        });
        setGuidelines(
          response.content.map((item) => ({
            id: item.id,
            title: item.title,
            abstractText: item.abstractText,
            content: item.content,
            contentDocId: item.contentDocId,
            createdAt: item.createdAt,
            reporterId: item.reporterId,
            isPublic: item.isPublic,
          })),
        );
      } catch (error) {
        console.error("Failed to fetch guidelines:", error);
        toast.error("Failed to load guidelines");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuidelines();
  }, [user]);

  if (!user) return null;
  if (isLoading) return <Loading fullScreen />;

  const handleDelete = async (id: string) => {
    try {
      await criminalReportsService.deleteGuidelinesDocument(id);
      setGuidelines((prev) => prev.filter((g) => g.id !== id));
      setConfirmDelete(null);
      toast.success("Guideline deleted");
    } catch (error) {
      toast.error("Failed to delete guideline");
      console.error(error);
    }
  };

  const filteredGuidelines = guidelines.filter((g) => {
    const matchesSearch = 
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.abstractText.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "published" && g.isPublic) ||
      (statusFilter === "draft" && !g.isPublic);
      
    return matchesSearch && matchesStatus;
  });

  const statusTabs = [
    { id: "all", label: "All Guides" },
    { id: "published", label: "Published" },
    { id: "draft", label: "Drafts" },
  ];

  return (
    <PageTransition>
      <div className="max-w-[1600px] mx-auto pb-12">
        <Breadcrumbs items={[{ label: "Safety Guidelines" }]} />
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Safety Guidelines</h1>
            <p className="text-gray-500 mt-2 text-lg">Manage and update your family's safety protocols and emergency checklists.</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/guidelines/create")}
            className="flex items-center gap-2 px-8 py-3 bg-brand-500 text-white rounded-2xl font-bold text-sm shadow-md hover:bg-brand-600 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Create New Guideline
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white/50 backdrop-blur-sm rounded-[2rem] p-3 mb-10 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
           <div className="flex items-center gap-2">
              {statusTabs.map((tab) => (
                 <button
                   key={tab.id}
                   onClick={() => setStatusFilter(tab.id as any)}
                   className={cn(
                      "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                      statusFilter === tab.id 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-400 hover:text-gray-600"
                   )}
                 >
                    {statusFilter === tab.id && <div className="w-2 h-2 rounded-full bg-teal-500" />}
                    {tab.label}
                 </button>
              ))}
           </div>
           
           <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
                 <SlidersHorizontal className="w-4 h-4" />
                 Sort by Date
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
                 <ListFilter className="w-4 h-4" />
                 Filter
              </button>
           </div>
        </div>

        {/* Grid of Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filteredGuidelines.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                 <FileText className="w-16 h-16 text-gray-100 mb-4" />
                 <p className="text-gray-400 font-bold">No guidelines found in this section</p>
              </div>
           ) : (
              filteredGuidelines.map((guideline, idx) => {
                 const isDraft = !guideline.isPublic;
                 const isFeatured = idx === 0 && !searchQuery; // Just for visual diversity in this redesign
                 
                 return (
                   <div 
                     key={guideline.id} 
                     className={cn(
                        "group relative bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col",
                        isFeatured && "md:col-span-2 lg:col-span-2"
                     )}
                   >
                      {/* Card Header */}
                      <div className="flex items-center justify-between mb-6">
                         <div className={cn(
                            "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            isDraft ? "bg-gray-50 text-gray-400 border-gray-100" : "bg-green-50 text-green-500 border-green-100"
                         )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full", isDraft ? "bg-gray-300" : "bg-green-500")} />
                            {isDraft ? "Draft" : "Published"}
                         </div>
                         <button className="text-gray-300 hover:text-gray-600 transition-colors">
                            <MoreVertical className="w-5 h-5" />
                         </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                         <h3 className={cn(
                            "font-black text-gray-900 leading-tight mb-3 group-hover:text-brand-500 transition-colors",
                            isFeatured ? "text-2xl" : "text-xl"
                         )}>
                            {guideline.title}
                         </h3>
                         <p className="text-gray-500 font-medium line-clamp-3 leading-relaxed mb-8">
                            {guideline.abstractText}
                         </p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-auto pt-8 border-t border-gray-50">
                         {isDraft ? (
                            <div className="flex flex-col">
                               <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Category: Family</p>
                               <p className="text-xs font-bold text-gray-500 mt-1">Last edited today</p>
                            </div>
                         ) : (
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-black text-xs">
                                  JD
                               </div>
                               <div>
                                  <p className="text-xs font-black text-gray-900">John Doe</p>
                                  <p className="text-[10px] font-bold text-gray-400 mt-0.5">Updated 2 days ago</p>
                               </div>
                            </div>
                         )}

                         <div className="flex items-center gap-2">
                            {isDraft ? (
                               <button 
                                 onClick={() => router.push(`/dashboard/guidelines/${guideline.id}`)}
                                 className="text-sm font-black text-brand-600 hover:text-brand-700 flex items-center gap-1 group/btn"
                               >
                                  Continue
                                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                               </button>
                            ) : (
                               <>
                                  <button 
                                    onClick={() => router.push(`/dashboard/guidelines/${guideline.id}`)}
                                    className="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-brand-500 transition-all"
                                  >
                                     <Eye className="w-5 h-5" />
                                  </button>
                                  <button 
                                    onClick={() => router.push(`/dashboard/guidelines/${guideline.id}/edit`)}
                                    className="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-blue-500 transition-all"
                                  >
                                     <FileText className="w-5 h-5" />
                                  </button>
                               </>
                            )}
                         </div>
                      </div>
                   </div>
                 );
              })
           )}

           {/* Static Featured Card if applicable - matching the "Review Required" card in the image */}
           {!searchQuery && statusFilter !== "draft" && (
              <div className="col-span-full bg-white rounded-[2rem] p-2 border border-gray-100 shadow-sm flex flex-col md:flex-row overflow-hidden hover:shadow-xl transition-all">
                 <div className="md:w-1/3 h-48 md:h-auto bg-gray-100 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <AlertCircle className="w-20 h-20 text-brand-500/20" />
                    </div>
                 </div>
                 <div className="p-10 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-amber-50 text-amber-500 border-amber-100 w-fit mb-6">
                       <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                       Review Required
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-3">Neighborhood Watch Zones</h2>
                    <p className="text-gray-500 font-medium leading-relaxed mb-10 max-w-2xl">
                       Update the geo-fenced safe zones for children walking to school. Current zones are expiring soon and require re-verification.
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                       <p className="text-xs font-black text-red-500 uppercase tracking-widest">Overdue by 3 days</p>
                       <button className="px-8 py-3 bg-brand-900 text-white rounded-2xl font-bold text-sm shadow-md hover:bg-black transition-all">
                          Review Now
                       </button>
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete Guideline"
          message="Are you sure you want to delete this guideline? This action cannot be undone."
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          confirmText="Delete"
          confirmStyle="danger"
        />
      )}
    </PageTransition>
  );
}
