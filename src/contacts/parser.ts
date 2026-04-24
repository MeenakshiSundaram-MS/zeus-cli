import { readFile } from "node:fs/promises";

export interface Contact {
  name: string;
  role: string;
  industry: string;
  location: string;
  company_size: string;
  profile_url?: string;
}

export interface ContactFilters {
  role?: string;
  industry?: string;
  location?: string;
  company_size?: string;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

const REQUIRED_HEADERS = ["name", "role", "industry", "location"];

export async function parseLinkedInCsv(path: string): Promise<Contact[]> {
  let content: string;
  try {
    content = await readFile(path, "utf8");
  } catch {
    throw new Error(
      `Could not read file: ${path}\n` +
      "Export your LinkedIn connections:\n" +
      "  LinkedIn > Me > Settings > Data Privacy > Get a copy of your data > Connections"
    );
  }

  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    throw new Error(
      `CSV file is empty or has no data rows: ${path}\n` +
      "Expected columns: name, role, industry, location, company_size, profile_url"
    );
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    throw new Error(
      `CSV is missing required columns: ${missing.join(", ")}\n` +
      `Found columns: ${headers.join(", ")}\n` +
      "Expected columns: name, role, industry, location, company_size, profile_url"
    );
  }

  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const get = (key: string) => {
      const idx = headers.indexOf(key);
      return idx >= 0 ? cols[idx] ?? "" : "";
    };
    return {
      name: get("name"),
      role: get("role"),
      industry: get("industry"),
      location: get("location"),
      company_size: get("company_size"),
      profile_url: get("profile_url")
    } satisfies Contact;
  });
}

export function parseProfileUrls(urls: string[]): Contact[] {
  return urls.map((url) => ({
    name: "Unknown",
    role: "Unknown",
    industry: "Unknown",
    location: "Unknown",
    company_size: "Unknown",
    profile_url: url
  }));
}

export function filterContacts(contacts: Contact[], filters: ContactFilters): Contact[] {
  return contacts.filter((contact) => {
    if (filters.role && !contact.role.toLowerCase().includes(filters.role.toLowerCase())) {
      return false;
    }
    if (filters.industry && !contact.industry.toLowerCase().includes(filters.industry.toLowerCase())) {
      return false;
    }
    if (filters.location && !contact.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    if (filters.company_size && !contact.company_size.toLowerCase().includes(filters.company_size.toLowerCase())) {
      return false;
    }
    return true;
  });
}
