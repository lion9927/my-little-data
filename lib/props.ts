type SchemaProp = {
  id: string;
  name: string;
  type: string;
  [key: string]: any;
};

function richText(content: string) {
  return content ? [{ type: "text", text: { content: String(content).slice(0, 2000) } }] : [];
}

function title(content: string) {
  return richText(content);
}

export function toNotionProperties(
  schema: Record<string, SchemaProp>,
  values: Record<string, any>
) {
  const result: Record<string, any> = {};

  for (const [name, def] of Object.entries(schema)) {
    if (["formula", "rollup", "created_time", "created_by", "last_edited_time", "last_edited_by", "unique_id"].includes(def.type)) {
      continue;
    }

    const raw = values[name];
    if (raw === undefined || raw === null || raw === "") continue;

    switch (def.type) {
      case "title":
        result[name] = { title: title(String(raw)) };
        break;
      case "rich_text":
        result[name] = { rich_text: richText(String(raw)) };
        break;
      case "number": {
        const n = Number(raw);
        if (!Number.isNaN(n)) result[name] = { number: n };
        break;
      }
      case "checkbox":
        result[name] = { checkbox: Boolean(raw) };
        break;
      case "date":
        result[name] = { date: { start: String(raw) } };
        break;
      case "url":
        result[name] = { url: String(raw) };
        break;
      case "email":
        result[name] = { email: String(raw) };
        break;
      case "phone_number":
        result[name] = { phone_number: String(raw) };
        break;
      case "select":
        result[name] = { select: { name: String(raw) } };
        break;
      case "status":
        result[name] = { status: { name: String(raw) } };
        break;
      case "multi_select": {
        const arr = Array.isArray(raw) ? raw : String(raw).split(",").map(s => s.trim()).filter(Boolean);
        result[name] = { multi_select: arr.map((x: string) => ({ name: x })) };
        break;
      }
      default:
        // Unsupported complex types are intentionally skipped rather than creating bad rows.
        break;
    }
  }

  return result;
}

export function editableSchema(schema: Record<string, SchemaProp>) {
  return Object.values(schema)
    .filter(p => !["formula", "rollup", "created_time", "created_by", "last_edited_time", "last_edited_by", "unique_id"].includes(p.type))
    .map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      options: p.options?.map((o: any) => o.name) ?? [],
    }));
}
