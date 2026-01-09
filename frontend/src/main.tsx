import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import LandingPage from './modules/post-login/core/pages/LandingPage';
import PublicLayout from './modules/pre-login/core/components/PublicLayout';
import Login from './modules/pre-login/login/pages/Login';
import RequireAuth from './shared/guards/RequireAuth';
import PrivateLayout from './modules/post-login/core/components/PrivateLayout';
import Register from './modules/pre-login/login/pages/Register';
import ForgotPassword from './modules/pre-login/login/pages/ForgotPassword';
import PublicGuard from './shared/guards/PublicGuard';
import NotFound from './modules/core/pages/NotFound';
import Unauthorized from './modules/core/pages/Unauthorized';
import 'devextreme/dist/css/dx.light.css';
import config from 'devextreme/core/config';
import { licenseKey } from './devextreme-license';

const router = createBrowserRouter([
    {
        path: '/',
        element: <RequireAuth />,
        children: [
            {
                element: <PrivateLayout />,
                children: [
                    {
                        index: true,
                        element: <LandingPage />,
                    },
                ],
            },
        ],
    },
    {
        path: '/pre',
        element: <PublicGuard />,
        children: [
            {
                element: <PublicLayout />,
                children: [
                    {
                        index: true,
                        // path: 'login',
                        element: <Login />,
                    },
                    {
                        path: 'register',
                        element: <Register />,
                    },
                    {
                        path: 'forgot-password',
                        element: <ForgotPassword />,
                    },
                ],
            },
        ],
    },
    {
        path: '/unauthorized',
        element: <Unauthorized></Unauthorized>,
    },
    {
        path: '*',
        element: <NotFound></NotFound>,
    },
]);

config({ licenseKey })

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RouterProvider router={router}></RouterProvider>
    </StrictMode>,
);
