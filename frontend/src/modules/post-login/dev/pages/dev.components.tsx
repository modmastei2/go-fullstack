import Button from '@mui/material/Button';
import { CodeBlock } from '../../../../shared/components/CodeBlock/CodeBlock';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import Fingerprint from '@mui/icons-material/Fingerprint';
import SendIcon from '@mui/icons-material/Send';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import MyNote from '../../../../shared/components/Notes/MyNote';

export default function DevComponents() {
    const colors = ['primary', 'secondary', 'success', 'error', 'info', 'warning'] as const;
    const variants = ['text', 'contained', 'outlined'] as const;
    const sizes = ['small', 'medium', 'large'] as const;
    const disabledStates = [true, false];

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 90 },
        {
            field: 'firstName',
            headerName: 'First name',
            width: 150,
            editable: true,
        },
        {
            field: 'lastName',
            headerName: 'Last name',
            width: 150,
            editable: true,
        },
        {
            field: 'age',
            headerName: 'Age',
            type: 'number',
            width: 110,
            editable: true,
        },
        {
            field: 'fullName',
            headerName: 'Full name',
            description: 'This column has a value getter and is not sortable.',
            sortable: false,
            width: 160,
            valueGetter: (_, row) => `${row.firstName || ''} ${row.lastName || ''}`,
        },
    ];

    const rows = [
        { id: 1, lastName: 'Snow', firstName: 'Jon', age: 14 },
        { id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 31 },
        { id: 3, lastName: 'Lannister', firstName: 'Jaime', age: 31 },
        { id: 4, lastName: 'Stark', firstName: 'Arya', age: 11 },
        { id: 5, lastName: 'Targaryen', firstName: 'Daenerys', age: null },
        { id: 6, lastName: 'Melisandre', firstName: null, age: 150 },
        { id: 7, lastName: 'Clifford', firstName: 'Ferrara', age: 44 },
        { id: 8, lastName: 'Frances', firstName: 'Rossini', age: 36 },
        { id: 9, lastName: 'Roxie', firstName: 'Harvey', age: 65 },
    ];
    return (
        <div className="space-y-6">
            <div className="p-6 rounded-lg shadow-md bg-slate-50 dark:bg-slate-900">
                <h2 className="mb-2 text-3xl font-bold text-gray-800 dark:text-gray-200">Dev Components Page</h2>
                <p className="text-gray-600 dark:text-gray-400">This is a placeholder for development components.</p>
            </div>

            <div className="relative p-6 rounded-lg shadow-md bg-slate-50 dark:bg-slate-900">
                <h2 className="mb-2 text-2xl font-bold text-gray-800 dark:text-gray-200">Button</h2>

                {/* Button variants and colors */}
                <h3 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Variants and Colors</h3>
                <div className="p-4 bg-white border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
                    {colors.map((color) => (
                        <div key={color} className="mb-4 space-x-4">
                            {variants.map((variant) => (
                                <div key={color + variant} className="inline-block">
                                    <Button variant={variant} color={color}>
                                        Button
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ))}
                    <CodeBlock lang="language-ts">{`<Button variant="variant" color="color">Button</Button>`}</CodeBlock>
                </div>

                {/* Button sizes */}
                <h3 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Button sizes</h3>
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
                    <div className="space-x-4">
                        {sizes.map((size) => (
                            <div key={size} className="inline-block">
                                <Button variant="contained" color="primary" size={size}>
                                    {size.charAt(0).toUpperCase() + size.slice(1)}
                                </Button>
                            </div>
                        ))}
                    </div>

                    <CodeBlock lang="language-ts">{`<Button variant="variant" color="color" size="size">Button</Button>`}</CodeBlock>
                </div>

                {/* Disabled states */}
                <h3 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Disabled states</h3>
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
                    <div className="space-x-4">
                        {disabledStates.map((isDisabled) => (
                            <div key={isDisabled ? 'disabled' : 'enabled'} className="inline-block">
                                <Button variant="contained" color="primary" disabled={isDisabled}>
                                    {isDisabled ? 'Disabled' : 'Enabled'}
                                </Button>
                            </div>
                        ))}
                    </div>
                    <CodeBlock lang="language-ts">{`<Button variant="variant" disabled={true|false}>Button</Button>`}</CodeBlock>
                </div>

                {/* Button with icon */}
                <h3 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Button with icon</h3>
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
                    <div className="inline-block space-x-4">
                        <Button variant="contained" color="primary" size="small" startIcon={<span>🚀</span>}>
                            Icon Button
                        </Button>
                        <Button variant="contained" endIcon={<SendIcon />}>
                            Send
                        </Button>
                    </div>
                    <CodeBlock lang="language-ts">{`<Button variant="variant" startIcon={<IconComponent />}>Button</Button>`}</CodeBlock>
                    <CodeBlock lang="language-ts">{`<Button variant="variant" startIcon={<span>🚀</span>}>Button</Button>`}</CodeBlock>
                    <CodeBlock lang="language-ts">{`<Button variant="variant" endIcon={<SendIcon />}>Button</Button>`}</CodeBlock>
                </div>

                {/* Icon button */}
                <h3 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Icon button</h3>
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
                    <div className="inline-block">
                        <IconButton className="text-white!" aria-label="delete">
                            <DeleteIcon />
                        </IconButton>
                        <IconButton aria-label="delete" disabled color="primary">
                            <DeleteIcon />
                        </IconButton>
                        <IconButton color="primary" aria-label="add to shopping cart">
                            <AddShoppingCartIcon />
                        </IconButton>
                        <IconButton aria-label="fingerprint" color="success">
                            <Fingerprint />
                        </IconButton>
                    </div>
                    <CodeBlock lang="language-ts">{`<IconButton aria-label="delete" color="color" size="size"><DeleteIcon/></IconButton>`}</CodeBlock>
                </div>

                {/* File upload */}
                {/* <h3 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">File upload button</h3>
                <div>
                    <Button component="label" role={undefined} variant="contained" tabIndex={-1} startIcon={<CloudUploadIcon />}>
                        Upload files
                        <VisuallyHiddenInput type="file" onChange={(event: React.ChangeEvent<HTMLInputElement>) => console.log(event.target.files)} multiple />
                    </Button>
                    <CodeBlock lang="language-ts">{`<Button variant="variant" component="label"> Upload File <input type="file" hidden /> </Button>`}</CodeBlock>
                </div> */}

                {/* Data Grid */}
                <h3 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Data Grid</h3>
                <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg shadow-md h-[400px] dark:bg-gray-800 dark:border-gray-700">
                    <div>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            initialState={{
                                pagination: {
                                    paginationModel: {
                                        pageSize: 5,
                                    },
                                },
                            }}
                            pageSizeOptions={[5]}
                            checkboxSelection
                            disableRowSelectionOnClick
                        />
                    </div>
                </div>
                <CodeBlock lang="language-ts">{`<DataGrid rows={rows} columns={columns} pageSizeOptions={[5]} checkboxSelection disableRowSelectionOnClick />`}</CodeBlock>


                {/* Notes */}

                <h3 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">My Note</h3>
                {/* <div>
                    <MyNote></MyNote>
                </div> */}
                <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-3">
                    {/* <MyNote></MyNote>
                    <MyNote></MyNote> */}
                    <MyNote></MyNote>
                </div>
            </div>
        </div>
    );
}
