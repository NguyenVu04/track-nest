"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Lock, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type ProfileFormValues = {
  fullName: string;
  email: string;
};

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 ml-1 text-sm text-red-500 font-medium">{message}</p>;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const t = useTranslations("profile");

  const profileSchema = useMemo(
    () =>
      z.object({
        fullName: z.string().min(2, t("validation.fullNameMin")),
        email: z
          .string()
          .min(1, t("validation.emailInvalid"))
          .refine(
            (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
            t("validation.emailInvalid"),
          ),
      }),
    [t],
  );

  const passwordSchema = useMemo(
    () =>
      z
        .object({
          currentPassword: z.string().min(1, t("validation.currentPasswordRequired")),
          newPassword: z.string().min(8, t("validation.newPasswordMin")),
          confirmPassword: z.string().min(1, t("validation.currentPasswordRequired")),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: t("validation.confirmPasswordMatch"),
          path: ["confirmPassword"],
        }),
    [t],
  );

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  if (!user) return null;

  const onUpdateProfile = async (_data: ProfileFormValues) => {
    try {
      // TODO: wire to authService / Keycloak profile update API
      toast.success(t("toastProfileUpdated"));
    } catch {
      toast.error(t("toastProfileError"));
    }
  };

  const onUpdatePassword = async (_data: PasswordFormValues) => {
    try {
      // TODO: wire to authService / Keycloak password change API
      resetPassword();
      toast.success(t("toastPasswordUpdated"));
    } catch {
      toast.error(t("toastPasswordError"));
    }
  };

  return (
    <div className="max-w-4xl">
      <Breadcrumbs items={[{ label: t("pageTitle") }]} />
      <h2 className="text-gray-900 mb-6 text-xl font-bold">{t("pageTitle")}</h2>

      <div className="grid gap-6">
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4 font-medium">{t("profileInfo")}</h3>
          <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-gray-700 mb-2">
                {t("labelUsername")}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  value={user.username}
                  disabled
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-gray-700 mb-2">
                {t("labelFullName")}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="fullName"
                  type="text"
                  {...registerProfile("fullName")}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                />
              </div>
              <FieldError message={profileErrors.fullName?.message} />
            </div>

            <div>
              <label htmlFor="email" className="block text-gray-700 mb-2">
                {t("labelEmail")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  {...registerProfile("email")}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                />
              </div>
              <FieldError message={profileErrors.email?.message} />
            </div>

            <div>
              <label htmlFor="role" className="block text-gray-700 mb-2">
                {t("labelRole")}
              </label>
              <input
                id="role"
                type="text"
                value={user.role}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            <button
              type="submit"
              disabled={isProfileSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {t("updateProfile")}
            </button>
          </form>
        </div>

        {/* Password Change */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4 font-medium">{t("changePassword")}</h3>
          <form onSubmit={handlePasswordSubmit(onUpdatePassword)} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-gray-700 mb-2">
                {t("labelCurrentPassword")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="currentPassword"
                  type="password"
                  {...registerPassword("currentPassword")}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                />
              </div>
              <FieldError message={passwordErrors.currentPassword?.message} />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-gray-700 mb-2">
                {t("labelNewPassword")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="newPassword"
                  type="password"
                  {...registerPassword("newPassword")}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                />
              </div>
              <FieldError message={passwordErrors.newPassword?.message} />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">
                {t("labelConfirmPassword")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  {...registerPassword("confirmPassword")}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                />
              </div>
              <FieldError message={passwordErrors.confirmPassword?.message} />
            </div>

            <button
              type="submit"
              disabled={isPasswordSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {t("updatePassword")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
