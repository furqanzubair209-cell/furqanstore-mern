import { useState } from "react";
import { api } from "../api/client";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/contact", form);
    setSent(true);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <h1 className="font-display text-3xl mb-8">Contact us</h1>
      {sent ? (
        <p className="text-green-400">Thanks — we'll get back to you soon.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
          <input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
          <textarea required placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" rows={4} />
          <button className="bg-gold text-ink px-6 py-3 rounded-full font-medium">Send message</button>
        </form>
      )}
    </div>
  );
}
