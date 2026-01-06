import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
    return (
        <>
            <div className="bg-emerald-700 text-white p-6">

            </div>


            <Outlet />
        </>
    );
}
