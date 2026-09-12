import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

type Row = { id: number; name: string; note?: string };

describe("toCsv", () => {
  it("builds a header row from column definitions", () => {
    const csv = toCsv<Row>([], [
      { header: "ID", value: (r) => r.id },
      { header: "Name", value: (r) => r.name },
    ]);
    expect(csv).toBe("ID,Name");
  });

  it("renders one line per row in column order", () => {
    const rows: Row[] = [
      { id: 1, name: "Ayesha" },
      { id: 2, name: "Bilal" },
    ];
    const csv = toCsv(rows, [
      { header: "ID", value: (r) => r.id },
      { header: "Name", value: (r) => r.name },
    ]);
    expect(csv).toBe("ID,Name\n1,Ayesha\n2,Bilal");
  });

  it("quotes and escapes values containing commas or quotes", () => {
    const rows: Row[] = [{ id: 1, name: 'Store, "Best" Deals' }];
    const csv = toCsv(rows, [{ header: "Name", value: (r) => r.name }]);
    expect(csv).toBe('Name\n"Store, ""Best"" Deals"');
  });

  it("renders missing values as an empty cell", () => {
    const rows: Row[] = [{ id: 1, name: "Ayesha" }];
    const csv = toCsv(rows, [{ header: "Note", value: (r) => r.note }]);
    expect(csv).toBe("Note\n");
  });
});
