import { useParams, Link } from 'react-router-dom';
import { Check, ArrowLeft, FolderOpen } from 'lucide-react';
import { useProduct } from '@/hooks/useProducts';
import { Tag, CodePreview, Spinner, Alert, Section } from '@/components/ui';
import { getTagColor } from '@/lib/tags';

export default function ProductPage() {
  const { slug } = useParams();
  const { product, loading, error } = useProduct(slug);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Spinner size={36} className="text-accent" />
    </div>
  );

  if (error || !product) return (
    <Section>
      <Alert type="error">{error || 'Product not found'}</Alert>
      <Link to="/" className="inline-flex items-center gap-2 mt-4 text-sm text-accent hover:underline">
        <ArrowLeft size={14} /> Back to store
      </Link>
    </Section>
  );

  const { name, tagline, description, price, tags = [], features = [], fileTree = [], preview, gumroadId } = product;
  const canPurchase = gumroadId && !gumroadId.startsWith('REPLACE_');

  return (
    <>
      {/* Breadcrumb */}
      <div className="pt-24 pb-0 px-6 max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-heading transition-colors">
          <ArrowLeft size={14} /> Back to store
        </Link>
      </div>

      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* ── Left: details (3/5) ────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-8">
            {/* Header */}
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((t) => <Tag key={t} color={getTagColor(t)}>{t}</Tag>)}
              </div>
              <h1 className="text-4xl font-display font-black text-heading tracking-tight mb-3">{name}</h1>
              <p className="text-lg text-muted leading-relaxed">{tagline}</p>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-sm font-mono uppercase tracking-widest text-muted mb-3">// Overview</h2>
              <p className="text-sm text-text2 leading-relaxed">{description}</p>
            </div>

            {/* Features */}
            <div>
              <h2 className="text-sm font-mono uppercase tracking-widest text-muted mb-4">// What's included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {features.map((f) => (
                  <div key={f} className="flex items-start gap-2.5 text-sm text-text2 bg-card border border-border rounded-lg px-3 py-2.5">
                    <Check size={13} className="text-accent mt-0.5 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Code preview */}
            {preview && (
              <div>
                <h2 className="text-sm font-mono uppercase tracking-widest text-muted mb-4">// Code Preview</h2>
                <CodePreview
                  filename={preview.filename}
                  language={preview.language}
                  code={preview.code}
                />
              </div>
            )}
          </div>

          {/* ── Right: purchase card (2/5) ─────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-4">

              {/* Price card */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="font-display font-black text-5xl text-heading mb-1">${price}</div>
                <div className="text-xs text-muted mb-6">one-time payment · instant download</div>

                {canPurchase ? (
                  <a
                    href={`https://gumroad.com/l/${gumroadId}`}
                    className="gumroad-button w-full !justify-center !py-3.5 !text-base !rounded-xl mb-3"
                    data-gumroad-single-product="true"
                  >
                    Buy on Gumroad →
                  </a>
                ) : (
                  <button
                    className="w-full py-3.5 text-base rounded-xl border border-border text-muted cursor-not-allowed mb-3"
                    disabled
                    title="Purchase link not configured yet"
                  >
                    Purchase Link Coming Soon
                  </button>
                )}

                <Link
                  to="/download"
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-border rounded-xl text-sm font-semibold text-text2 hover:border-accent hover:text-accent transition-colors"
                >
                  Already bought? Download
                </Link>

                <div className="mt-6 pt-5 border-t border-border space-y-2.5">
                  {[
                    '✓ Commercial use license',
                    '✓ Free lifetime updates',
                    '✓ 30-day money-back guarantee',
                    '✓ Email support included',
                  ].map((t) => (
                    <div key={t} className="text-xs text-muted">{t}</div>
                  ))}
                </div>
              </div>

              {/* File tree */}
              {fileTree.length > 0 && (
                <div className="bg-surface border border-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <FolderOpen size={14} className="text-accent" />
                    <span className="font-mono text-xs uppercase tracking-widest text-muted">File Tree</span>
                  </div>
                  <div className="space-y-1">
                    {fileTree.map((line, i) => (
                      <div key={i} className="font-mono text-[11px] text-text2 leading-relaxed whitespace-pre">{line}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
