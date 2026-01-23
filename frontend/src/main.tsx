import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

import { initTheme } from './shared/handlers/theme.handler';
import App from './App';
import { AuthProvider } from './shared/hooks/auth/AuthProvider';
import { LoaderProvider } from './shared/hooks/loader/LoaderProvider';
// import store from './shared/redux/store';
// import { Provider } from 'react-redux';

initTheme();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <LoaderProvider>
            <AuthProvider>
                <App />
            </AuthProvider>
        </LoaderProvider>
    </StrictMode>,
);
