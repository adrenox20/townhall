import { FormEvent, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertTriangle, ArrowLeft, Send } from 'lucide-react';
import { endpoints } from '../lib/api';

export function IssueAppeal() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');

  const { data: issueData } = useQuery({ queryKey: ['issue', id], queryFn: () => endpoints.issue(id), enabled: Boolean(id) });
  const mutation = useMutation({
    mutationFn: () => endpoints.appealIssue(id, reason),
    onSuccess: () => {
      toast.success('Appeal submitted. Student Council will review it.');
      navigate(`/issues/${id}`);
    },
    onError: (e) => toast.error(e.message)
  });

  const issue = issueData?.issue;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to issue
      </button>

      <div className="panel p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-white font-display">Appeal Rejection</h1>
          <p className="text-sm text-slate-400 mt-1">You can appeal once per issue. Make it count.</p>
        </div>

        {issue && (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-xs text-slate-500 mb-1">Issue</p>
            <p className="text-sm font-medium text-white">{issue.title}</p>
          </div>
        )}

        {issue?.council_note && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-xs font-semibold text-red-300">Rejection Reason</span>
            </div>
            <p className="text-sm text-slate-300">{issue.council_note}</p>
          </div>
        )}

        <form onSubmit={(e: FormEvent) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Your Appeal <span className="text-slate-500">(min 50 characters)</span>
            </label>
            <textarea
              className="field min-h-40"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Explain why you believe this issue should be reconsidered. Provide additional context, evidence, or clarification that wasn't included in the original submission."
              minLength={50}
              required
            />
            <p className="mt-1 text-xs text-slate-500">{reason.length} / 50 minimum chars</p>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">
            You only get one appeal per issue. Once submitted, this cannot be undone.
          </div>

          <button
            className="btn-primary w-full"
            disabled={reason.length < 50 || mutation.isPending}
          >
            <Send size={16} /> {mutation.isPending ? 'Submitting appeal...' : 'Submit Appeal'}
          </button>
        </form>
      </div>
    </div>
  );
}
