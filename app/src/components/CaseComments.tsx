import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import {
  listCaseComments, addCaseComment, deleteCaseComment,
} from '../lib/queries';

export function CaseComments({ orgId, caseId }: { orgId: string; caseId: string }) {
  const { session } = useAuth();
  const qc = useQueryClient();
  const me = session?.user.id;
  const [body, setBody] = useState('');

  const comments = useQuery({
    queryKey: ['case-comments', caseId],
    queryFn: () => listCaseComments(caseId),
    enabled: !!caseId,
  });

  const post = useMutation({
    mutationFn: async () => {
      const text = body.trim();
      if (!text) return;
      await addCaseComment(orgId, caseId, text);
    },
    onSuccess: () => {
      setBody('');
      qc.invalidateQueries({ queryKey: ['case-comments', caseId] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCaseComment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['case-comments', caseId] }),
  });

  const rows = comments.data ?? [];

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle size={14} className="text-ink-soft" />
        <h3 className="display text-xl">Notes <em className="italic text-ink-soft text-sm not-italic">· team-internal</em></h3>
        <span className="ml-auto kicker">{rows.length}</span>
      </div>

      <ul className="space-y-3 mb-4">
        {rows.map((c: any) => (
          <li key={c.id} className="grid grid-cols-[28px_1fr_auto] gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-cream grid place-items-center text-xs text-ink-soft font-medium">
              {(c.author?.display_name?.[0] ?? '?').toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-medium">{c.author?.display_name ?? 'Unknown'}</span>
                <span className="text-[10px] font-mono text-ink-muted">
                  {when(c.created_at)}
                  {c.edited_at && ' · edited'}
                </span>
              </div>
              <p className="text-sm text-ink mt-0.5 whitespace-pre-wrap break-words">{c.body}</p>
            </div>
            {c.author_id === me && (
              <button
                onClick={() => remove.mutate(c.id)}
                className="p-1.5 text-ink-soft hover:text-rust opacity-0 group-hover:opacity-100"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            )}
          </li>
        ))}
        {!comments.isLoading && rows.length === 0 && (
          <li className="text-sm text-ink-soft italic">No notes yet. Coordinators and field rescuers can leave updates here without leaving the app.</li>
        )}
      </ul>

      <div className="pt-3 border-t border-black/5">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) post.mutate();
          }}
          placeholder="Add a note for the team — visible only inside Karuna."
          className="w-full px-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm resize-y min-h-[72px]"
          rows={2}
        />
        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="text-[10px] text-ink-muted">⌘+Enter to post</span>
          <button
            onClick={() => post.mutate()}
            disabled={!body.trim() || post.isPending}
            className="btn-primary"
          >
            <Send size={12} /> Post note
          </button>
        </div>
      </div>
    </div>
  );
}

function when(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
