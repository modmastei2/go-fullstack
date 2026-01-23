import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

import { initTheme } from './shared/handlers/theme.handler';
import App from './App';
import { AuthProvider } from './shared/providers/AuthProvider';
// import store from './shared/redux/store';
// import { Provider } from 'react-redux';

initTheme();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        {/* <Provider store={store}> */}
            <AuthProvider>
                <App />
            </AuthProvider>
        {/* </Provider> */}
    </StrictMode>,
);
