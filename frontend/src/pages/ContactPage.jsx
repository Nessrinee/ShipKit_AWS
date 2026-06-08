import { useState } from 'react';
import DOMPurify from 'dompurify';
import { Send } from 'lucide-react';
import { sendContact } from '@/lib/api';
import { Input, Textarea, Button, Alert, Section, Spinner } from '@/components/ui';

export default function ContactPage() {
  const [form, setForm]     = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: DOMPurify.sanitize(value) }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name || form.name.length < 2)   e.name    = 'Name must be at least 2 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.subject || form.subject.length < 4) e.subject = 'Subject must be at least 4 characters';
    if (!form.message || form.message.length < 10) e.message = 'Message must be at least 10 characters';
    return e;
  };

  const handleSubmit = async () => {
    setApiError(''); setSuccess('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { data } = await sendContact(form);
      setSuccess(data.message);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to send message. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section className="pt-28">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">✉️</div>
          <h1 className="text-4xl font-display font-black text-heading mb-3">Get in Touch</h1>
          <p className="text-muted text-sm">Questions about a kit? Need support? We reply within 24h.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-7 space-y-5">
          {success && <Alert type="success">{success}</Alert>}
          {apiError && <Alert type="error">{apiError}</Alert>}

          <Input label="Your Name" name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="Jane Smith" />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="you@example.com" />
          <Input label="Subject" name="subject" value={form.subject} onChange={handleChange} error={errors.subject} placeholder="Issue with Terraform kit" />
          <Textarea label="Message" name="message" value={form.message} onChange={handleChange} error={errors.message} rows={5} placeholder="Describe your question or issue..." />

          <Button variant="primary" size="lg" className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? <><Spinner size={16} /> Sending...</> : <><Send size={16} /> Send Message</>}
          </Button>
        </div>

        <div className="mt-6 text-center text-xs text-muted">
          You can also email directly at <span className="text-accent">hello@shipkit.dev</span>
        </div>
      </div>
    </Section>
  );
}
