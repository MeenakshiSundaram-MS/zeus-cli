import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { filterContacts, parseLinkedInCsv, parseProfileUrls } from "../src/contacts/parser.ts";

test("parseLinkedInCsv parses contacts", async () => {
  const dir = await mkdtemp(join(tmpdir(), "zeus-contacts-"));
  const file = join(dir, "contacts.csv");
  await writeFile(
    file,
    "name,role,industry,location,company_size,profile_url\nJane Doe,Engineer,SaaS,India,51-200,https://linkedin.com/in/jane\n",
    "utf8"
  );

  const contacts = await parseLinkedInCsv(file);
  assert.equal(contacts.length, 1);
  assert.equal(contacts[0].name, "Jane Doe");
  assert.equal(contacts[0].industry, "SaaS");
});

test("filterContacts filters by role and location", () => {
  const contacts = [
    {
      name: "A",
      role: "Software Engineer",
      industry: "SaaS",
      location: "Bangalore",
      company_size: "51-200",
      profile_url: "u1"
    },
    {
      name: "B",
      role: "Founder",
      industry: "Fintech",
      location: "Chennai",
      company_size: "11-50",
      profile_url: "u2"
    }
  ];

  const filtered = filterContacts(contacts, { role: "engineer", location: "bangalore" });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].name, "A");
});

test("parseProfileUrls normalizes url list", () => {
  const urls = ["https://linkedin.com/in/alice", "https://linkedin.com/in/bob"];
  const contacts = parseProfileUrls(urls);
  assert.equal(contacts.length, 2);
  assert.equal(contacts[1].profile_url, urls[1]);
});
