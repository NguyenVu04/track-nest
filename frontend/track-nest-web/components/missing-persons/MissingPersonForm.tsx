"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MapPin,
  Calendar,
  Phone,
  Upload,
  Trash2,
  ChevronLeft,
  Send,
  UserCircle2,
  ScanFace,
  Info,
} from "lucide-react";
import Image from "next/image";
import type { MissingPerson } from "@/types";
import {
  criminalReportsService,
  UpdateMissingPersonReportRequest,
} from "@/services/criminalReportsService";
import { parsePhysicalDetailsFromHtml } from "@/utils/parsePhysicalDetails";
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
        <span className="text-gray-400 font-medium">...</span>
      </div>
    ),
  },
);

type FormValues = {
  title?: string;
  fullName: string;
  personalId: string;
  age: string;
  gender: string;
  height?: string;
  weight?: string;
  hairColor?: string;
  eyeColor?: string;
  distinguishingFeatures?: string;
  date: string;
  contactPhone: string;
  contactEmail?: string;
  content?: string;
};

const isPositiveNumericString = (v: string | undefined) =>
  !v || (Number.isFinite(parseFloat(v)) && parseFloat(v) > 0);

interface MissingPersonFormProps {
  person: MissingPerson | null;
  onSave: (person: MissingPerson) => void;
  onCancel: () => void;
  mode: "create" | "edit";
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 ml-1 text-sm text-red-500">{message}</p>;
}

