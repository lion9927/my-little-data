const NOTION_VERSION = "2026-03-11";

type Slot = "daily" | "monthly" | "analysis";

const ENV_KEYS: Record<Slot, string> = {
  daily: "NOTION_DAILY_DATA_SOURCE_ID",
  monthly: "NOTION_MONTHLY_DATA_SOURCE_ID",
  analysis: "NOTION_ANALYSIS_DATA_SOURCE_ID",
};

export function getDataSourceId(slot: Slot, requestedId?: string) {
  const token = process.env.NOTION_TOKEN;
  const configuredId = process.env[ENV_KEYS[slot]];
  if (!token) throw new Error("NOTION_TOKEN is missing.");
  const id = requestedId || configuredId;
  if (!id) throw new Error(`${ENV_KEYS[slot]} is missing.`);
  // If an env ID exists, only that ID is accepted. This prevents the public endpoint
  // from being used to write to arbitrary Notion data sources.
  if (configuredId && requestedId && configuredId.replaceAll("-", "") !== requestedId.replaceAll("-", "")) {
    throw new Error("이 메뉴에 등록된 Notion 주소가 아닙니다.");
  }
  return { token, id };
}

async function notionFetch(path: string, init: RequestInit = {}) {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN is missing.");
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) {
    const message = data?.message || `Notion API error ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export async function getSchema(slot: Slot, requestedId?: string) {
  const { id } = getDataSourceId(slot, requestedId);
  return notionFetch(`/data_sources/${id}`);
}

export async function createPage(slot: Slot, properties: Record<string, unknown>, requestedId?: string) {
  const { id } = getDataSourceId(slot, requestedId);
  return notionFetch(`/pages`, {
    method: "POST",
    body: JSON.stringify({
      parent: { data_source_id: id },
      properties,
    }),
  });
}

export async function getRecent(slot: Slot) {
  const { id } = getDataSourceId(slot);
  return notionFetch(`/data_sources/${id}/query`, {
    method: "POST",
    body: JSON.stringify({
      page_size: 10,
      sorts: [{ property: "created_time", direction: "descending" }],
    }),
  });
}
