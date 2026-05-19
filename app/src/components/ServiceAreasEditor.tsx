import { useState, useEffect, useRef } from 'react';
import { MapPin, X, Plus } from 'lucide-react';

export function ServiceAreasEditor({
  value, suggestions = [], onSave, onCancel,
}: {
  value: string[];
  suggestions?: string[];
  onSave: (next: string[]) => void;
  onCancel: () => void;
}) {
  const [areas, setAreas] = useState<string[]>(value);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = suggestions.filter(
    (s) => !areas.includes(s) && (!draft || s.toLowerCase().includes(draft.toLowerCase())),
  );

  function add(area: string) {
    const clean = area.trim();
    if (!clean) return;
    if (areas.includes(clean)) return;
    setAreas([...areas, clean]);
    setDraft('');
  }

  function remove(area: string) {
    setAreas(areas.filter((a) => a !== area));
  }

  return (
    <div className="card">
      <div className="kicker mb-2 flex items-center gap-1.5">
        <MapPin size={11} /> Service areas
      </div>
      <p className="text-xs text-ink-soft mb-3">
        Areas this volunteer covers. The dispatcher will prefer them when a case lands in one of these.
      </p>

      <div className="flex flex-wrap gap-1.5 mb-3 min-h-[28px]">
        {areas.map((a) => (
          <span key={a} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-sky/15 text-sky text-xs">
            {a}
            <button onClick={() => remove(a)} className="hover:bg-sky/20 rounded-full p-0.5">
              <X size={10} />
            </button>
          </span>
        ))}
        {areas.length === 0 && (
          <span className="text-xs text-ink-muted italic">No areas yet.</span>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add(draft); }
          }}
          placeholder="Banjara Hills, Jubilee Hills, …"
          className="flex-1 px-3 py-2 bg-cream rounded-xl border border-black/10 text-sm"
        />
        <button onClick={() => add(draft)} className="btn-ghost !py-2 !px-3">
          <Plus size={12} /> Add
        </button>
      </div>

      {filtered.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1.5">Suggestions</div>
          <div className="flex flex-wrap gap-1.5">
            {filtered.slice(0, 12).map((s) => (
              <button
                key={s}
                onClick={() => add(s)}
                className="px-2.5 py-1 rounded-full text-[11px] bg-cream hover:bg-cream-deep text-ink-soft hover:text-ink"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-3 border-t border-black/5">
        <button onClick={onCancel} className="text-sm px-3 py-1.5 text-ink-soft hover:text-ink">Cancel</button>
        <button onClick={() => onSave(areas)} className="btn-primary">Save areas</button>
      </div>
    </div>
  );
}
