// ─── AboutPage.jsx ────────────────────────────────────────────────
import { Link } from 'react-router-dom';
import { Section } from '@/components/ui';

export function AboutPage() {
  return (
    <Section className="pt-28 max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">👩‍💻</div>
        <h1 className="text-5xl font-display font-black text-heading mb-4">About ShipKit</h1>
        <p className="text-muted text-lg">Built by a DevOps engineer, for DevOps engineers.</p>
      </div>

      <div className="space-y-6 text-sm text-text2 leading-relaxed bg-card border border-border rounded-2xl p-8">
        <p>
          ShipKit was built out of frustration. Every new project meant rebuilding the same EKS cluster,
          the same Terraform VPC module, the same GitHub Actions pipeline — from scratch.
          Documentation was scattered. Examples were outdated. Stack Overflow was lying.
        </p>
        <p>
          After 4+ years of production Kubernetes, AWS, Terraform, and CI/CD work, I packaged
          everything that actually works into clean, well-documented bundles. Zero fluff.
          Real configs from real production environments.
        </p>
        <p>
          Every file is commented. Every README explains the why, not just the how.
          You get the same code I'd use for a client project — not a tutorial demo.
        </p>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          {[['4+','Years of production DevOps'],['200+','Files across all bundles'],['3','Supported cloud-native stacks'],['30d','Refund, no questions']].map(([n, l]) => (
            <div key={l} className="text-center p-4 bg-surface rounded-xl border border-border">
              <div className="text-3xl font-display font-black text-accent">{n}</div>
              <div className="text-xs text-muted mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-10">
        <Link to="/" className="px-8 py-3.5 bg-accent text-black font-bold rounded-lg hover:opacity-85 transition-opacity">
          Browse the bundles →
        </Link>
      </div>
    </Section>
  );
}

export default AboutPage;
