// CSV-ის პარსერი (RFC 4180): მხარს უჭერს ბრჭყალებში ჩასმულ ველებს,
// მძიმეს, ორმაგ ბრჭყალს ("") და ველში ახალი ხაზის სიმბოლოებს.
export function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // BOM

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"' && field === "") {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// პირველი ხაზი სათაურებია; ბრუნდება ობიექტების მასივი. ცარიელი ხაზები გამოტოვებულია.
export function rowsToObjects(rows) {
  if (rows.length === 0) return { columns: [], records: [] };

  const columns = rows[0].map((name) => name.trim().toLowerCase());
  const records = [];

  for (const cells of rows.slice(1)) {
    if (cells.every((cell) => cell.trim() === "")) continue;
    const record = {};
    columns.forEach((name, index) => {
      record[name] = (cells[index] ?? "").replace(/\r\n?/g, "\n").trim();
    });
    records.push(record);
  }
  return { columns, records };
}
