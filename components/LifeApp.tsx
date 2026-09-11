 "use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

type Slot = "daily" | "monthly" | "analysis";
type Prop = { id: string; name: string; type: string; options: string[] };

const tabs: { id: Slot; label: string; emoji: string; hint: string }[] = [
  { id: "daily", label: "오늘 기록", emoji: "☀️", hint: "오늘의 생활을 1분 안에" },
  { id: "monthly", label: "월간 기록", emoji: "🌼", hint: "한 달의 방향과 목표" },
  { id: "analysis", label: "분석 메모", emoji: "🔎", hint: "숫자에서 발견한 패턴" },
];

const quickGroups: Record<string, string[]> = {
  "기분": ["1", "2", "3", "4", "5"],
  "에너지": ["1", "2", "3", "4", "5"],
  "운동종류": ["걷기", "스트레칭", "근력", "달리기", "홈트", "기타"],
  "공부분야": ["AI", "SW/코딩", "영어", "독서", "자격/강의", "기타"],
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function LifeApp() {
  const [slot, setSlot] = useState<Slot>("daily");
  const [props, setProps] = useState<Prop[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [connections, setConnections] = useState<Record<Slot, string>>({ daily: "", monthly: "", analysis: "" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("my-little-data-connections");
      if (saved) setConnections(JSON.parse(saved));
    } catch {}
  }, []);

  async function loadSchema(nextSlot = slot, explicitId?: string) {
    setLoading(true);
    setMessage("");
    try {
      const id = explicitId ?? connections[nextSlot];
      const query = id ? `&id=${encodeURIComponent(id)}` : "";
      const res = await fetch(`/api/schema?slot=${nextSlot}${query}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProps(data.properties);
      const initial: Record<string, any> = {};
      data.properties.forEach((p: Prop) => {
        if (p.name === "기록일" || p.type === "date") initial[p.name] = today();
        if (p.type === "checkbox") initial[p.name] = false;
        if (p.type === "multi_select") initial[p.name] = [];
      });
      setValues(initial);
    } catch (e: any) {
      setProps([]);
      setMessage(e.message || "연결 설정을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const id = connections.daily || undefined;
    loadSchema("daily", id);
  }, [connections.daily]);

  function switchSlot(next: Slot) {
    setSlot(next);
    loadSchema(next, connections[next] || undefined);
  }

  const titleProp = props.find(p => p.type === "title");
  const dateProp = props.find(p => p.type === "date" || p.name === "기록일");
  const visibleProps = useMemo(() => props.filter(p => p.type !== "title"), [props]);

  function setValue(name: string, value: any) {
    setValues(v => ({ ...v, [name]: value }));
  }

  function toggleMulti(name: string, option: string) {
    const current: string[] = values[name] || [];
    setValue(name, current.includes(option) ? current.filter(x => x !== option) : [...current, option]);
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, values, schema: Object.fromEntries(props.map(p => [p.name, p])), dataSourceId: connections[slot] || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage("저장했어요 ✨ Notion에 한 줄이 쌓였습니다.");
      if (slot === "daily") {
        const reset: Record<string, any> = {};
        props.forEach(p => {
          if (p.name === "기록일" || p.type === "date") reset[p.name] = today();
          else if (p.type === "checkbox") reset[p.name] = false;
          else if (p.type === "multi_select") reset[p.name] = [];
          else reset[p.name] = "";
        });
        setValues(reset);
      }
    } catch (e: any) {
      setMessage(e.message || "저장하지 못했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">✿</div>
          <div>
            <strong>My Little Data</strong>
            <span>나의 생활 데이터</span>
          </div>
        </div>

        <div className="doodle-card">
          <div className="doodle-person">☻</div>
          <p>작게 기록하고<br/><b>나를 알아가기</b></p>
          <span>오늘도 한 줄이면 충분해요.</span>
        </div>

        <nav>
          {tabs.map(t => (
            <button key={t.id} className={`nav-item ${slot === t.id ? "active" : ""}`} onClick={() => switchSlot(t.id)}>
              <span>{t.emoji}</span>
              <div><b>{t.label}</b><small>{t.hint}</small></div>
            </button>
          ))}
        </nav>

        <button className="settings" onClick={() => setSettingsOpen(true)}>⚙️ 연결 설정</button>
        <div className="side-note">Notion에 안전하게 저장<br/>Vercel 서버에서만 API 키 사용</div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">MY LITTLE DATA</span>
            <h1>{tabs.find(t => t.id === slot)?.label}</h1>
            <p>{tabs.find(t => t.id === slot)?.hint} · Notion에 바로 저장</p>
          </div>
          <div className="date-badge">TODAY<br/><b>{today().replaceAll("-", ".")}</b></div>
        </header>

        <div className="paper">
          {loading ? (
            <div className="empty"><div className="spinner"/>불러오는 중…</div>
          ) : props.length === 0 ? (
            <div className="empty">
              <div className="empty-flower">🌼</div>
              <h2>아직 연결된 데이터가 없어요</h2>
              <p>Vercel 환경변수에 이 메뉴의 Notion Data Source ID를 넣어주세요.</p>
              <button className="primary" onClick={() => setSettingsOpen(true)}>연결 방법 보기</button>
            </div>
          ) : (
            <>
              <div className="paper-head">
                <div className="tiny-label">ONE MINUTE RECORD</div>
                <h2>{slot === "daily" ? "오늘의 한 줄을 남겨볼까요?" : "천천히, 필요한 것만 기록해요."}</h2>
                <span>입력한 내용은 저장 버튼 한 번으로 Notion에 들어갑니다.</span>
              </div>

              <div className="form-grid">
                {titleProp && (
                  <label className="field wide">
                    <span>{titleProp.name}<i>*</i></span>
                    <input
                      autoFocus
                      value={values[titleProp.name] || ""}
                      onChange={e => setValue(titleProp.name, e.target.value)}
                      placeholder={slot === "daily" ? "예: 9월 11일 — 차분하게 시작" : "기록 제목을 적어주세요"}
                    />
                  </label>
                )}

                {dateProp && (
                  <label className="field">
                    <span>{dateProp.name}</span>
                    <input type="date" value={values[dateProp.name] || today()} onChange={e => setValue(dateProp.name, e.target.value)} />
                  </label>
                )}

                {visibleProps.filter(p => p.name !== dateProp?.name).map(p => (
                  <Field key={p.id} prop={p} value={values[p.name]} setValue={setValue} toggleMulti={toggleMulti} />
                ))}
              </div>

              <div className="footer-action">
                <div className="save-message">{message}</div>
                <button className="primary save" disabled={saving || !titleProp || !values[titleProp.name]} onClick={save}>
                  {saving ? "저장 중…" : "기록 저장하기  →"}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="bottom-tip">
          <span>✦</span> 기록은 완벽하게 쓰는 것이 아니라 <b>쌓이는 것</b>이 중요해요.
        </div>
      </section>

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          connections={connections}
          setConnections={setConnections}
          onReload={(s, id) => { setSlot(s); loadSchema(s, id || undefined); }}
        />
      )}
    </main>
  );
}

function Field({ prop, value, setValue, toggleMulti }: {
  prop: Prop; value: any; setValue: (n: string, v: any) => void; toggleMulti: (n: string, o: string) => void;
}) {
  const quick = quickGroups[prop.name];

  if (prop.type === "number") {
    return (
      <label className="field">
        <span>{prop.name}</span>
        <input type="number" step="0.5" value={value ?? ""} onChange={e => setValue(prop.name, e.target.value)} placeholder="숫자 입력" />
      </label>
    );
  }

  if (prop.type === "checkbox") {
    return (
      <label className="check-field">
        <input type="checkbox" checked={Boolean(value)} onChange={e => setValue(prop.name, e.target.checked)} />
        <span>{prop.name}</span>
      </label>
    );
  }

  if (prop.type === "select" || prop.type === "status") {
    return (
      <label className="field">
        <span>{prop.name}</span>
        <select value={value || ""} onChange={e => setValue(prop.name, e.target.value)}>
          <option value="">선택하세요</option>
          {prop.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
    );
  }

  if (prop.type === "multi_select") {
    const options = prop.options.length ? prop.options : (quick || []);
    return (
      <div className="field wide">
        <span>{prop.name}</span>
        <div className="chips">
          {options.map(o => (
            <button type="button" key={o} className={(value || []).includes(o) ? "chip selected" : "chip"} onClick={() => toggleMulti(prop.name, o)}>{o}</button>
          ))}
        </div>
      </div>
    );
  }

  if (prop.type === "url" || prop.type === "email" || prop.type === "phone_number") {
    return (
      <label className="field">
        <span>{prop.name}</span>
        <input type={prop.type === "email" ? "email" : prop.type === "url" ? "url" : "tel"} value={value || ""} onChange={e => setValue(prop.name, e.target.value)} />
      </label>
    );
  }

  return (
    <label className="field wide">
      <span>{prop.name}</span>
      <textarea rows={prop.name === "회고" || prop.name === "오늘 잘한 것" ? 4 : 3} value={value || ""} onChange={e => setValue(prop.name, e.target.value)} placeholder="편하게 적어주세요" />
    </label>
  );
}

function SettingsModal({ onClose, connections, setConnections, onReload }: {
  onClose: () => void;
  connections: Record<Slot, string>;
  setConnections: Dispatch<SetStateAction<Record<Slot, string>>>;
  onReload: (slot: Slot, id: string) => void;
}) {
  const [draft, setDraft] = useState(connections);
  function extractId(input: string) {
    const m = input.match(/[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}/);
    return m ? m[0] : input.trim();
  }
  function save() {
    const cleaned = {
      daily: extractId(draft.daily),
      monthly: extractId(draft.monthly),
      analysis: extractId(draft.analysis),
    };
    localStorage.setItem("my-little-data-connections", JSON.stringify(cleaned));
    setConnections(cleaned);
    onClose();
    onReload("daily", cleaned.daily);
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-flower">🌷</div>
        <span className="eyebrow">NOTION CONNECTIONS</span>
        <h2>데이터 주소를 한 번만 붙여넣어요</h2>
        <p>Notion 데이터베이스 URL을 그대로 붙여넣어도 됩니다. 앱이 ID를 자동으로 찾아서 기록 대상으로 기억합니다.</p>

        {(["daily","monthly","analysis"] as Slot[]).map((s) => {
          const label = s === "daily" ? "☀️ 오늘 기록" : s === "monthly" ? "🌼 월간 기록" : "🔎 분석 메모";
          return (
            <label className="field connection-field" key={s}>
              <span>{label}</span>
              <input
                value={draft[s]}
                onChange={e => setDraft(v => ({...v, [s]: e.target.value}))}
                placeholder="https://www.notion.so/... 또는 Data Source ID"
              />
            </label>
          );
        })}

        <div className="notice">현재 Daily Log Data Source ID: <code>241f169d-dd17-478d-905c-a68ce4212711</code><br/>월간/분석 DB가 아직 없다면 비워두세요.</div>
        <div className="settings-actions">
          <button className="secondary" onClick={onClose}>닫기</button>
          <button className="primary" onClick={save}>연결 저장하기</button>
        </div>
        <p className="muted">보안상 Notion Secret은 이 화면에 입력하지 않습니다. Secret은 Vercel의 <code>NOTION_TOKEN</code> 환경변수에만 보관하세요.</p>
      </div>
    </div>
  );
}
