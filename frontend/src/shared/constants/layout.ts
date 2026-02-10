const mapGridCol: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
    9: 'grid-cols-9',
    10: 'grid-cols-10',
    11: 'grid-cols-11',
    12: 'grid-cols-12',
}

const mapGap: Record<number, string> = {
    0: 'gap-0',
    4: 'gap-1',
    8: 'gap-2',
    12: 'gap-3',
    16: 'gap-4',
    20: 'gap-5',
    24: 'gap-6',
    28: 'gap-7',
    32: 'gap-8',
}

const mapColumnGap : Record<number, string> = {
    0: 'gap-x-0',
    4: 'gap-x-1',
    8: 'gap-x-2',
    12: 'gap-x-3',
    16: 'gap-x-4',
}

const mapRowGap : Record<number, string> = {
    0: 'gap-y-0',
    4: 'gap-y-1',
    8: 'gap-y-2',
    12: 'gap-y-3',
    16: 'gap-y-4',
}

const mapColumnSpan: Record<number, string> = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    5: 'col-span-5',
    6: 'col-span-6',
    7: 'col-span-7',
    8: 'col-span-8',
    9: 'col-span-9',
    10: 'col-span-10',
    11: 'col-span-11',
    12: 'col-span-12',
}

const layoutMap = {
    mapGridCol,
    mapGap,
    mapColumnGap,
    mapRowGap,
    mapColumnSpan,
}

export default layoutMap;