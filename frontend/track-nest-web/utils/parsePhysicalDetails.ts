export interface ParsedPhysicalDetails {
  age: string;
  gender: string;
  height: string;
  weight: string;
  hairColor: string;
  eyeColor: string;
  distinguishingFeatures: string;
  content: string;
}

/**
 * Extracts physical description fields and remaining TinyMCE content from
 * the HTML blob produced by MissingPersonForm's onSubmit (physicalDetailsHtml).
 *
 * The blob looks like:
 *   <div style="background: #f9fafb; ...">
 *     <h3>Physical Description</h3>
 *     <ul>
 *       <li><strong>Age:</strong> 30</li>
 *       <li><strong>Gender:</strong> male</li>
 *       ...
 *     </ul>
 *     <p ...><strong>Distinguishing Features:</strong> ...</p>
 *   </div>
 *   <!-- remaining TinyMCE content -->
 *
 * Returns empty strings for any field not found or stored as "N/A".
 */
export function parsePhysicalDetailsFromHtml(html: string): ParsedPhysicalDetails {
  const empty: ParsedPhysicalDetails = {
    age: "", gender: "", height: "", weight: "",
    hairColor: "", eyeColor: "", distinguishingFeatures: "", content: html,
  };
  if (typeof window === "undefined") return empty;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const physicalDiv = doc.querySelector('div[style*="background: #f9fafb"]');
  if (!physicalDiv) return empty;

  const getLiValue = (label: string): string => {
    const match = Array.from(physicalDiv.querySelectorAll("li")).find(
      (li) => li.querySelector("strong")?.textContent?.trim() === `${label}:`,
    );
    if (!match) return "";
    const raw = (match.textContent ?? "").replace(`${label}:`, "").trim();
    return raw === "N/A" ? "" : raw;
  };

  let distinguishingFeatures = "";
  const distP = physicalDiv.querySelector("p");
  if (distP) {
    const text = distP.textContent ?? "";
    const idx = text.indexOf(":");
    if (idx !== -1) distinguishingFeatures = text.slice(idx + 1).trim();
  }

  physicalDiv.remove();

  return {
    age: getLiValue("Age"),
    gender: getLiValue("Gender"),
    height: getLiValue("Height").replace(/\s*cm$/i, ""),
    weight: getLiValue("Weight").replace(/\s*kg$/i, ""),
    hairColor: getLiValue("Hair Color"),
    eyeColor: getLiValue("Eye Color"),
    distinguishingFeatures,
    content: doc.body.innerHTML.trim(),
  };
}
