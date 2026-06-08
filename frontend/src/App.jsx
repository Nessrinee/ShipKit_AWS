import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout        from '@/components/Layout';
import HomePage     from '@/pages/HomePage';
import ProductPage  from '@/pages/ProductPage';
import DownloadPage from '@/pages/DownloadPage';
import AboutPage    from '@/pages/AboutPage';
import ContactPage  from '@/pages/ContactPage';
import NotFoundPage from '@/pages/NotFoundPage';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"                    element={<HomePage />} />
          <Route path="/products/:slug"      element={<ProductPage />} />
          <Route path="/download"            element={<DownloadPage />} />
          <Route path="/about"               element={<AboutPage />} />
          <Route path="/contact"             element={<ContactPage />} />
          <Route path="*"                    element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
