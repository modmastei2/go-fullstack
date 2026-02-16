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

const mapGridColMd: Record<number, string> = {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
    7: 'md:grid-cols-7',
    8: 'md:grid-cols-8',
    9: 'md:grid-cols-9',
    10: 'md:grid-cols-10',
    11: 'md:grid-cols-11',
    12: 'md:grid-cols-12',
}

const mapGridColLg: Record<number, string> = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
    7: 'lg:grid-cols-7',
    8: 'lg:grid-cols-8',
    9: 'lg:grid-cols-9',
    10: 'lg:grid-cols-10',
    11: 'lg:grid-cols-11',
    12: 'lg:grid-cols-12',
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

const mapColumnGap: Record<number, string> = {
    0: 'gap-x-0',
    4: 'gap-x-1',
    8: 'gap-x-2',
    12: 'gap-x-3',
    16: 'gap-x-4',
}

const mapColumnGapMd: Record<number, string> = {
    0: 'md:gap-x-0',
    4: 'md:gap-x-1',
    8: 'md:gap-x-2',
    12: 'md:gap-x-3',
    16: 'md:gap-x-4',
}

const mapRowGap: Record<number, string> = {
    0: 'gap-y-0',
    4: 'gap-y-1',
    8: 'gap-y-2',
    12: 'gap-y-3',
    16: 'gap-y-4',
}

const mapRowGapMd: Record<number, string> = {
    0: 'md:gap-y-0',
    4: 'md:gap-y-1',
    8: 'md:gap-y-2',
    12: 'md:gap-y-3',
    16: 'md:gap-y-4',
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

const mapColumnSpanLg: Record<number, string> = {
    1: 'lg:col-span-1',
    2: 'lg:col-span-2',
    3: 'lg:col-span-3',
    4: 'lg:col-span-4',
    5: 'lg:col-span-5',
    6: 'lg:col-span-6',
    7: 'lg:col-span-7',
    8: 'lg:col-span-8',
    9: 'lg:col-span-9',
    10: 'lg:col-span-10',
    11: 'lg:col-span-11',
    12: 'lg:col-span-12',
}

const mapRequired: { true: string; false: string } = {
    true: 'before:content-["*"] md:after:content-["*"] md:before:content-[""] before:ml-0.5 md:after:ml-0.5 md:before:ml-0 before:text-red-500 md:after:text-red-500',
    false: '',
}

const layoutMap = {
    mapGridCol,
    mapGridColMd,
    mapGridColLg,
    mapGap,
    mapColumnGap,
    mapColumnGapMd,
    mapRowGap,
    mapRowGapMd,
    mapColumnSpan,
    mapColumnSpanLg,
    mapRequired,
}

export default layoutMap;