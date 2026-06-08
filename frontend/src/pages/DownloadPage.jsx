import { useState } from 'react';
import { Download, Key, Mail, Package } from 'lucide-react';
import { verifyLicense } from '@/lib/api';
import { Input, Button, Alert, Section, Spinner } from '@/components/ui';
import DOMPurify from 'dompurify';

const PRODUCTS = [
  { value: 'kubernetes-starter-pack', label: '☸️ Kubernetes Starter Pack' },
  { value: 'terraform-aws-kit',       label: '🏗️ Terraform AWS Kit' },
  { value: 'docker-compose-bundle',   label: '🐳 Docker Compose Bundle' },
];

export default function DownloadPage() {
  const [form, setForm] = useState({ email: '', licenseKey: '', productId: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Sanitize input before storing
    const clean = DOMPurify.sanitize(value.trim());
    setForm((p) => ({ ...p, [name]: clean }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email)      errs.email      = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.licenseKey) errs.licenseKey = 'License key is required';
    else if (!/^SK-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/.test(form.licenseKey)) errs.licenseKey = 'Invalid key format (SK-XXX-XXXXXX-XXXXXXXX)';
    if (!form.productId)  errs.productId  = 'Select a product';
    return errs;
  };

  const handleSubmit = async () => {
    setApiError('');
    setResult(null);
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { data } = await verifyLicense(form);
      setResult(data);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Verification failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.downloadToken) return;
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    window.location.href = `${apiUrl}/downloads/${result.downloadToken}`;
  };

  return (
    <Section className="pt-28">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-3xl mx-auto mb-5">📦</div>
          <h1 className="text-4xl font-display font-black text-heading mb-3">Download Your Kit</h1>
          <p className="text-muted text-sm">Enter your purchase email and license key to access your download.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-7 space-y-5">
          {/* Product select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
              <Package size={12} /> Product
            </label>
            <select
              name="productId"
              value={form.productId}
              onChange={handleChange}
              className="bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text2 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
            >
              <option value="">— Select your product —</option>
              {PRODUCTS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            {errors.productId && <p className="text-xs text-rose-400">{errors.productId}</p>}
          </div>

          <Input
            label={<span className="flex items-center gap-1.5"><Mail size={12} /> Purchase Email</span>}
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
          />

          <Input
            label={<span className="flex items-center gap-1.5"><Key size={12} /> License Key</span>}
            name="licenseKey"
            type="text"
            placeholder="SK-K8S-XXXXXX-XXXXXXXX"
            value={form.licenseKey}
            onChange={handleChange}
            error={errors.licenseKey}
            className="font-mono !text-accent/90"
            autoComplete="off"
            spellCheck="false"
          />

          {apiError && <Alert type="error">{apiError}</Alert>}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <><Spinner size={16} /> Verifying...</> : <><Key size={16} /> Verify License</>}
          </Button>
        </div>

        {/* Success state */}
        {result && (
          <div className="mt-6 bg-accent/5 border border-accent/25 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-accent font-bold">
              ✅ License verified!
            </div>
            <div className="text-sm text-text2 space-y-1">
              <div>Downloads used: <span className="text-accent font-mono font-bold">{result.downloadsUsed}</span> / {result.downloadsLeft + result.downloadsUsed}</div>
              <div>Downloads remaining: <span className="text-accent font-mono font-bold">{result.downloadsLeft}</span></div>
            </div>
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-accent text-black font-bold rounded-xl hover:opacity-85 transition-opacity"
            >
              <Download size={18} /> Download ZIP
            </button>
            <p className="text-xs text-muted text-center">
              Download link expires in 10 minutes. Your ZIP is personalized with your license info.
            </p>
          </div>
        )}

        {/* Help */}
        <div className="mt-8 bg-surface border border-border rounded-xl p-5 space-y-2">
          <p className="text-xs font-bold text-muted uppercase tracking-widest">Where is my license key?</p>
          <p className="text-xs text-muted leading-relaxed">
            After purchase, Gumroad sends a receipt email containing your license key.
            It looks like <span className="font-mono text-accent">SK-K8S-A1B2C3-D4E5F6G7</span>.
            Can't find it? <a href="/contact" className="text-accent hover:underline">Contact support →</a>
          </p>
        </div>
      </div>
    </Section>
  );
}
