import test from "node:test";
import assert from "node:assert/strict";
import { formatterFor } from "../src/formatters/index.ts";

const sample = {
  kind: "contacts.results",
  summary: "Matched 2",
  data: { source: "csv" },
  rows: [
    { name: "A", role: "Dev" },
    { name: "B", role: "Founder" }
  ]
};

test("json formatter returns valid json", () => {
  const output = formatterFor("json").format(sample);
  const parsed = JSON.parse(output);
  assert.equal(parsed.kind, "contacts.results");
});

test("csv formatter renders headers and rows", () => {
  const output = formatterFor("csv").format(sample);
  assert.match(output, /^name,role/m);
  assert.match(output, /A,Dev/);
  assert.match(output, /B,Founder/);
});

test("markdown formatter includes citations when present", () => {
  const output = formatterFor("markdown").format({
    ...sample,
    citations: [{ title: "Doc", url: "https://example.com" }]
  });

  assert.match(output, /## Citations/);
  assert.match(output, /\[Doc\]\(https:\/\/example.com\)/);
});
