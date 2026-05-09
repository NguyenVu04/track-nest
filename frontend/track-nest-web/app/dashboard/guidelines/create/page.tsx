"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Globe,
  MessageSquare,
  Bell,
  ChevronLeft,
  Save,
  Send,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  criminalReportsService,
  CreateGuidelinesDocumentRequest,
} from "@/services/criminalReportsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PageTransition } from "@/components/animations/PageTransition";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

const RichTextEditor = dynamic(
  () =>
    import("@/components/shared/RichTextEditor").then(
      (mod) => mod.RichTextEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 font-medium">Preparing editor...</span>
      </div>
    ),
  },
);

export default function CreateGuidelinePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "general",
    abstractText: "",
    content: "",
    isPublic: false,
    allowComments: true,
    notifyCircle: true,
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Unauthorized Access
        </h2>
        <p className="text-gray-500 mb-8 max-w-md">
          You do not have the required permissions to create guidelines. Please
          contact your administrator if you believe this is an error.
        </p>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="rounded-xl"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const handlePublish = async () => {
    if (!formData.title || !formData.abstractText || !formData.content) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const request: CreateGuidelinesDocumentRequest = {
        title: formData.title,
        abstractText: formData.abstractText,
        content: formData.content,
        isPublic: formData.isPublic,
      };
      const created =
        await criminalReportsService.createGuidelinesDocument(request);
      await criminalReportsService.publishGuidelinesDocument(created.id);
      toast.success("Guideline published successfully");
      router.push("/dashboard/guidelines");
    } catch (error) {
      toast.error("Failed to publish guideline");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.title) {
      toast.error("A title is required to save a draft");
      return;
    }

    setIsSubmitting(true);
    try {
      const request: CreateGuidelinesDocumentRequest = {
        title: formData.title,
        abstractText: formData.abstractText,
        content: formData.content,
        isPublic: false, // Drafts are not public
      };
      await criminalReportsService.createGuidelinesDocument(request);
      toast.success("Guideline saved as draft");
      router.push("/dashboard/guidelines");
    } catch (error) {
      toast.error("Failed to save guideline");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto pb-20">
        <Breadcrumbs
          items={[
            { label: "Guidelines", href: "/dashboard/guidelines" },
            { label: "Create New" },
          ]}
        />

        <div className="mb-8 mt-4">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
            Create New Guideline
          </h1>
          <p className="text-gray-500 text-lg font-medium">
            Draft and publish standard operating procedures for your circles.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Card className="border-none shadow-2xl shadow-gray-200/50 rounded-[2.5rem] overflow-hidden bg-white/70 backdrop-blur-xl border border-white/20">
            <CardContent className="p-10 space-y-10">
              {/* Row 1: Title and Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-3">
                  <Label
                    htmlFor="title"
                    className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1"
                  >
                    Guideline Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Extreme Weather Protocol"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="h-14 px-6 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-brand-500/20 focus:border-brand-500 transition-all text-lg font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="category"
                    className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1"
                  >
                    Category
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) =>
                      setFormData({ ...formData, category: val })
                    }
                  >
                    <SelectTrigger
                      id="category"
                      className="h-14 px-6 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold"
                    >
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                      <SelectItem
                        value="general"
                        className="rounded-xl py-3 font-bold"
                      >
                        General Safety
                      </SelectItem>
                      <SelectItem
                        value="emergency"
                        className="rounded-xl py-3 font-bold"
                      >
                        Emergency Response
                      </SelectItem>
                      <SelectItem
                        value="medical"
                        className="rounded-xl py-3 font-bold"
                      >
                        Medical Protocol
                      </SelectItem>
                      <SelectItem
                        value="family"
                        className="rounded-xl py-3 font-bold"
                      >
                        Family Circle
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Abstract */}
              <div className="space-y-3">
                <Label
                  htmlFor="abstractText"
                  className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1"
                >
                  Short Abstract
                </Label>
                <Textarea
                  id="abstractText"
                  placeholder="Brief summary of the guideline's purpose..."
                  value={formData.abstractText}
                  onChange={(e) =>
                    setFormData({ ...formData, abstractText: e.target.value })
                  }
                  className="min-h-[120px] px-6 py-4 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-brand-500/20 focus:border-brand-500 transition-all text-base font-medium resize-none"
                />
              </div>

              {/* Row 3: Full Content */}
              <div className="space-y-3">
                <Label
                  htmlFor="content"
                  className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1"
                >
                  Full Content
                </Label>
                <div className="rounded-3xl overflow-hidden border border-gray-100 bg-white ring-offset-background focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all">
                  <RichTextEditor
                    value={formData.content}
                    onChange={(html) =>
                      setFormData({ ...formData, content: html })
                    }
                    placeholder="Start typing the full procedure here..."
                    height={400}
                  />
                </div>
              </div>

              {/* Publishing Settings Section */}
              <div className="bg-gray-50/80 rounded-[2rem] p-8 border border-gray-100 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white">
                    <Send className="w-4 h-4" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">
                    Publishing Settings
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Setting 1: Make Public */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-50 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900">
                          Visibility: {formData.isPublic ? "Public" : "Draft"}
                        </p>
                        <p className="text-xs font-medium text-gray-500">
                          {formData.isPublic
                            ? "This guideline will be visible to everyone on TrackNest."
                            : "Draft"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.isPublic}
                      onCheckedChange={(val) =>
                        setFormData({ ...formData, isPublic: val })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6 border-t border-gray-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  className="px-8 py-6 rounded-2xl text-gray-500 font-bold hover:bg-gray-100 transition-all w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting || formData.isPublic}
                  className="px-8 py-6 rounded-2xl bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 transition-all w-full sm:w-auto"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isSubmitting ? "Saving..." : "Save as Draft"}
                </Button>
                <Button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSubmitting || !formData.isPublic}
                  className="px-10 py-6 rounded-2xl bg-brand-400 text-white font-black shadow-xl shadow-brand-400/20 hover:bg-brand-500 hover:-translate-y-0.5 transition-all w-full sm:w-auto"
                >
                  {isSubmitting ? "Publishing..." : "Publish"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
