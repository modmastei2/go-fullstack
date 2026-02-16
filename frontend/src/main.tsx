import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

import { ThemeProvider } from './shared/providers/ThemeProvider';
import App from './App';
import { AuthProvider } from './shared/hooks/auth/AuthProvider';
import { LoaderProvider } from './shared/hooks/loader/LoaderProvider';
// import store from './shared/redux/store';
// import { Provider } from 'react-redux';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider>
            <LoaderProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </LoaderProvider>
        </ThemeProvider>
    </StrictMode>,
);
