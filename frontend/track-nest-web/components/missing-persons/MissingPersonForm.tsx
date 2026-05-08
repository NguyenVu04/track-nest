"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Save,
  X,
  MapPin,
  User,
  Calendar,
  FileText,
  Phone,
  Mail,
  Upload,
  Trash2,
  ChevronLeft,
  Send,
  UserCircle2,
  Scale,
  Palette,
  Eye,
  ScanFace,
  Info
} from "lucide-react";
import Image from "next/image";
import type { MissingPerson } from "@/types";
import {
  criminalReportsService,
  UpdateMissingPersonReportRequest,
} from "@/services/criminalReportsService";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/animations/PageTransition";

const LocationPicker = dynamic(
  () => import("../shared/LocationPicker").then((mod) => mod.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 rounded-3xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2">
        <MapPin className="w-8 h-8 text-gray-300 animate-pulse" />
        <span className="text-gray-400 font-medium">Loading map interface...</span>
      </div>
    ),
  },
);

const RichTextEditor = dynamic(
  () => import("../shared/RichTextEditor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 rounded-3xl border border-gray-100 bg-gray-50/50 flex items-center justify-center">
        <span className="text-gray-400 font-medium">Loading editor...</span>
      </div>
    ),
  },
);

interface MissingPersonFormProps {
  person: MissingPerson | null;
  onSave: (person: MissingPerson) => void;
  onCancel: () => void;
  mode: "create" | "edit";
}

