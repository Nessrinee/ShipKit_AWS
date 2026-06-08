import { Link } from 'react-router-dom';
import { Section } from '@/components/ui';

export default function NotFoundPage() {
  return (
    <Section className="pt-28 text-center">
      <div className="max-w-md mx-auto">
        <div className="font-mono text-8xl font-black text-border mb-6">404</div>
        <h1 className="text-3xl font-display font-black text-heading mb-4">Page not found</h1>
        <p className="text-muted text-sm mb-8">The route you're looking for doesn't exist.</p>
        <Link to="/" className="px-8 py-3 bg-accent text-black font-bold rounded-lg hover:opacity-85 transition-opacity">
          ← Back to store
        </Link>
      </div>
    </Section>
  );
}
