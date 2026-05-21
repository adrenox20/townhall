import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { endpoints, setToken } from '../lib/api';

export function AuthVerify() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: endpoints.verify,
    onSuccess: (data) => {
      setToken(data.token);
      toast.success('Signed in');
      navigate('/');
      window.location.reload();
    },
    onError: (error) => toast.error(error.message)
  });

  useEffect(() => {
    const token = params.get('token');
    if (token) mutation.mutate(token);
  }, [params]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="panel p-8 text-center max-w-sm">
        <Loader2 size={32} className="text-indigo-400 animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-300">
          {mutation.isPending ? 'Verifying your sign-in link...' : 'Opening your account...'}
        </p>
      </div>
    </div>
  );
}