export function MissingPersonForm({
  person,
  onSave,
  onCancel,
  mode,
}: MissingPersonFormProps) {
  const t = useTranslations("missingPersons");
  const tCommon = useTranslations("common");

  const formSchema = useMemo(
    () =>
      z.object({
        title: z.string().optional(),
        fullName: z.string().min(2, t("validation.fullNameMin")),
        personalId: z.string().min(1, t("validation.personalIdRequired")),
        age: z
          .string()
          .min(1, t("validation.ageRequired"))
          .refine((v) => /^\d+$/.test(v.trim()), t("validation.ageInteger"))
          .refine((v) => {
            const n = parseInt(v, 10);
            return n >= 1 && n <= 120;
          }, t("validation.ageRange")),
        gender: z
          .string({ error: t("validation.genderRequired") })
          .min(1, t("validation.genderRequired")),
        height: z
          .string()
          .optional()
          .refine(isPositiveNumericString, t("validation.heightPositive")),
        weight: z
          .string()
          .optional()
          .refine(isPositiveNumericString, t("validation.weightPositive")),
        hairColor: z.string().optional(),
        eyeColor: z.string().optional(),
        distinguishingFeatures: z.string().optional(),
        date: z.string().min(1, t("validation.dateRequired")),
        contactPhone: z.string().min(1, t("validation.phoneRequired")),
        contactEmail: z
          .string()
          .optional()
          .refine(
            (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
            t("validation.emailInvalid"),
          ),
        content: z.string().optional(),
      }),
    [t],
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [coordinates, setCoordinates] = useState<[number, number]>(
    person?.latitude != null && person?.longitude != null
      ? [person.latitude, person.longitude]
      : [10.8231, 106.6297],
  );

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>(
    mode === "edit" ? (person?.photo ?? "") : "",
  );
  const [photoUrl, setPhotoUrl] = useState<string>(
    mode === "edit" ? (person?.photo ?? "") : "",
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: person?.title ?? "",
      fullName: person?.fullName ?? "",
      personalId: person?.personalId ?? "",
      date: person?.date ?? new Date().toISOString().slice(0, 10),
      contactEmail: person?.contactEmail ?? "",
      contactPhone: person?.contactPhone ?? "",
      content: person?.content ?? "",
      age: "",
      gender: "",
      height: "",
      weight: "",
      hairColor: "",
      eyeColor: "",
      distinguishingFeatures: "",
    },
  });

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
      .getFileContent("criminal-reports", photoValue)
      .then((url) => {
        if (isActive) setPhotoPreviewUrl(url);
      })
      .catch((error) => {
        console.error("Failed to resolve photo preview URL:", error);
      });

    return () => {
      isActive = false;
    };
  }, [mode, person?.id, person?.photo]);

  useEffect(() => {
    if (mode !== "edit" || !person?.content) return;
    const contentValue = person.content;

    let isActive = true;

    const populate = (html: string) => {
      if (!isActive) return;
      const p = parsePhysicalDetailsFromHtml(html);
      const updates: Partial<FormValues> = { content: p.content };
      if (p.age) updates.age = p.age;
      if (p.gender) updates.gender = p.gender;
      if (p.height) updates.height = p.height;
      if (p.weight) updates.weight = p.weight;
      if (p.hairColor) updates.hairColor = p.hairColor;
      if (p.eyeColor) updates.eyeColor = p.eyeColor;
      if (p.distinguishingFeatures) updates.distinguishingFeatures = p.distinguishingFeatures;
      reset({ ...getValues(), ...updates }, { keepDefaultValues: true });
    };

    if (contentValue.trim().startsWith("<")) {
      populate(contentValue);
      return () => { isActive = false; };
    }

    const load = async () => {
      try {
        let html: string;
        if (contentValue.startsWith("http")) {
          const res = await fetch(contentValue);
          html = await res.text();
        } else {
          html = await criminalReportsService.getFileContent(
            "criminal-reports",
            contentValue,
          );
        }
        populate(html);
      } catch (error) {
        console.error("Failed to load report content:", error);
      }
    };
    load();
    return () => {
      isActive = false;
    };
  }, [mode, person?.content, reset, getValues]);

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
      setPhotoUrl(result.url);
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
    setPhotoUrl("");
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    const physicalDetailsHtml = `
      <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
        <h3 style="margin-top: 0; color: #111827;">Physical Description</h3>
        <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <li><strong>Age:</strong> ${data.age || "N/A"}</li>
          <li><strong>Gender:</strong> ${data.gender || "N/A"}</li>
          <li><strong>Height:</strong> ${data.height ? `${data.height} cm` : "N/A"}</li>
          <li><strong>Weight:</strong> ${data.weight ? `${data.weight} kg` : "N/A"}</li>
          <li><strong>Hair Color:</strong> ${data.hairColor || "N/A"}</li>
          <li><strong>Eye Color:</strong> ${data.eyeColor || "N/A"}</li>
        </ul>
        ${data.distinguishingFeatures ? `<p style="margin-top: 16px; margin-bottom: 0;"><strong>Distinguishing Features:</strong> ${data.distinguishingFeatures}</p>` : ""}
      </div>
      ${data.content || ""}
    `;

    try {
      if (mode === "create") {
        const response = await criminalReportsService.submitMissingPersonReport(
          {
            title: data.title || `Missing Person: ${data.fullName}`,
            fullName: data.fullName,
            personalId: data.personalId,
            photo: photoFile ?? undefined,
            date: data.date,
            content: physicalDetailsHtml,
            contactEmail: data.contactEmail || "",
            contactPhone: data.contactPhone,
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
          title: data.title,
          fullName: data.fullName,
          personalId: data.personalId,
          photo: photoUrl || undefined,
          date: data.date,
          content: data.content,
          latitude: coordinates[0],
          longitude: coordinates[1],
          contactEmail: data.contactEmail || undefined,
          contactPhone: data.contactPhone,
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

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto pb-20">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="mb-8 text-gray-500 hover:text-gray-900 transition-colors p-0 h-auto font-bold group"
        >
          <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          {tCommon("back")}
        </Button>

        <div className="mb-10">
          <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
            {mode === "create" ? t("formNewTitle") : t("formEditTitle")}
          </h1>
          <p className="text-gray-500 text-lg font-medium max-w-3xl leading-relaxed">
            {t("formDescription")}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
          {/* Section 1: Identification */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-xl shadow-gray-200/50 bg-white/70 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-400" />
              <CardHeader className="pt-8 px-10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                    <ScanFace className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl font-black text-gray-900">
                    {t("sectionIdentification")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-10 pb-10 space-y-6">
                {/* Full Name */}
                <div className="space-y-3">
                  <Label
                    htmlFor="fullName"
                    className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1"
                  >
                    {t("formFullName")} <span className="text-brand-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder={t("placeholderFullName")}
                    {...register("fullName")}
                    className={cn(
                      "h-14 px-6 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-brand-500/20 focus:border-brand-500 transition-all text-lg font-bold",
                      errors.fullName && "border-red-300 bg-red-50/30",
                    )}
                  />
                  <FieldError message={errors.fullName?.message} />
                </div>

                {/* Age + Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="age"
                      className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1"
                    >
                      {t("formAge")} <span className="text-brand-500">*</span>
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      min={1}
                      max={120}
                      inputMode="numeric"
                      placeholder={t("formAge")}
                      {...register("age")}
                      className={cn(
                        "h-14 px-6 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-brand-500/20 focus:border-brand-500 transition-all text-lg font-bold",
                        errors.age && "border-red-300 bg-red-50/30",
                      )}
                    />
                    <FieldError message={errors.age?.message} />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">
                      {t("formGender")} <span className="text-brand-500">*</span>
                    </Label>
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className={cn(
                              "h-14 px-6 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-brand-500/20 focus:border-brand-500 transition-all text-lg font-bold",
                              errors.gender && "border-red-300 bg-red-50/30",
                            )}>
                            <SelectValue placeholder={t("placeholderGender")} />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                            <SelectItem value="male" className="rounded-xl py-3 font-bold">
                              {t("genderMale")}
                            </SelectItem>
                            <SelectItem value="female" className="rounded-xl py-3 font-bold">
                              {t("genderFemale")}
                            </SelectItem>
                            <SelectItem value="non-binary" className="rounded-xl py-3 font-bold">
                              {t("genderNonBinary")}
                            </SelectItem>
                            <SelectItem value="other" className="rounded-xl py-3 font-bold">
                              {t("genderOther")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError message={errors.gender?.message} />
                  </div>
                </div>

                {/* Personal ID */}
                <div className="space-y-3">
                  <Label
                    htmlFor="personalId"
                    className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1"
                  >
                    {t("formPersonalId")} <span className="text-brand-500">*</span>
                  </Label>
                  <Input
                    id="personalId"
                    type="text"
                    autoComplete="off"
                    placeholder={t("placeholderId")}
                    {...register("personalId")}
                    className={cn(
                      "h-14 px-6 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-brand-500/20 focus:border-brand-500 transition-all text-lg font-bold",
                      errors.personalId && "border-red-300 bg-red-50/30",
                    )}
                  />
                  <FieldError message={errors.personalId?.message} />
                </div>
              </CardContent>
            </Card>

            {/* Photo Upload */}
            <Card className="rounded-[2.5rem] border-2 border-dashed border-gray-200 shadow-none bg-gray-50/50 relative overflow-hidden flex flex-col items-center justify-center p-8 group transition-all hover:bg-gray-100/50 hover:border-brand-200">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoFileChange}
              />

              {photoPreviewUrl ? (
                <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src={photoPreviewUrl}
                    alt={t("formFullName")}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto();
                      }}
                      className="rounded-xl font-bold"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t("removePhoto")}
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
                    <h3 className="text-lg font-black text-gray-900">
                      {t("uploadPortrait")}
                    </h3>
                    <p className="text-xs font-bold text-gray-400 mt-1 max-w-50">
                      {t("uploadPortraitHint")}
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
                <CardTitle className="text-xl font-black text-gray-900">
                  {t("sectionPhysical")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-10 pb-10 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Height */}
                <div className="space-y-3">
                  <Label
                    htmlFor="height"
                    className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1"
                  >
                    {t("formHeight")}
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    min={1}
                    inputMode="decimal"
                    placeholder={t("placeholderHeight")}
                    {...register("height")}
                    className={cn(
                      "h-12 px-5 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white text-base font-bold",
                      errors.height && "border-red-300 bg-red-50/30",
                    )}
                  />
                  <FieldError message={errors.height?.message} />
                </div>
                {/* Weight */}
                <div className="space-y-3">
                  <Label
                    htmlFor="weight"
                    className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1"
                  >
                    {t("formWeight")}
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    min={1}
                    inputMode="decimal"
                    placeholder={t("placeholderWeight")}
                    {...register("weight")}
                    className={cn(
                      "h-12 px-5 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white text-base font-bold",
                      errors.weight && "border-red-300 bg-red-50/30",
                    )}
                  />
                  <FieldError message={errors.weight?.message} />
                </div>
                {/* Hair Color */}
                <div className="space-y-3">
                  <Label
                    htmlFor="hairColor"
                    className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1"
                  >
                    {t("formHairColor")}
                  </Label>
                  <Input
                    id="hairColor"
                    type="text"
                    placeholder={t("placeholderHairColor")}
                    {...register("hairColor")}
                    className="h-12 px-5 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white text-base font-bold"
                  />
                </div>
                {/* Eye Color */}
                <div className="space-y-3">
                  <Label
                    htmlFor="eyeColor"
                    className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1"
                  >
                    {t("formEyeColor")}
                  </Label>
                  <Input
                    id="eyeColor"
                    type="text"
                    placeholder={t("placeholderEyeColor")}
                    {...register("eyeColor")}
                    className="h-12 px-5 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white text-base font-bold"
                  />
                </div>
              </div>

              {/* Distinguishing Features */}
              <div className="space-y-3">
                <Label
                  htmlFor="distinguishingFeatures"
                  className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1"
                >
                  {t("formDistinguishing")}
                </Label>
                <Textarea
                  id="distinguishingFeatures"
                  placeholder={t("placeholderDistinguishing")}
                  {...register("distinguishingFeatures")}
                  className="min-h-30 px-6 py-4 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-brand-500/20 focus:border-brand-500 transition-all text-base font-medium resize-none"
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
                <CardTitle className="text-xl font-black text-gray-900">
                  {t("sectionLastSighting")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-10 pb-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
                <div className="space-y-3">
                  <Label
                    htmlFor="date"
                    className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1"
                  >
                    {t("formDateMissing")} <span className="text-brand-500">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <Input
                      id="date"
                      type="date"
                      {...register("date")}
                      className={cn(
                        "h-14 pl-12 pr-6 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white text-base font-bold",
                        errors.date && "border-red-300 bg-red-50/30",
                      )}
                    />
                  </div>
                  <FieldError message={errors.date?.message} />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-100 text-amber-700 w-full">
                    <Info className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-bold leading-tight">
                      {t("mapLocationHint")}
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
                <CardTitle className="text-xl font-black text-gray-900">
                  {t("sectionContact")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-10 pb-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact Phone */}
                <div className="space-y-3">
                  <Label
                    htmlFor="contactPhone"
                    className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1"
                  >
                    {t("formContactPhone")} <span className="text-brand-500">*</span>
                  </Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder={t("placeholderPhone")}
                    {...register("contactPhone")}
                    className={cn(
                      "h-14 px-6 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white text-base font-bold",
                      errors.contactPhone && "border-red-300 bg-red-50/30",
                    )}
                  />
                  <FieldError message={errors.contactPhone?.message} />
                </div>
                {/* Contact Email */}
                <div className="space-y-3">
                  <Label
                    htmlFor="contactEmail"
                    className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1"
                  >
                    {t("formContactEmail")}
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder={t("placeholderEmail")}
                    {...register("contactEmail")}
                    className={cn(
                      "h-14 px-6 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white text-base font-bold",
                      errors.contactEmail && "border-red-300 bg-red-50/30",
                    )}
                  />
                  <FieldError message={errors.contactEmail?.message} />
                </div>
              </div>

              {/* Background / Content */}
              <div className="space-y-3">
                <Label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">
                  {t("formBackground")}
                </Label>
                <div className="rounded-3xl overflow-hidden border border-gray-100 bg-white ring-offset-background focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all">
                  <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder={t("placeholderContent")}
                      />
                    )}
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
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-12 py-7 rounded-2xl bg-brand-600 text-white font-black shadow-xl shadow-brand-600/20 hover:bg-brand-700 hover:-translate-y-1 active:translate-y-0 transition-all w-full sm:w-auto text-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                  {tCommon("submitting")}
                </>
              ) : (
                <>
                  <Send className="w-6 h-6 mr-3" />
                  {mode === "create" ? t("createButton") : tCommon("save")}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
