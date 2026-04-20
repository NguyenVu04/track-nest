"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Loading } from "@/components/loading/Loading";
import { MapView } from "@/components/shared/MapView";
import { EmergencyRequestResponse } from "@/services/emergencyOpsService";
import { useTranslations } from "next-intl";

function formatDateTime(value?: number) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className={mono ? "font-mono text-gray-900 break-all" : "text-gray-900"}>
        {value}
      </div>
    </div>
  );
}

function ProfileCard({
  title,
  name,
  username,
  email,
  phone,
  avatarUrl,
}: {
  title: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  avatarUrl?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-6 h-6" />
          )}
        </div>
        <div>
          <div className="font-semibold text-gray-900">{title}</div>
          <div className="text-sm text-gray-600">{name}</div>
        </div>
      </div>
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          {username}
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          {email}
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4" />
          {phone}
        </div>
      </div>
    </div>
  );
}

export default function EmergencyRequestDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const t = useTranslations("emergencyRequests");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");

  const [request, setRequest] = useState<EmergencyRequestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !params.id) {
      setRequest(null);
      setIsLoading(false);
      return;
    }

    try {
      const requestRaw = sessionStorage.getItem(`emergency-request-detail:${params.id}`);
      if (!requestRaw) {
        setRequest(null);
        return;
      }

      const requestFromStorage = JSON.parse(requestRaw) as EmergencyRequestResponse;
      setRequest(requestFromStorage.id === params.id ? requestFromStorage : null);
    } catch (error) {
      console.error("Error restoring emergency request detail:", error);
      setRequest(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, user]);

  if (!user) return null;
  if (isLoading) return <Loading fullScreen />;

  if (!request) {
    return (
      <div>
        <Breadcrumbs items={[{ label: t("pageTitle"), href: "/dashboard/emergency-requests" }, { label: "Detail" }]} />
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-700">Request not found.</p>
          <button
            onClick={() => router.push("/dashboard/emergency-requests")}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: t("pageTitle"), href: "/dashboard/emergency-requests" },
          { label: request.id.substring(0, 8) },
        ]}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-gray-900 text-xl font-semibold">Emergency Request Detail</h2>
          <p className="text-gray-500 text-sm">{request.id}</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/emergency-requests")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Request Overview</h3>
              <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                {tStatus(request.status.toLowerCase() as Parameters<typeof tStatus>[0])}
              </span>
            </div>
            <div className="grid gap-4 mt-4 md:grid-cols-2">
              <DetailItem label="Opened at" value={formatDateTime(request.openedAt)} />
              <DetailItem label="Closed at" value={formatDateTime(request.closedAt)} />
              <DetailItem label="Sender" value={`${request.senderFirstName} ${request.senderLastName}`} />
              <DetailItem label="Target" value={`${request.targetFirstName} ${request.targetLastName}`} />
              <DetailItem label="Sender email" value={request.senderEmail} />
              <DetailItem label="Target email" value={request.targetEmail} />
              <DetailItem label="Sender phone" value={request.senderPhoneNumber} />
              <DetailItem label="Target phone" value={request.targetPhoneNumber} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ProfileCard
              title="Sender profile"
              name={`${request.senderFirstName} ${request.senderLastName}`}
              username={request.senderUsername}
              email={request.senderEmail}
              phone={request.senderPhoneNumber}
              avatarUrl={request.senderAvatarUrl}
            />
            <ProfileCard
              title="Target profile"
              name={`${request.targetFirstName} ${request.targetLastName}`}
              username={request.targetUsername}
              email={request.targetEmail}
              phone={request.targetPhoneNumber}
              avatarUrl={request.targetAvatarUrl}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
            <div className="h-80 rounded-lg overflow-hidden border border-gray-200">
              <MapView
                center={[request.targetLastLatitude, request.targetLastLongitude]}
                markers={[
                  {
                    position: [request.targetLastLatitude, request.targetLastLongitude],
                    label: "Target location",
                  },
                ]}
                height="320px"
              />
            </div>
            <p className="text-gray-600 text-sm mt-3">
              {request.targetLastLatitude.toFixed(5)}, {request.targetLastLongitude.toFixed(5)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Identifiers</h3>
            <div className="space-y-3 text-sm">
              <DetailItem label="Request ID" value={request.id} mono />
              <DetailItem label="Sender ID" value={request.senderId} mono />
              <DetailItem label="Target ID" value={request.targetId} mono />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push("/dashboard/emergency-requests")}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
      >
        <ArrowLeft className="w-4 h-4" />
        {tCommon("back")}
      </button>
    </div>
  );
}