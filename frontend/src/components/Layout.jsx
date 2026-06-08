import { Outlet, NavLink, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import clsx from 'clsx';

const NAV_LINKS = [
  { to: '/',        label: 'Bundles' },
  { to: '/about',   label: 'About'   },
  { to: '/download',label: 'Download'},
  { to: '/contact', label: 'Contact' },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav className={clsx(
      'fixed top-0 inset-x-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-bg/90 backdrop-blur-xl border-b border-border'
        : 'bg-transparent'
    )}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-emerald-600 flex items-center justify-center text-base">🚀</div>
          <span className="font-display font-extrabold text-lg text-heading tracking-tight">
            Ship<span className="text-accent">Kit</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              className={({ isActive }) => clsx(
                'text-sm font-semibold transition-colors duration-200',
                isActive ? 'text-heading' : 'text-muted hover:text-heading'
              )}
            >{label}</NavLink>
          ))}
          <a
            href="https://gumroad.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 bg-accent text-black font-bold text-sm rounded-lg hover:opacity-85 transition-opacity"
          >Buy on Gumroad →</a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-text2 p-1"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-surface border-b border-border px-6 py-4 flex flex-col gap-4">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) => clsx(
                'text-sm font-semibold py-1',
                isActive ? 'text-accent' : 'text-text2'
              )}
            >{label}</NavLink>
          ))}
          <a
            href="https://gumroad.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center px-5 py-2.5 bg-accent text-black font-bold text-sm rounded-lg"
          >Buy on Gumroad →</a>
        </div>
      )}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-emerald-600 flex items-center justify-center text-sm">🚀</div>
              <span className="font-display font-extrabold text-heading">Ship<span className="text-accent">Kit</span></span>
            </div>
            <p className="text-sm text-muted leading-relaxed max-w-[200px]">
              Production-ready DevOps bundles built by a senior cloud engineer.
            </p>
          </div>

          {[
            ['Products', [
              { to: '/', label: 'Kubernetes Starter Pack' },
              { to: '/', label: 'Terraform AWS Kit' },
              { to: '/', label: 'Docker Compose Bundle' },
            ]],
            ['Info', [
              { to: '/about',    label: 'About' },
              { to: '/download', label: 'Download a Kit' },
              { to: '/contact',  label: 'Contact' },
            ]],
            ['Legal', [
              { to: '/', label: 'Terms of Sale' },
              { to: '/', label: 'Refund Policy' },
              { to: '/', label: 'License' },
            ]],
          ].map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-bold tracking-widest uppercase text-muted mb-4">{title}</h4>
              <div className="flex flex-col gap-2.5">
                {links.map(({ to, label }) => (
                  <Link key={label} to={to} className="text-sm text-muted hover:text-heading transition-colors">{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-border">
          <p className="text-xs text-muted">© {new Date().getFullYear()} ShipKit. All products sold via Gumroad.</p>
          <div className="flex gap-2">
            {['Gumroad', 'Payoneer ✓', 'Visa / MC'].map((t) => (
              <span key={t} className="px-2.5 py-1 bg-card border border-border rounded font-mono text-xs text-muted font-bold">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