export function MissingPersonForm({
  person,
  onSave,
  onCancel,
  mode,
}: MissingPersonFormProps) {
  const t = useTranslations("missingPersons");
  const tCommon = useTranslations("common");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Added physical description fields to state
  const [formData, setFormData] = useState<any>(
    person || {
      fullName: "",
      personalId: "",
      photo: "",
      date: new Date().toISOString().slice(0, 10),
      content: "",
      contactEmail: "",
      contactPhone: "",
      title: "",
      status: "PENDING",
      // New fields for the redesign
      age: "",
      gender: "",
      height: "",
      weight: "",
      hairColor: "",
      eyeColor: "",
      distinguishingFeatures: "",
    },
  );

  const [coordinates, setCoordinates] = useState<[number, number]>(
    person?.latitude != null && person?.longitude != null
      ? [person.latitude, person.longitude]
      : [10.8231, 106.6297],
  );

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>(
    mode === "edit" ? (person?.photo ?? "") : "",
  );

  useEffect(() => {
    if (mode !== "edit") return;
    const photoValue = person?.photo ?? "";
    if (!photoValue) {
      setPhotoPreviewUrl("");
      return;
    }
    if (photoValue.startsWith("http")) {
      setPhotoPreviewUrl(photoValue);
      return;
    }

    if (person?.id) {
      setPhotoPreviewUrl(
        criminalReportsService.getMissingPersonPhotoUrl(person.id),
      );
      return;
    }

    let isActive = true;
    criminalReportsService
      .getFileUrl("criminal-reports", photoValue)
      .then((url) => {
        if (isActive) setPhotoPreviewUrl(url);
      })
      .catch((error) => {
        console.error("Failed to resolve photo preview URL:", error);
      });

    return () => {
      isActive = false;
    };
  }, [mode, person?.photo]);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mode === "create") {
      setPhotoFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    } else {
      handleEditPhotoUpload(file);
    }
  };

  const handleEditPhotoUpload = async (file: File) => {
    try {
      const result = await criminalReportsService.uploadFile(
        file,
        "criminal-reports",
      );
      setFormData((prev: any) => ({ ...prev, photo: result.url }));
      setPhotoPreviewUrl(result.url);
    } catch {
      toast.error(t("uploadPhotoError"));
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handlePhotoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    handlePhotoFileChange({
      target: { files: e.dataTransfer.files },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreviewUrl("");
    setFormData((prev: any) => ({ ...prev, photo: "" }));
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Constructing a structured content if backend doesn't support specific fields
    const physicalDetailsHtml = `
      <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
        <h3 style="margin-top: 0; color: #111827;">Physical Description</h3>
        <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <li><strong>Age:</strong> ${formData.age || "N/A"}</li>
          <li><strong>Gender:</strong> ${formData.gender || "N/A"}</li>
          <li><strong>Height:</strong> ${formData.height || "N/A"}</li>
          <li><strong>Weight:</strong> ${formData.weight || "N/A"}</li>
          <li><strong>Hair Color:</strong> ${formData.hairColor || "N/A"}</li>
          <li><strong>Eye Color:</strong> ${formData.eyeColor || "N/A"}</li>
        </ul>
        ${formData.distinguishingFeatures ? `<p style="margin-top: 16px; margin-bottom: 0;"><strong>Distinguishing Features:</strong> ${formData.distinguishingFeatures}</p>` : ""}
      </div>
      ${formData.content}
    `;

    try {
      if (mode === "create") {
        const response = await criminalReportsService.submitMissingPersonReport(
          {
            title: formData.title || `Missing Person: ${formData.fullName}`,
            fullName: formData.fullName!,
            personalId: formData.personalId!,
            photo: photoFile ?? undefined,
            date: formData.date!,
            content: physicalDetailsHtml,
            contactEmail: formData.contactEmail || "",
            contactPhone: formData.contactPhone!,
            latitude: coordinates[0],
            longitude: coordinates[1],
          },
        );
        onSave({
          id: response.id,
          title: response.title,
          fullName: response.fullName,
          personalId: response.personalId,
          photo: response.photo,
          date: response.date,
          content: response.content,
          contentDocId: response.contentDocId,
          latitude: response.latitude,
          longitude: response.longitude,
          contactEmail: response.contactEmail,
          contactPhone: response.contactPhone,
          createdAt: response.createdAt,
          userId: response.userId,
          status: response.status as MissingPerson["status"],
          reporterId: response.reporterId,
          isPublic: response.isPublic,
        });
      } else {
        const updateRequest: UpdateMissingPersonReportRequest = {
          title: formData.title,
          fullName: formData.fullName,
          personalId: formData.personalId,
          photo: formData.photo || undefined,
          date: formData.date,
          content: physicalDetailsHtml,
          latitude: coordinates[0],
          longitude: coordinates[1],
          contactEmail: formData.contactEmail || undefined,
          contactPhone: formData.contactPhone ?? "",
        };
        const response = await criminalReportsService.updateMissingPersonReport(
          person!.id,
          updateRequest,
        );
        onSave({
          id: response.id,
          title: response.title,
          fullName: response.fullName,
          personalId: response.personalId,
          photo: response.photo,
          date: response.date,
          content: response.content,
          contentDocId: response.contentDocId,
          latitude: response.latitude,
          longitude: response.longitude,
          contactEmail: response.contactEmail,
          contactPhone: response.contactPhone,
          createdAt: response.createdAt,
          userId: response.userId,
          status: response.status as MissingPerson["status"],
          reporterId: response.reporterId,
          isPublic: response.isPublic,
        });
      }
    } catch (error) {
      console.error("Error saving missing person report:", error);
      toast.error(
        mode === "create" ? t("toastCreateError") : t("toastUpdateError"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPhotoSrc = photoPreviewUrl || formData.photo || "";

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto pb-20">
        <Button 
          variant="ghost" 
          onClick={onCancel}
          className="mb-8 text-gray-500 hover:text-gray-900 transition-colors p-0 h-auto font-bold group"
        >
          <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Button>

        <div className="mb-10">
          <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
            {mode === "create" ? "Create Missing Person Report" : "Edit Missing Person Report"}
          </h1>
          <p className="text-gray-500 text-lg font-medium max-w-3xl leading-relaxed">
            Enter accurate details to initiate an immediate alert sequence across the TrackNest network. 
            This information will be distributed to local authorities and selected Family Circles.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Identification */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-xl shadow-gray-200/50 bg-white/70 backdrop-blur-xl relative overflow-hidden">
               <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-400" />
               <CardHeader className="pt-8 px-10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                       <ScanFace className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl font-black text-gray-900">Identification</CardTitle>
                  </div>
               </CardHeader>
               <CardContent className="px-10 pb-10 space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="fullName" className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">
                      Full Legal Name <span className="text-brand-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="e.g. Jane Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                      className="h-14 px-6 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-brand-500/20 focus:border-brand-500 transition-all text-lg font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="age" className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">
                        Age <span className="text-brand-500">*</span>
                      </Label>
                      <Input
                        id="age"
                        placeholder="Years"
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        required
                        className="h-14 px-6 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-brand-500/20 focus:border-brand-500 transition-all text-lg font-bold"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="gender" className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">
                        Gender Identity <span className="text-brand-500">*</span>
                      </Label>
                      <Select 
                        value={formData.gender} 
                        onValueChange={(val) => setFormData({ ...formData, gender: val })}
                      >
                        <SelectTrigger className="h-14 px-6 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-brand-500/20 focus:border-brand-500 transition-all text-lg font-bold">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                          <SelectItem value="male" className="rounded-xl py-3 font-bold">Male</SelectItem>
                          <SelectItem value="female" className="rounded-xl py-3 font-bold">Female</SelectItem>
                          <SelectItem value="non-binary" className="rounded-xl py-3 font-bold">Non-binary</SelectItem>
                          <SelectItem value="other" className="rounded-xl py-3 font-bold">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="personalId" className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">
                      Personal ID / Passport <span className="text-brand-500">*</span>
                    </Label>
                    <Input
                      id="personalId"
                      placeholder="e.g. 123456789"
                      value={formData.personalId}
                      onChange={(e) => setFormData({ ...formData, personalId: e.target.value })}
                      required
                      className="h-14 px-6 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-brand-500/20 focus:border-brand-500 transition-all text-lg font-bold"
                    />
                  </div>
               </CardContent>
            </Card>

            {/* Photo Upload Area */}
            <Card className="rounded-[2.5rem] border-2 border-dashed border-gray-200 shadow-none bg-gray-50/50 relative overflow-hidden flex flex-col items-center justify-center p-8 group transition-all hover:bg-gray-100/50 hover:border-brand-200">
               <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoFileChange}
                />
                
                {currentPhotoSrc ? (
                  <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
                    <Image
                      src={currentPhotoSrc}
                      alt="Portrait"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Button 
                         type="button" 
                         variant="destructive" 
                         onClick={(e) => { e.stopPropagation(); handleRemovePhoto(); }}
                         className="rounded-xl font-bold"
                       >
                         <Trash2 className="w-4 h-4 mr-2" />
                         Remove
                       </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="flex flex-col items-center text-center gap-4 cursor-pointer w-full h-full justify-center"
                    onClick={() => photoInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handlePhotoDrop}
                  >
                    <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900">Upload Portrait</h3>
                      <p className="text-xs font-bold text-gray-400 mt-1 max-w-[200px]">
                        High-resolution, recent photo showing full face. Max 5MB.
                      </p>
                    </div>
                  </div>
                )}
            </Card>
          </div>

          {/* Section 2: Physical Description */}
          <Card className="rounded-[2.5rem] border-none shadow-xl shadow-gray-200/50 bg-white/70 backdrop-blur-xl relative overflow-hidden">
             <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-400" />
             <CardHeader className="pt-8 px-10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                     <UserCircle2 className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl font-black text-gray-900">Physical Description</CardTitle>
                </div>
             </CardHeader>
             <CardContent className="px-10 pb-10 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Height</Label>
                      <Input
                        placeholder={"e.g. 5'8\""}
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        className="h-12 px-5 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white text-base font-bold"
                      />
                   </div>
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Weight</Label>
                      <Input
                        placeholder="e.g. 150 lbs"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        className="h-12 px-5 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white text-base font-bold"
                      />
                   </div>
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hair Color</Label>
                      <Input
                        placeholder="e.g. Brown"
                        value={formData.hairColor}
                        onChange={(e) => setFormData({ ...formData, hairColor: e.target.value })}
                        className="h-12 px-5 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white text-base font-bold"
                      />
                   </div>
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Eye Color</Label>
                      <Input
                        placeholder="e.g. Hazel"
                        value={formData.eyeColor}
                        onChange={(e) => setFormData({ ...formData, eyeColor: e.target.value })}
                        className="h-12 px-5 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white text-base font-bold"
                      />
                   </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">
                    Distinguishing Features (Scars, Tattoos, Glasses)
                  </Label>
                  <Textarea
                    placeholder="Describe any unique physical markers..."
                    value={formData.distinguishingFeatures}
                    onChange={(e) => setFormData({ ...formData, distinguishingFeatures: e.target.value })}
                    className="min-h-[120px] px-6 py-4 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-brand-500/20 focus:border-brand-500 transition-all text-base font-medium resize-none"
                  />
                </div>
             </CardContent>
          </Card>

          {/* Section 3: Last Known Sighting */}
          <Card className="rounded-[2.5rem] border-none shadow-xl shadow-gray-200/50 bg-white/70 backdrop-blur-xl relative overflow-hidden">
             <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400" />
             <CardHeader className="pt-8 px-10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                     <MapPin className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl font-black text-gray-900">Last Known Sighting</CardTitle>
                </div>
             </CardHeader>
             <CardContent className="px-10 pb-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">
                      Date Missing <span className="text-brand-500">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                        className="h-14 pl-12 pr-6 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white text-base font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center gap-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-100 text-amber-700 w-full">
                       <Info className="w-5 h-5 shrink-0" />
                       <p className="text-xs font-bold leading-tight">
                         Pinpoint the exact last known location on the map below for more accurate tracking.
                       </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-inner">
                  <LocationPicker
                    position={coordinates}
                    onPositionChange={(position) => setCoordinates(position)}
                  />
                </div>
             </CardContent>
          </Card>

          {/* Section 4: Contact & Additional Details */}
          <Card className="rounded-[2.5rem] border-none shadow-xl shadow-gray-200/50 bg-white/70 backdrop-blur-xl relative overflow-hidden">
             <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-600" />
             <CardHeader className="pt-8 px-10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                     <Phone className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl font-black text-gray-900">Contact & Additional Details</CardTitle>
                </div>
             </CardHeader>
             <CardContent className="px-10 pb-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">Contact Phone <span className="text-brand-500">*</span></Label>
                    <Input
                      placeholder="e.g. +1 (555) 000-0000"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      required
                      className="h-14 px-6 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white text-base font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">Contact Email</Label>
                    <Input
                      placeholder="e.g. contact@example.com"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="h-14 px-6 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white text-base font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">Full Report / Background Information</Label>
                  <div className="rounded-3xl overflow-hidden border border-gray-100 bg-white ring-offset-background focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all">
                    <RichTextEditor
                      value={formData.content || ""}
                      onChange={(html) => setFormData({ ...formData, content: html })}
                      placeholder="Enter any additional information, circumstances, or clothing description..."
                    />
                  </div>
                </div>
             </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onCancel}
              className="px-10 py-7 rounded-2xl text-gray-500 font-bold hover:bg-gray-100 transition-all w-full sm:w-auto text-lg"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="px-12 py-7 rounded-2xl bg-brand-600 text-white font-black shadow-xl shadow-brand-600/20 hover:bg-brand-700 hover:-translate-y-1 active:translate-y-0 transition-all w-full sm:w-auto text-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-6 h-6 mr-3" />
                  {mode === "create" ? "Create Report" : "Save Changes"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
