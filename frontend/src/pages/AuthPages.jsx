import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { SCHOOL_YEAR_OPTIONS } from '../utils/format.js';
import { Alert, Button, PageTitle, SelectField, TextField } from '../components/ui.jsx';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className="auth">
      <div className="auth__card">
        <p className="auth__logo">Simple<br />education</p>
        <PageTitle className="auth__title">{title}</PageTitle>
        {subtitle && <p className="auth__subtitle">{subtitle}</p>}
        {children}
        <p className="auth__footer">{footer}</p>
      </div>
    </main>
  );
}

export function LoginPage() {
  usePageTitle('Entrar');
  const { login, loggedOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname ?? '/';

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const newErrors = {};
    if (!EMAIL_REGEX.test(form.email.trim())) newErrors.email = 'Informe um e-mail válido.';
    if (!form.password) newErrors.password = 'Informe sua senha.';
    setErrors(newErrors);
    setFormError('');
    if (Object.keys(newErrors).length) return;

    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Entrar"
      subtitle="Acesse sua conta para continuar estudando."
      footer={<>Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link></>}
    >
      {loggedOut && !formError && <Alert type="success">Você saiu da sua conta.</Alert>}
      {formError && <Alert>{formError}</Alert>}
      <form className="form" onSubmit={handleSubmit} noValidate>
        <TextField label="E-mail" type="email" autoComplete="email" value={form.email} onChange={update('email')} error={errors.email} required />
        <TextField label="Senha" type="password" autoComplete="current-password" value={form.password} onChange={update('password')} error={errors.password} required />
        <Button type="submit" className="btn--block" loading={submitting} loadingText="Entrando...">Entrar</Button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  usePageTitle('Cadastro');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', schoolYear: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function validate() {
    const e = {};
    const name = form.name.trim();
    if (name.length < 2 || name.length > 80) e.name = 'Informe um nome entre 2 e 80 caracteres.';
    if (!EMAIL_REGEX.test(form.email.trim())) e.email = 'Informe um e-mail válido.';
    if (form.password.length < 8 || form.password.length > 72) e.password = 'A senha deve ter entre 8 e 72 caracteres.';
    if (form.confirm !== form.password) e.confirm = 'As senhas não são iguais.';
    return e;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const newErrors = validate();
    setErrors(newErrors);
    setFormError('');
    if (Object.keys(newErrors).length) return;

    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        schoolYear: form.schoolYear ? Number(form.schoolYear) : null,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setErrors(err.details ?? {});
      setFormError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Cadastre-se para acessar os conteúdos e acompanhar seu progresso."
      footer={<>Já tem conta? <Link to="/login">Entrar</Link></>}
    >
      {formError && <Alert>{formError}</Alert>}
      <form className="form" onSubmit={handleSubmit} noValidate>
        <TextField label="Nome" autoComplete="name" value={form.name} onChange={update('name')} error={errors.name} maxLength={80} required />
        <TextField label="E-mail" type="email" autoComplete="email" value={form.email} onChange={update('email')} error={errors.email} maxLength={120} required />
        <TextField label="Senha" type="password" autoComplete="new-password" value={form.password} onChange={update('password')} error={errors.password} hint="Mínimo de 8 caracteres." maxLength={72} required />
        <TextField label="Confirmar senha" type="password" autoComplete="new-password" value={form.confirm} onChange={update('confirm')} error={errors.confirm} maxLength={72} required />
        <SelectField
          label="Ano escolar (opcional)"
          value={form.schoolYear}
          onChange={update('schoolYear')}
          options={SCHOOL_YEAR_OPTIONS}
          error={errors.schoolYear}
          hint="A plataforma é aberta a todos. O ano só destaca os conteúdos da sua série."
        />
        <Button type="submit" className="btn--block" loading={submitting} loadingText="Criando conta...">Criar conta</Button>
      </form>
    </AuthShell>
  );
}
