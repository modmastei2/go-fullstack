import Criteria from '../../../../shared/components/Criteria/Criteria';

export default function Historical() {
    const onClickSearch = (filters: any) => {
        console.log('Search clicked with filters:', filters);
    }

    return (
        <>
            <div className="p-6 rounded-lg shadow-md bg-slate-50 text-gray-800  dark:bg-slate-900 dark:text-gray-200">
                <div className="grid grid-cols-1 md:grid-col-4 gap-4">
                    <Criteria criteriaKey="historical" onClickSearch={onClickSearch}></Criteria>
                </div>
            </div>
        </>
    );
}
