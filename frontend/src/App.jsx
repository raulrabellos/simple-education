import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { PrivateRoute, PublicOnlyRoute } from './components/RouteGuards.jsx';
import { AppLayout } from './components/AppLayout.jsx';
import { LoginPage, RegisterPage } from './pages/AuthPages.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { SubjectPage } from './pages/SubjectPage.jsx';
import { TopicPage } from './pages/TopicPage.jsx';
import { ExercisePage } from './pages/ExercisePage.jsx';
import { AttemptPage } from './pages/AttemptPage.jsx';
import { SearchPage } from './pages/SearchPage.jsx';
import { ProgressPage } from './pages/ProgressPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

/**
 * Mapa de telas do sistema.
 * Públicas: login e cadastro. Todas as demais exigem sessão válida no servidor.
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<RegisterPage />} />
          </Route>

          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/materias/:slug" element={<SubjectPage />} />
              <Route path="/assuntos/:slug" element={<TopicPage />} />
              <Route path="/assuntos/:slug/exercicios" element={<ExercisePage />} />
              <Route path="/tentativas/:id" element={<AttemptPage />} />
              <Route path="/pesquisa" element={<SearchPage />} />
              <Route path="/progresso" element={<ProgressPage />} />
              <Route path="/configuracoes" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
