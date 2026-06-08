import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Shield, RefreshCw, Zap, BookOpen, MessageSquare, CreditCard } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Tag, Section, SectionHeader, Spinner, Alert } from '@/components/ui';
import { useProducts } from '@/hooks/useProducts';
import clsx from 'clsx';

/* ── Terminal animation ─────────────────────────────────────────── */
const LINES = [
  { text: '$ helm install my-app ./shipkit-eks --values prod.yaml', color: 'text-accent' },
  { text: '  ↳ ingress, autoscaler, pdb, hpa, network-policy...', color: 'text-muted' },
  { text: '✔ Release deployed in 11.2s  (38 resources)', color: 'text-accent' },
  { text: '$ terraform apply ./shipkit-aws-eks', color: 'text-blue' },
  { text: '  Plan: 42 to add, 0 to change, 0 to destroy.', color: 'text-muted' },
  { text: '✔ Apply complete! Resources: 42 added.', color: 'text-blue' },
  { text: '$ kubectl get pods -n production', color: 'text-accent' },
  { text: '  app-6d9f8b   2/2   Running   0   44s ✓', color: 'text-text2' },
];

function Terminal() {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= LINES.length) return;
    const t = setTimeout(() => setShown((p) => p + 1), shown === 0 ? 600 : 380);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-surface shadow-[0_24px_60px_rgba(0,0,0,.5)] max-w-2xl mx-auto mt-14">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-card border-b border-border">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
        <span className="ml-auto font-mono text-xs text-muted">shipkit — zsh</span>
      </div>
      <div className="p-5 font-mono text-sm leading-8">
        {LINES.slice(0, shown).map((l, i) => (
          <div key={i} className={clsx('animate-fade-up', l.color)}>{l.text}</div>
        ))}
        {shown < LINES.length && (
          <span className="inline-block w-2 h-4 bg-accent animate-blink align-middle" />
        )}
      </div>
    </div>
  );
}

/* ── Hero ───────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-6 border-b border-border overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="max-w-6xl mx-auto text-center relative">
        <div className="flex items-center justify-center gap-3 mb-8 animate-fade-up">
          <div className="w-10 h-px bg-accent opacity-50" />
          <span className="font-mono text-xs tracking-[.15em] uppercase text-accent">Battle-tested DevOps Bundles</span>
          <div className="w-10 h-px bg-accent opacity-50" />
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tight leading-[1.02] mb-6"
          style={{ animationDelay: '.1s' }}>
          <span className="text-heading block">Stop rebuilding</span>
          <span className="text-gradient block">infrastructure.</span>
          <span className="text-muted block">Ship it today.</span>
        </h1>

        <p className="text-lg text-text max-w-xl mx-auto mb-10 leading-relaxed" style={{ animationDelay: '.2s' }}>
          Terraform, Helm, Bash & Docker Compose bundles — written by a senior
          DevOps engineer. Copy. Configure. Deploy.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap" style={{ animationDelay: '.3s' }}>
          <a href="#bundles" className="px-8 py-3.5 bg-accent text-black font-bold text-base rounded-lg hover:opacity-85 transition-opacity shadow-[0_0_32px_rgba(0,255,127,.2)]">
            ⚡ Browse All Kits
          </a>
          <Link to="/download" className="px-7 py-3.5 border border-border text-text2 font-semibold text-base rounded-lg hover:border-blue transition-colors">
            Already bought? Download →
          </Link>
        </div>

        <Terminal />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-10 border-t border-border">
          {[['6+','Ready-made bundles'],['200+','Files & templates'],['4yr','Production-tested'],['30d','Money-back guarantee']].map(([n, l]) => (
            <div key={l} className="text-center">
              <div className="text-3xl font-display font-black text-heading">{n}</div>
              <div className="text-sm text-muted mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Stack pills ────────────────────────────────────────────────── */
const STACK = [
  ['Kubernetes','#326ce5'],['Terraform','#7b42bc'],['Docker','#0db7ed'],
  ['Helm','#f25e30'],['AWS EKS','#ff9900'],['Prometheus','#e97623'],
  ['Grafana','#f46800'],['GitHub Actions','#24292e'],['ArgoCD','#00b39f'],
  ['Bash','#4eaa25'],['HAProxy','#00a98f'],['Harbor','#1ba0e2'],
];

/* ── Why section ────────────────────────────────────────────────── */
const WHY = [
  [Zap,        'Deploy in minutes',     'Copy, configure, run. Most kits go live in under 60 minutes.'],
  [Shield,     'Production-grade',      'RBAC, resource limits, network policies — security already done.'],
  [BookOpen,   'Fully documented',      'Inline comments, README, and variable references. No guessing.'],
  [RefreshCw,  'Free lifetime updates', 'When Terraform or K8s breaks, your kit gets updated.'],
  [MessageSquare,'Email support',       'Stuck on a config? Reply within 24h on business days.'],
  [CreditCard, 'Payoneer-friendly',     'Sold via Gumroad — works with Payoneer and major cards worldwide.'],
];

