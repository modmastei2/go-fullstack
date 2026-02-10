import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './App.css';
import NotFound from './modules/core/pages/NotFound';
import Unauthorized from './modules/core/pages/Unauthorized';
import PrivateLayout from './modules/post-login/core/components/PrivateLayout';
import LandingPage from './modules/post-login/core/pages/LandingPage';
import PublicLayout from './modules/pre-login/core/components/PublicLayout';
import ForgotPassword from './modules/pre-login/login/pages/ForgotPassword';
import Login from './modules/pre-login/login/pages/Login';
import Register from './modules/pre-login/login/pages/Register';
import PublicGuard from './shared/guards/PublicGuard';
import RequireAuth from './shared/guards/RequireAuth';
import DevComponents from './modules/post-login/dev/pages/dev.components';
import { HistoricalRoute, InformHubRoute } from './shared/constants/routes';
import Historical from './modules/post-login/historical/pages/Historical';
import Inform from './modules/post-login/inform-hub/pages/Inform';

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
                    {
                        path: HistoricalRoute.prefix,
                        children: [
                            {
                                path: HistoricalRoute.historical,
                                element: <Historical />
                            }
                        ]
                    },
                    {
                        path: InformHubRoute.prefix,
                        children: [
                            {
                                path: InformHubRoute.inform,
                                element: <Inform />
                            }
                        ]
                    },
                    {
                        path: 'dev',
                        element: <DevComponents />,
                    }
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

function App() {
    return <RouterProvider router={router} />;
}

export default App;
