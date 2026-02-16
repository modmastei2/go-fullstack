import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';

export interface Root {
    calendars: Calendar[];
}

export interface Calendar {
    calendar_date: string;
    calendar_items: CalendarItem[];
}

export interface CalendarItem {
    product_code: string;
    event_code: string;
    event_id: number;
    event_color: string;
    event_border_color: string;
    event_is_read: boolean;
    calendar_section: CalendarSection[];
}

export interface CalendarSection {
    row: number;
    text: string;
    attrs: Attrs;
}

export interface Attrs {
    class: string;
    style: string;
}

export default function Calendar() {
    const isEnableWeekend = false;
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
        // set default date range use today with momentjs to find start and end of week
        start: moment().startOf('week').format('YYYY-MM-DD'),
        end: moment().endOf('week').format('YYYY-MM-DD'),
    });

    const calendarDays = [
        {
            day: 'Sun',
            enabled: isEnableWeekend,
        },
        {
            day: 'Mon',
            enabled: true,
        },
        {
            day: 'Tue',
            enabled: true,
        },
        {
            day: 'Wed',
            enabled: true,
        },
        {
            day: 'Thu',
            enabled: true,
        },
        {
            day: 'Fri',
            enabled: true,
        },
        {
            day: 'Sat',
            enabled: isEnableWeekend,
        },
    ];

    const calendar = useMemo(() => {
        const startDate = moment(dateRange.start);
        const endDate = moment(dateRange.end);
        const tempCalendar: Record<string, { day: string; date: string; enabled: boolean }> = {};
        const currentDate = startDate.clone();

        while (currentDate.isSameOrBefore(endDate)) {
            const dayKey = currentDate.format('ddd');
            tempCalendar[dayKey] = {
                day: dayKey,
                date: currentDate.format('YYYY-MM-DD'),
                enabled: currentDate.day() !== 0 && currentDate.day() !== 6 ? true : isEnableWeekend,
            };
            currentDate.add(1, 'day');
        }
        console.log('generated calendar:', tempCalendar);
        return tempCalendar;
    }, [dateRange]);

    const parseStyleString = (styleString: string) => {
        return styleString
            .split(';')
            .filter(Boolean)
            .reduce((acc: any, item) => {
                const [key, value] = item.split(':').map((s) => s.trim());

                if (!key || !value) return acc;

                // แปลง kebab-case → camelCase
                const camelKey = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase());

                acc[camelKey] = value;
                return acc;
            }, {});
    };

    const data: Root = {
        calendars: [
            {
                calendar_date: '2026-02-12',
                calendar_items: [
                    {
                        product_code: 'SN',
                        event_code: 'KO',
                        event_id: 1,
                        event_color: '#6b3a2e',
                        event_border_color: '#C70039',
                        event_is_read: false,
                        calendar_section: [
                            {
                                row: 1,
                                text: 'STKIKO2409AS4K',
                                attrs: {
                                    class: 'font-bold text-lg text-left',
                                    style: 'font-weight:600;text-align:left;',
                                },
                            },
                            {
                                row: 2,
                                text: '(ADVANC / BH)',
                                attrs: {
                                    class: 'font-bold text-sm text-left mb-2',
                                    style: 'font-weight:600;text-align:left;',
                                },
                            },
                            {
                                row: 3,
                                text: 'Observation - Knock Out & Coupon',
                                attrs: {
                                    class: 'font-bold text-xs text-left',
                                    style: 'font-weight:600;text-align:left;',
                                },
                            },
                            {
                                row: 4,
                                text: 'Coupon 20,000 THB/Unit (before tax)',
                                attrs: {
                                    class: 'font-bold text-xs text-left',
                                    style: 'font-weight:600;text-align:left;',
                                },
                            },
                            {
                                row: 5,
                                text: 'Payment Date: 03-Jul-25',
                                attrs: {
                                    class: 'font-bold text-xs text-left',
                                    style: 'font-weight:600;text-align:left;',
                                },
                            },
                        ],
                    },
                    {
                        product_code: 'PROD002',
                        event_code: 'EVT002',
                        event_id: 2,
                        event_color: '#33FF57',
                        event_border_color: '#39C700',
                        event_is_read: true,
                        calendar_section: [
                            {
                                row: 1,
                                text: 'Event 1 for PROD002',
                                attrs: {
                                    class: 'event-class-2',
                                    style: 'background-color: #33FF57; border-color: #39C700;',
                                },
                            },
                        ],
                    },
                ],
            },
            {
                calendar_date: '2026-02-09',
                calendar_items: [
                    {
                        product_code: 'SN',
                        event_code: 'KO',
                        event_id: 1,
                        event_color: '#6b3a2e',
                        event_border_color: '#C70039',
                        event_is_read: false,
                        calendar_section: [
                            {
                                row: 1,
                                text: 'STKIKO2409AS4K',
                                attrs: {
                                    class: 'font-bold text-lg text-left',
                                    style: 'font-weight:600;text-align:left;',
                                },
                            },
                            {
                                row: 2,
                                text: '(ADVANC / BH)',
                                attrs: {
                                    class: 'font-bold text-sm text-left mb-2',
                                    style: 'font-weight:600;text-align:left;',
                                },
                            },
                            {
                                row: 3,
                                text: 'Observation - Knock Out & Coupon',
                                attrs: {
                                    class: 'font-bold text-xs text-left',
                                    style: 'font-weight:600;text-align:left;',
                                },
                            },
                            {
                                row: 4,
                                text: 'Coupon 20,000 THB/Unit (before tax)',
                                attrs: {
                                    class: 'font-bold text-xs text-left',
                                    style: 'font-weight:600;text-align:left;',
                                },
                            },
                            {
                                row: 5,
                                text: 'Payment Date: 03-Jul-25',
                                attrs: {
                                    class: 'font-bold text-xs text-left',
                                    style: 'font-weight:600;text-align:left;',
                                },
                            },
                        ],
                    },
                    {
                        product_code: 'PROD002',
                        event_code: 'EVT002',
                        event_id: 2,
                        event_color: '#33FF57',
                        event_border_color: '#39C700',
                        event_is_read: true,
                        calendar_section: [
                            {
                                row: 1,
                                text: 'Event 1 for PROD002',
                                attrs: {
                                    class: 'event-class-2',
                                    style: 'background-color: #33FF57; border-color: #39C700;',
                                },
                            },
                        ],
                    },
                ],
            },
        ],
    };

    const handleCalendarDate = (type?: 'prev' | 'next') => {
        // Logic to handle calendar date change
        if (type === 'prev') {
            setDateRange({
                start: moment(dateRange.start).subtract(7, 'days').format('YYYY-MM-DD'),
                end: moment(dateRange.end).subtract(7, 'days').format('YYYY-MM-DD'),
            });
        }
        if (type === 'next') {
            setDateRange({
                start: moment(dateRange.start).add(7, 'days').format('YYYY-MM-DD'),
                end: moment(dateRange.end).add(7, 'days').format('YYYY-MM-DD'),
            });
        }
    };

    useEffect(() => {
        console.log('fetch calendar data');
        console.log('Date Range Changed:', dateRange);
    }, [dateRange]);

    return (
        <>
            <div className="flex gap-2">
                <div className="cursor-pointer" onClick={() => handleCalendarDate('prev')}>
                    &lt;
                </div>
                <div>
                    {' '}
                    {moment(dateRange.start).format('D')} - {moment(dateRange.end).format('D MMM, YYYY')}
                </div>
                <div className="cursor-pointer" onClick={() => handleCalendarDate('next')}>
                    &gt;
                </div>
            </div>
            <div className={`${isEnableWeekend ? 'grid grid-cols-7' : 'grid grid-cols-5'} gap-2`}>
                {calendarDays
                    .filter((f) => f.enabled)
                    .map((day, index) => (
                        <div key={`headers_` + day.day + `_` + index} className="font-bold text-center">
                            {day.day}
                        </div>
                    ))}
            </div>

            <div className={`${isEnableWeekend ? 'grid grid-cols-7' : 'grid grid-cols-5'} gap-2 h-screen overflow-y-auto`}>
                {calendarDays
                    .filter((f) => f.enabled)
                    .map((day, index) => (
                        <div key={`body_` + day.day + `_` + index} className="border max-h-screen p-2">
                            {/* {calendar[day.day]?.day} */}
                            {data.calendars
                                .filter((c) => c.calendar_date === calendar[day.day]?.date)
                                .map((m) => (
                                    <div className="grid grid-cols-1 gap-2" key={m.calendar_date}>
                                        {m.calendar_items.map((item) => (
                                            <div
                                                key={item.product_code + '_' + item.event_code + '_' + item.event_id}
                                                className="bg-slate-200 border border-slate-200 dark:bg-slate-700 dark:border-slate-700 rounded-md min-h-10 px-4 py-1 relative overflow-hidden">
                                                {item.calendar_section.map((section, sectionIndex) => (
                                                    <React.Fragment key={sectionIndex + '_' + section.row}>
                                                        <div className="w-2 h-full absolute left-0 top-0 bottom-0 bg-blue-400 rounded-l-md"></div>
                                                        <div className="flex">
                                                            <div
                                                                className={section.attrs.class}
                                                                style={parseStyleString(section.attrs.style)}>
                                                                {section.text}
                                                            </div>
                                                            <div className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center dark:text-slate-200 rounded-full bg-amber-400 dark:bg-amber-400/75 px-1">
                                                                <span className="text-lg">{item.event_code}</span>
                                                            </div>
                                                        </div>
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                        </div>
                    ))}
            </div>
        </>
    );
}
