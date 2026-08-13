import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import LocaleProvider from './i18n/LocaleProvider';
import { initApiBaseUrl } from './lib/apiBase';
import './index.css';

const queryClient = new QueryClient();

async function bootstrap() {
  await initApiBaseUrl();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <App />
        </LocaleProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}

bootstrap();