/* ── FAQ ────────────────────────────────────────────────────────── */
const FAQS = [
  ['What format are the files in?', 'All bundles deliver as a .zip via Gumroad. Inside: organized folders, all source files (.tf, .yaml, .sh, .json), and a README.md with setup instructions.'],
  ['Do I need specific AWS permissions?', 'The EKS kit needs AdministratorAccess or equivalent. The README includes a scoped IAM policy if you prefer minimal permissions.'],
  ['Can I use these for client projects?', 'Yes — every purchase includes a commercial license. Use freely in your own projects, your employer\'s infra, or client work.'],
  ['What Terraform/K8s versions are supported?', 'Terraform ≥ 1.5 and Kubernetes ≥ 1.28. EKS kits tested on 1.29/1.30. All versions documented in each kit\'s README.'],
  ['How do I get updates?', 'Gumroad emails you when a new version drops. Re-download at no cost from your Gumroad library forever.'],
  ['How does the refund work?', 'Email within 30 days — full refund, no questions. Gumroad also has built-in buyer dispute protection.'],
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={clsx('bg-card border rounded-lg overflow-hidden transition-colors', open ? 'border-accent/30' : 'border-border')}>
      <button onClick={() => setOpen(!open)} className="w-full px-5 py-4 text-left flex justify-between items-center gap-4">
        <span className={clsx('text-sm font-bold', open ? 'text-accent' : 'text-heading')}>{q}</span>
        <span className={clsx('text-xl text-muted transition-transform shrink-0', open && 'rotate-45')}>+</span>
      </button>
      {open && <div className="px-5 pb-4 text-sm text-muted leading-relaxed">{a}</div>}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function HomePage() {
  const { products, loading, error } = useProducts();

  return (
    <>
      <Hero />

      {/* Stack */}
      <section className="py-12 border-b border-border">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center font-mono text-xs tracking-[.15em] uppercase text-muted mb-7">Built with battle-tested tools</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {STACK.map(([name, color]) => (
              <div key={name} className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full font-mono text-xs font-bold text-text2 hover:border-accent hover:text-accent transition-colors cursor-default">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <Section id="bundles">
        <SectionHeader tag="📦 All Bundles" title="Pick your kit. Deploy in minutes." subtitle="Every bundle ships with docs, inline comments, and a quick-start guide." />
        {loading && <div className="flex justify-center py-16"><Spinner size={32} className="text-accent" /></div>}
        {error   && <Alert type="error">{error}</Alert>}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} featured={i === 0} />
            ))}
          </div>
        )}

        {/* Bundle deal */}
        {!loading && !error && products.length > 0 && (
          <div className="mt-5 border border-yellow/25 rounded-2xl p-7 bg-card hover:border-yellow/50 transition-colors">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">🎁</span>
                  <span className="font-mono text-xs font-bold bg-yellow text-black px-2.5 py-0.5 rounded">SAVE 45%</span>
                </div>
                <h3 className="text-2xl font-display font-black text-heading mb-2">The Complete ShipKit Bundle</h3>
                <p className="text-sm text-muted mb-4">All 3 kits + 30-min onboarding call + 60-day priority email support.</p>
                <div className="flex flex-wrap gap-2">
                  {['☸️ K8s Kit','🏗️ Terraform','🐳 Docker'].map((t) => (
                    <Tag key={t} color="yellow" small>{t}</Tag>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-3 shrink-0">
                <div className="text-right">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-display font-black text-heading">$89</span>
                    <span className="text-lg text-muted line-through">$107</span>
                  </div>
                  <div className="text-xs text-muted">all kits · instant download</div>
                </div>
                <a href="https://gumroad.com/l/REPLACE_complete-bundle" className="gumroad-button !px-6 !py-3 !text-base" data-gumroad-single-product="true">
                  🎁 Get Everything →
                </a>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* Why */}
      <section className="py-20 bg-surface border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader tag="✅ Why ShipKit" title="Not templates. Tested code." subtitle="Every file was built for real production environments." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHY.map(([Icon, title, desc]) => (
              <div key={title} className="p-6 bg-card border border-border rounded-xl hover:border-accent/40 transition-colors cursor-default">
                <Icon size={24} className="text-accent mb-4" />
                <h4 className="font-bold text-heading mb-2">{title}</h4>
                <p className="text-sm text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <Section>
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-8 bg-card border border-border rounded-2xl p-10">
          <div className="w-24 h-24 rounded-full bg-accent/10 border-2 border-accent/25 flex items-center justify-center text-5xl shrink-0 animate-glow">🛡️</div>
          <div>
            <h3 className="text-xl font-display font-black text-heading mb-3">30-Day Money-Back Guarantee</h3>
            <p className="text-sm text-muted leading-relaxed">
              If any kit doesn't work as described in its README, or you're unsatisfied for any reason —
              email within 30 days for a full refund, no questions asked.
              Every purchase is additionally protected by Gumroad's buyer guarantee.
            </p>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <section className="py-20 bg-surface border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader tag="❓ FAQ" title="Questions? Answered." />
          <div className="max-w-2xl mx-auto space-y-3">
            {FAQS.map(([q, a]) => <FAQItem key={q} q={q} a={a} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <Section className="text-center border-t border-border">
        <div className="max-w-lg mx-auto">
          <Tag>🚀 Ready to ship?</Tag>
          <h2 className="text-4xl md:text-5xl font-display font-black text-heading tracking-tight mt-4 mb-4">
            Your infra, done right — today.
          </h2>
          <p className="text-muted mb-8">Pick one kit or grab everything. Either way, you're deploying production-grade infra tonight.</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a href="#bundles" className="px-8 py-3.5 bg-accent text-black font-bold rounded-lg hover:opacity-85 transition-opacity">⚡ Browse Kits</a>
            <Link to="/download" className="px-7 py-3.5 border border-border text-text2 font-semibold rounded-lg hover:border-accent transition-colors">Already bought? Download</Link>
          </div>
        </div>
      </Section>
    </>
  );
}
