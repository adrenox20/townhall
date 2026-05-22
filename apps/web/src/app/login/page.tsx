import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  return <div className="mx-auto max-w-md"><Card><CardHeader><h2 className="text-xl font-semibold">University sign in</h2></CardHeader><CardContent className="space-y-4"><Input placeholder="name@university.edu" /><Button className="w-full"><Mail size={16} /> Send magic link</Button><Button className="w-full bg-foreground text-background">Continue with Google</Button></CardContent></Card></div>;
}
