import { useNavigate } from 'react-router-dom';
import { PreRoute } from '../../../../shared/constants/routes';
import { useEffect, useState } from 'react';
import api from '../../../../shared/handlers/api.handler';
import { DataGrid, type GridFilterModel, type GridPaginationModel, type GridSortModel } from '@mui/x-data-grid';

export default function LandingPage() {
    const [rows, setRows] = useState([]);
    const [rowCount, setRowCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 20,
    });

    const [sortModel, setSortModel] = useState<GridSortModel>([]);

    const [filterModel, setFilterModel] = useState<GridFilterModel>({
        items: [],
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            const res = await fetch('/api/users/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page: paginationModel.page,
                    pageSize: paginationModel.pageSize,
                    sort: sortModel,
                    filters: filterModel,
                }),
            });

            const json = await res.json();

            setRows(json.data);
            setRowCount(json.total);
            setLoading(false);
        };

        void fetchData();
    }, [paginationModel, sortModel, filterModel]);
    
    const navigate = useNavigate();

    const handleNavigateToLogin = () => {
        navigate(PreRoute.loginFullPath);
    };

    const handleNavigateToRegister = () => {
        navigate(PreRoute.registerFullPath);
    };

    useEffect(() => {
        console.log('LandingPage mounted');

        // get profile
        api.get('/auth/profile')
            .then((response) => {
                console.log('Profile data:', response.data);
            })
            .catch((error) => {
                console.error('Error fetching profile:', error);
            });
    }, []);

    return (
        <>
            <div>
                <h1>Welcome to the Landing Page</h1>
                <p>This is the main entry point of the application.</p>
            </div>

            <div className="cursor-pointer my-2" onClick={handleNavigateToLogin}>
                <a className="rounded-md bg-sky-500 text-white px-4 py-2">Go to Login Page</a>
            </div>
            <div className="cursor-pointer my-2" onClick={handleNavigateToRegister}>
                <a className="rounded-md bg-slate-500 text-white px-4 py-2">Register</a>
            </div>

            <DataGrid
                rows={rows}
                columns={[
                    { field: 'id', headerName: 'ID', width: 90 },
                    { field: 'name', headerName: 'Name', flex: 1 },
                    { field: 'status', headerName: 'Status', width: 120 },
                    { field: 'createdAt', headerName: 'Created At', width: 180 },
                ]}
                rowCount={rowCount}
                loading={loading}
                paginationMode="server"
                sortingMode="server"
                filterMode="server"
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                sortModel={sortModel}
                onSortModelChange={setSortModel}
                filterModel={filterModel}
                onFilterModelChange={setFilterModel}
            />
        </>
    );
}
