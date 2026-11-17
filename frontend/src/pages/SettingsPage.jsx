import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { SCHOOL_YEAR_OPTIONS } from '../utils/format.js';
import { Alert, Button, PageTitle, SelectField, TextField } from '../components/ui.jsx';

export function SettingsPage() {
  usePageTitle('Configurações');
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user.name, schoolYear: user.schoolYear ? String(user.schoolYear) : '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const unchanged = form.name.trim() === user.name && (form.schoolYear || null) === (user.schoolYear ? String(user.schoolYear) : null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;
    const name = form.name.trim();
    const newErrors = {};
    if (name.length < 2 || name.length > 80) newErrors.name = 'Informe um nome entre 2 e 80 caracteres.';
    setErrors(newErrors);
    setMessage(null);
    if (Object.keys(newErrors).length) return;

    setSaving(true);
    try {
      const updated = await updateProfile({ name, schoolYear: form.schoolYear ? Number(form.schoolYear) : null });
      setForm({ name: updated.name, schoolYear: updated.schoolYear ? String(updated.schoolYear) : '' });
      setMessage({ type: 'success', text: 'Dados atualizados com sucesso.' });
    } catch (err) {
      setErrors(err.details ?? {});
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle>Configurações</PageTitle>
      <p className="page-subtitle">Atualize seu nome e seu ano escolar.</p>

      <section className="card settings">
        <div aria-live="polite">{message && <Alert type={message.type}>{message.text}</Alert>}</div>
        <form className="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Nome"
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={errors.name}
            maxLength={80}
            required
          />
          <SelectField
            label="Ano escolar"
            value={form.schoolYear}
            onChange={(e) => setForm((f) => ({ ...f, schoolYear: e.target.value }))}
            options={SCHOOL_YEAR_OPTIONS}
            error={errors.schoolYear}
            hint="Usado para destacar os conteúdos do seu ano. Todos os conteúdos continuam disponíveis."
          />
          <TextField label="E-mail" value={user.email} disabled hint="O e-mail de acesso não pode ser alterado." />
          <div className="btn-row">
            <Button type="submit" loading={saving} loadingText="Salvando..." disabled={unchanged}>Salvar alterações</Button>
          </div>
        </form>
      </section>
    </>
  );
}
