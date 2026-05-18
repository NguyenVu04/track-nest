"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  MapPin,
  Clock,
  ExternalLink,
  FileText,
  Activity,
  Plus,
  List,
  Headset,
  ShieldCheck,
  Wifi,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Loading } from "@/components/loading/Loading";
import { MapView } from "@/components/shared/MapView";
import { EmergencyRequestResponse } from "@/services/emergencyOpsService";
import { useTranslations } from "next-intl";

function formatDateTime(value?: number) {
  if (!value) return "-";
  const date = new Date(value);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  const dateStr = date.toLocaleDateString('en-US', options);
  
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  const timeStr = `${hours}:${minutes} ${ampm}`;

  return `${dateStr} at ${timeStr}`;
}

function timeAgo(value?: number) {
  if (!value) return "";
  const diffInMinutes = Math.floor((Date.now() - value) / 60000);
  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
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
    <div className="py-1">
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</div>
      <div className={mono ? "font-mono font-bold text-gray-800 break-all text-sm" : "text-gray-800 font-bold text-sm"}>
        {value}
      </div>
    </div>
  );
}

function ProfileCard({
  role,
  name,
  email,
  avatarUrl,
  badgeColor,
}: {
  role: "SENDER" | "TARGET";
  name: string;
  email: string;
  avatarUrl?: string;
  badgeColor: "gray" | "red";
}) {
  const badgeClasses = {
    gray: "bg-gray-200 text-gray-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm relative flex flex-col items-center text-center">
      <div className={`absolute top-4 right-4 px-3 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${badgeClasses[badgeColor]}`}>
        {role}
      </div>
      <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 text-indigo-400 flex items-center justify-center overflow-hidden mb-5 shadow-sm border border-gray-100 mt-2">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <User className="w-10 h-10" />
        )}
      </div>
      <div className="font-bold text-gray-900 text-xl mb-1">{name}</div>
      <div className="text-sm font-medium text-gray-500">{email}</div>
    </div>
  );
}

function EmergencyRequestDetailContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const backHref = searchParams.get("from") === "admin"
    ? "/dashboard/emergency-requests/admin"
    : "/dashboard/emergency-requests";
  const t = useTranslations("emergencyRequests");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");

  const [request, setRequest] = useState<EmergencyRequestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* eslint-disable react-hooks/set-state-in-effect */
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
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!user) return null;
  if (isLoading) return <Loading fullScreen />;

  if (!request) {
    return (
      <div>
        <Breadcrumbs items={[{ label: t("pageTitle"), href: backHref }, { label: "Detail" }]} />
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-4">
          <p className="text-gray-700">Request not found.</p>
          <button
            onClick={() => router.push(backHref)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to list
          </button>
        </div>
      </div>
    );
  }

  const shortId = request.id.substring(0, 8).toUpperCase();

  return (
    <div className="max-w-[1200px] mx-auto pb-12">
      {/* Custom Breadcrumb matching mockup style somewhat */}
      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-6">
        <button onClick={() => router.push(backHref)} className="hover:text-gray-900 transition-colors">
          Emergency Hub
        </button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-brand-700">Request {shortId}</span>
      </div>

      <div className="flex flex-col gap-6">
        {/* Header Card */}
        <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          {/* Left border accent */}
          <div className="absolute left-0 top-0 bottom-0 w-3 bg-brand-700"></div>
          
          <div className="flex items-center gap-5 pl-4">
            <div className="w-16 h-16 rounded-full bg-brand-200/50 flex items-center justify-center flex-shrink-0">
              <Wifi className="w-7 h-7 text-brand-800" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Emergency Request: {shortId}</h1>
              <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                <Clock className="w-4 h-4" />
                <span>Initiated {formatDateTime(request.openedAt)} ({timeAgo(request.openedAt)})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-6 py-2.5 bg-cyan-100/80 rounded-full shrink-0 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500"></div>
            <span className="font-semibold text-cyan-800 text-sm tracking-wide">
              {tStatus(request.status.toLowerCase() as any)}
            </span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Map Card */}
          <div className="lg:col-span-2 bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-gray-900 font-bold tracking-tight">
                <MapPin className="w-5 h-5 text-brand-600" />
                Real-Time Incident Location
              </div>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${request.targetLastLatitude},${request.targetLastLongitude}`} 
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-brand-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-brand-300 transition-all shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Maps
              </a>
            </div>
            
            <div className="relative flex-grow rounded-2xl overflow-hidden border border-gray-100 min-h-[360px] bg-gray-50">
               <div className="absolute inset-0">
                 <MapView
                    center={[request.targetLastLatitude, request.targetLastLongitude]}
                    markers={[
                      {
                        position: [request.targetLastLatitude, request.targetLastLongitude],
                        label: "Target location",
                      },
                    ]}
                    height="100%"
                  />
               </div>
               
               {/* Floating Coordinates Overlay */}
               <div className="absolute bottom-5 left-5 z-[400] bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-100/80 min-w-[200px]">
                 <div className="text-[10px] font-bold tracking-widest text-brand-600 mb-1.5 uppercase">Coordinates</div>
                 <div className="font-bold text-gray-900 mb-1 text-sm">
                   {Math.abs(request.targetLastLatitude).toFixed(4)}° {request.targetLastLatitude >= 0 ? 'N' : 'S'}, {Math.abs(request.targetLastLongitude).toFixed(4)}° {request.targetLastLongitude >= 0 ? 'E' : 'W'}
                 </div>
                 <div className="text-xs text-gray-500 font-medium mt-1.5">Last updated {timeAgo(request.openedAt)}</div>
               </div>
            </div>
          </div>

          {/* Case Identifiers Card */}
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex items-center gap-2 text-gray-900 font-bold tracking-tight mb-8">
              <Activity className="w-5 h-5 text-brand-600" />
              Case Identifiers
            </div>

            <div className="flex flex-col space-y-6 flex-grow">
              <DetailItem label="Request ID" value={`#REQ-${shortId}-${new Date(request.openedAt).getFullYear()}`} mono />
              
              <div className="w-full h-px bg-gray-100"></div>
              
              <DetailItem label="Sender System ID" value={`UID-${request.senderId.substring(0,8).toUpperCase()}`} mono />
              
              <div className="w-full h-px bg-gray-100"></div>
              
              <DetailItem label="Target System ID" value={`UID-${request.targetId.substring(0,8).toUpperCase()}`} mono />
            </div>

            <div className="mt-8 bg-gray-50 rounded-xl p-4 flex items-center gap-4 border border-gray-100">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              <div className="text-sm font-semibold text-gray-800">
                Security Protocol 4.2<br/>
                <span className="text-gray-500 font-medium">Active</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <ProfileCard 
            role="SENDER"
            name={`${request.senderFirstName} ${request.senderLastName}`}
            email={request.senderEmail}
            avatarUrl={request.senderAvatarUrl}
            badgeColor="gray"
          />

          <ProfileCard 
            role="TARGET"
            name={`${request.targetFirstName} ${request.targetLastName}`}
            email={request.targetEmail}
            avatarUrl={request.targetAvatarUrl}
            badgeColor="red"
          />

          {/* Actions Stack */}
          <div className="flex flex-col gap-4">
            <button className="flex-grow flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-brand-200 hover:shadow-md transition-all group">
              <div className="flex items-center gap-4 font-bold text-gray-900">
                <div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600">
                  <List className="w-5 h-5" />
                </div>
                View Activity Logs
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180 group-hover:text-brand-600 transition-colors" />
            </button>

            <div className="flex gap-4 flex-grow">
               <button className="flex-grow flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-brand-200 hover:shadow-md transition-all font-bold text-gray-900">
                 <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                   <Headset className="w-5 h-5" />
                 </div>
                 Contact Support
               </button>
               
               <button className="w-[88px] flex-shrink-0 bg-brand-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-600/30 hover:bg-brand-700 hover:scale-105 transition-all">
                 <Plus className="w-8 h-8" />
               </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function EmergencyRequestDetailPage() {
  return (
    <Suspense>
      <EmergencyRequestDetailContent />
    </Suspense>
  );
}