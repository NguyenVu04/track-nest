"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Trash2, 
  Globe, 
  Share2, 
  Pencil, 
  Clock, 
  User, 
  MessageSquare, 
  History, 
  ChevronLeft,
  MoreVertical,
  CheckCircle2,
  Users
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Guideline } from "@/types";
import { ChatbotPanel } from "@/components/shared/ChatbotPanel";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { Loading } from "@/components/loading/Loading";
import { toast } from "sonner";
import { criminalReportsService } from "@/services/criminalReportsService";
import { PageTransition } from "@/components/animations/PageTransition";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/components/ui/utils";

export default function GuidelineDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [guideline, setGuideline] = useState<Guideline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!user || !id) return;

    const fetchGuideline = async () => {
      try {
        setIsLoading(true);
        const response = await criminalReportsService.getGuidelinesDocument(id);
        let contentValue = response.content;
        
        // If content is just a filename/docId and not HTML/URL, try to get a URL
        if (
          contentValue &&
          !contentValue.trim().startsWith("<") &&
          !contentValue.startsWith("http")
        ) {
          try {
            contentValue = await criminalReportsService.getFileUrl(
              "criminal-reports",
              contentValue,
            );
          } catch (error) {
            console.error("Failed to resolve guideline content URL:", error);
          }
        }
        
        setGuideline({
          id: response.id,
          title: response.title,
          abstractText: response.abstractText,
          content: contentValue,
          contentDocId: response.id, // Using response.id as documentId for chatbot
          createdAt: response.createdAt,
          reporterId: response.reporterId,
          isPublic: response.isPublic,
        });
      } catch (error) {
        console.error("Failed to fetch guideline:", error);
        toast.error("Failed to load guideline");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuideline();
  }, [user, id]);

  if (!user) return null;
  if (isLoading) return <Loading fullScreen />;

  if (!guideline) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Guideline Not Found</h2>
        <p className="text-gray-500 mb-8">The document you are looking for might have been removed or moved.</p>
        <Button onClick={() => router.back()} variant="outline" className="rounded-xl">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await criminalReportsService.deleteGuidelinesDocument(id);
      toast.success("Guideline deleted");
      router.push("/dashboard/guidelines");
    } catch (error) {
      toast.error("Failed to delete guideline");
      console.error(error);
    }
  };

  const handlePublish = async () => {
    try {
      const response = await criminalReportsService.publishGuidelinesDocument(id);
      setGuideline((prev) =>
        prev ? { ...prev, isPublic: response.isPublic } : prev,
      );
      toast.success("Guideline published");
    } catch (error) {
      toast.error("Failed to publish guideline");
      console.error(error);
    }
  };

  const formattedDate = new Date(guideline.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  return (
    <PageTransition>
      <div className="max-w-[1400px] mx-auto pb-20">
        <Breadcrumbs 
          items={[
            { label: "Guidelines", href: "/dashboard/guidelines" },
            { label: guideline.title }
          ]} 
        />

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 mt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-brand-100 text-brand-600 border-none px-3 py-1 font-bold text-[10px] uppercase tracking-wider rounded-full">
                COMMUNITY SAFETY
              </Badge>
              {guideline.isPublic && (
                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-100 px-3 py-1 font-bold text-[10px] uppercase tracking-wider rounded-full flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Published
                </Badge>
              )}
            </div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-none">
              {guideline.title}
            </h1>
            <div className="flex items-center gap-2 text-gray-400 font-bold text-sm">
              <Clock className="w-4 h-4" />
              <span>Last updated on {formattedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDelete(true)}
              className="rounded-2xl h-12 px-6 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all font-bold"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button 
              variant="outline" 
              className="rounded-2xl h-12 px-6 border-gray-100 text-gray-500 hover:bg-gray-50 transition-all font-bold"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button 
              onClick={() => router.push(`/dashboard/guidelines/${id}/edit`)}
              className="rounded-2xl h-12 px-8 bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all font-black"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Guideline
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Abstract & Image & Content */}
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Card className="rounded-[2rem] border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white/70 backdrop-blur-xl relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-400" />
                  <CardHeader className="pt-8 px-8 pb-4">
                    <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">Short Abstract</CardTitle>
                  </CardHeader>
                  <CardContent className="px-8 pb-8">
                    <p className="text-gray-600 font-medium leading-relaxed">
                      {guideline.abstractText}
                    </p>
                  </CardContent>
               </Card>

               <Card className="rounded-[2rem] border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white/70 backdrop-blur-xl group cursor-pointer">
                  <div className="w-full h-full min-h-[200px] bg-gray-50 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-20 group-hover:scale-110 transition-transform duration-700" />
                    <div className="z-10 flex flex-col items-center gap-2">
                       <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-brand-600">
                          <Users className="w-6 h-6" />
                       </div>
                       <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Zone Map View</span>
                    </div>
                  </div>
               </Card>
            </div>

            <div className="pt-8">
              <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
                Full Procedure
              </h2>
              <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-gray-200/40 border border-gray-50">
                <div className="prose prose-brand max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-strong:text-gray-900 prose-img:rounded-3xl">
                  {guideline.content?.startsWith("http") ? (
                    <iframe
                      title="Guideline content"
                      src={guideline.content}
                      className="w-full min-h-[600px] rounded-2xl border-none"
                    />
                  ) : guideline.content?.trim().startsWith("<") ? (
                    <div
                      className="text-gray-900"
                      dangerouslySetInnerHTML={{ __html: guideline.content || "" }}
                    />
                  ) : (
                    <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                      {guideline.content || ""}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            {/* Author Card */}
            <Card className="rounded-[2rem] border-none shadow-xl shadow-gray-200/50 bg-white/70 backdrop-blur-xl p-8">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Author</p>
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14 rounded-2xl border-2 border-brand-50">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${guideline.reporterId}`} />
                  <AvatarFallback className="bg-brand-50 text-brand-600 font-bold">JD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-black text-gray-900 text-lg">John Doe</p>
                  <p className="text-sm font-bold text-gray-400">Lead Safety Coordinator</p>
                </div>
              </div>
            </Card>

            {/* Publishing Settings Card */}
            <Card className="rounded-[2rem] border-none shadow-xl shadow-gray-200/50 bg-white/70 backdrop-blur-xl p-8">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Publishing Settings</p>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-gray-500">
                    <Globe className="w-4 h-4" />
                    <span className="text-sm font-bold">Visibility</span>
                  </div>
                  <Badge className={cn(
                    "rounded-lg px-2 py-0.5 font-bold text-[10px] uppercase",
                    guideline.isPublic ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                  )}>
                    {guideline.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-gray-500">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-bold">Comments</span>
                  </div>
                  <Badge className="bg-brand-50 text-brand-600 rounded-lg px-2 py-0.5 font-bold text-[10px] uppercase">
                    Enabled
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-gray-500">
                    <History className="w-4 h-4" />
                    <span className="text-sm font-bold">Version</span>
                  </div>
                  <span className="text-sm font-bold text-gray-400">v1.0.0</span>
                </div>
              </div>
            </Card>

            {/* Targeted Circles Card */}
            {/* <Card className="rounded-[2rem] border-none shadow-xl shadow-gray-200/50 bg-gray-50/50 p-8">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Targeted Circles</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white border-gray-100 text-gray-500 rounded-xl px-4 py-2 font-bold text-xs hover:bg-white transition-colors">
                  Oakridge Community
                </Badge>
                <Badge variant="outline" className="bg-white border-gray-100 text-gray-500 rounded-xl px-4 py-2 font-bold text-xs hover:bg-white transition-colors">
                  Northside Watch
                </Badge>
                <Badge variant="outline" className="bg-white border-gray-100 text-gray-500 rounded-xl px-4 py-2 font-bold text-xs hover:bg-white transition-colors">
                  +2 more
                </Badge>
              </div>
            </Card> */}

            {/* Chatbot Prompt Card */}
            <div className="bg-brand-600 rounded-[2rem] p-8 text-white relative overflow-hidden group">
               <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
               <h4 className="text-xl font-black mb-2 relative z-10">Have questions?</h4>
               <p className="text-brand-100 font-bold text-sm mb-6 relative z-10 leading-relaxed">Our AI assistant can help you understand these procedures better.</p>
               <Button className="w-full bg-white text-brand-600 hover:bg-brand-50 font-black rounded-2xl py-6 h-auto shadow-xl relative z-10">
                 Start Guideline Chat
               </Button>
            </div>
          </div>
        </div>
      </div>

      <ChatbotPanel
        documentId={guideline.contentDocId || guideline.id}
        title="Guideline Chat"
        emptyState="Ask a question about this guideline."
      />

      {confirmDelete && (
        <ConfirmModal
          title="Delete Guideline"
          message="Are you sure you want to delete this guideline? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          confirmText="Delete"
          confirmStyle="danger"
        />
      )}
    </PageTransition>
  );
}
