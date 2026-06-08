import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { Tag, Badge } from './ui';
import { getTagColor } from '@/lib/tags';
import clsx from 'clsx';

export default function ProductCard({ product, featured = false }) {
  const { slug, emoji, name, tagline, price, tags = [], features = [], fileTree = [], gumroadId, badge } = product;
  const canPurchase = gumroadId && !gumroadId.startsWith('REPLACE_');

  return (
    <div className={clsx(
      'group bg-card border border-border rounded-2xl overflow-hidden card-hover flex flex-col',
      featured && 'md:col-span-2'
    )}>
      <div className={clsx('flex gap-6', featured ? 'md:flex-row flex-col' : 'flex-col')}>
        {/* Left / Main content */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Card header */}
          <div className="p-6 pb-0 flex items-start justify-between gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl shrink-0">
              {emoji || '📦'}
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              {tags.slice(0, 2).map((t) => (
                <Tag key={t} color={getTagColor(t)} small>{t}</Tag>
              ))}
              {badge && <Badge variant={badge.includes('🔥') ? 'hot' : badge === 'New' ? 'new' : 'default'}>{badge}</Badge>}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 pt-4 flex-1">
            <h3 className="font-display font-extrabold text-lg text-heading tracking-tight mb-2">{name}</h3>
            <p className="text-sm text-muted leading-relaxed mb-5">{tagline}</p>

            {/* Features list */}
            <div className="space-y-2">
              {features.slice(0, 5).map((f) => (
                <div key={f} className="flex items-start gap-2 text-xs text-text2">
                  <Check size={12} className="text-accent mt-0.5 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-0 border-t border-border mt-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-display font-black text-2xl text-heading">${price}</div>
              <div className="text-xs text-muted">one-time · instant download</div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/products/${slug}`}
                className="px-4 py-2 border border-border rounded-lg text-sm font-semibold text-text2 hover:border-accent hover:text-accent transition-colors"
              >Details</Link>
              {canPurchase ? (
                <a
                  href={`https://gumroad.com/l/${gumroadId}`}
                  className="gumroad-button !px-4 !py-2 !text-sm"
                  data-gumroad-single-product="true"
                >
                  Buy Now
                </a>
              ) : (
                <button
                  className="px-4 py-2 text-sm rounded-lg border border-border text-muted cursor-not-allowed"
                  disabled
                  title="Purchase link not configured yet"
                >
                  Coming Soon
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right panel — file tree (featured only) */}
        {featured && fileTree.length > 0 && (
          <div className="md:w-64 shrink-0 border-t md:border-t-0 md:border-l border-border p-5 bg-surface/50">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-4">// file tree</p>
            <div className="space-y-1">
              {fileTree.map((line, i) => (
                <div key={i} className="font-mono text-[11px] text-text2 leading-relaxed whitespace-pre">{line}</div>
              ))}
            </div>
            <Link
              to={`/products/${slug}`}
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
            >View full details <ArrowRight size={12} /></Link>
          </div>
        )}
      </div>
    </div>
  );
}
