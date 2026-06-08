import clsx from 'clsx';

/* ── Tag / Badge ────────────────────────────────────────────────── */
export const Tag = ({ color = 'green', children, small = false }) => {
  const colors = {
    green:  'bg-accent/10 text-accent  border-accent/25',
    blue:   'bg-blue/10   text-blue    border-blue/25',
    yellow: 'bg-yellow/10 text-yellow  border-yellow/25',
    muted:  'bg-muted/10  text-muted   border-muted/25',
  };
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 border rounded font-mono font-bold uppercase tracking-widest',
      small ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1',
      colors[color]
    )}>{children}</span>
  );
};

export const Badge = ({ variant = 'default', children }) => {
  const variants = {
    hot:     'bg-rose-500 text-white',
    new:     'bg-blue text-black',
    save:    'bg-yellow text-black',
    default: 'bg-accent text-black',
  };
  return (
    <span className={clsx(
      'font-mono text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded',
      variants[variant]
    )}>{children}</span>
  );
};

/* ── Button ─────────────────────────────────────────────────────── */
export const Button = ({ variant = 'primary', size = 'md', className, children, ...props }) => {
  const variants = {
    primary:  'bg-accent text-black font-bold hover:opacity-85',
    outline:  'border border-accent text-accent hover:bg-accent/10 bg-transparent',
    ghost:    'border border-border text-text2 hover:border-blue hover:bg-blue/5 bg-transparent',
    danger:   'bg-rose-500 text-white hover:bg-rose-600',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded',
    md: 'px-5 py-2.5 text-sm rounded-lg',
    lg: 'px-8 py-3.5 text-base rounded-lg',
  };
  return (
    <button className={clsx(
      'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-accent/50',
      variants[variant], sizes[size], className
    )} {...props}>{children}</button>
  );
};

/* ── Input ──────────────────────────────────────────────────────── */
export const Input = ({ label, error, className, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-bold uppercase tracking-widest text-muted">{label}</label>}
    <input className={clsx(
      'bg-surface border rounded-lg px-4 py-2.5 text-sm text-text2 placeholder-muted',
      'focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors',
      error ? 'border-rose-500' : 'border-border',
      className
    )} {...props} />
    {error && <p className="text-xs text-rose-400">{error}</p>}
  </div>
);

export const Textarea = ({ label, error, className, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-bold uppercase tracking-widest text-muted">{label}</label>}
    <textarea className={clsx(
      'bg-surface border rounded-lg px-4 py-2.5 text-sm text-text2 placeholder-muted resize-none',
      'focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors',
      error ? 'border-rose-500' : 'border-border',
      className
    )} {...props} />
    {error && <p className="text-xs text-rose-400">{error}</p>}
  </div>
);

/* ── Alert ──────────────────────────────────────────────────────── */
export const Alert = ({ type = 'info', children }) => {
  const styles = {
    info:    'bg-blue/10 border-blue/30 text-blue',
    success: 'bg-accent/10 border-accent/30 text-accent',
    error:   'bg-rose-500/10 border-rose-500/30 text-rose-400',
    warning: 'bg-yellow/10 border-yellow/30 text-yellow',
  };
  return (
    <div className={clsx('border rounded-lg px-4 py-3 text-sm font-medium', styles[type])}>
      {children}
    </div>
  );
};

/* ── Spinner ────────────────────────────────────────────────────── */
export const Spinner = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    className="animate-spin" xmlns="http://www.w3.org/2000/svg">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

/* ── Section wrapper ────────────────────────────────────────────── */
export const Section = ({ className, children, ...props }) => (
  <section className={clsx('py-20 px-6', className)} {...props}>
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
);

export const SectionHeader = ({ tag, title, subtitle }) => (
  <div className="text-center mb-14">
    {tag && <Tag className="mb-4">{tag}</Tag>}
    <h2 className="text-3xl md:text-5xl font-display font-extrabold text-heading tracking-tight mt-3 mb-4">{title}</h2>
    {subtitle && <p className="text-base text-muted max-w-md mx-auto">{subtitle}</p>}
  </div>
);

/* ── Code preview block ─────────────────────────────────────────── */
export const CodePreview = ({ filename, language, code }) => (
  <div className="rounded-xl overflow-hidden border border-border bg-surface">
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-card border-b border-border">
      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"/>
      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"/>
      <span className="w-2.5 h-2.5 rounded-full bg-green-500"/>
      <span className="font-mono text-xs text-muted ml-2">{filename}</span>
      <span className="ml-auto font-mono text-[10px] text-muted/60 uppercase tracking-widest">{language}</span>
    </div>
    <pre className="p-5 text-xs font-mono leading-relaxed text-text2 overflow-x-auto whitespace-pre">
      {code}
    </pre>
  </div>
);
