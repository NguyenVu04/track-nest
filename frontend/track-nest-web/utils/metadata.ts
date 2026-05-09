import { cookies } from "next/headers";
import enMessages from "@/messages/en.json";
import viMessages from "@/messages/vi.json";

export async function getMetadataMessages() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value || "en") as "en" | "vi";
  return locale === "vi" ? viMessages : enMessages;
}
