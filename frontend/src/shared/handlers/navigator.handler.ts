/* eslint-disable @typescript-eslint/no-explicit-any */
export function openPopup(route: string, options?: any) {
    const params = new URLSearchParams();
    //let baseUrl = import.meta.env.BASE_URL
    const endpoint = `${window.origin}${route}`;

    if (options) {
        Object.keys(options).forEach(key => {
            params.append(key, options[key]);
        });
    }
    const windowName = 'wealth_ks_popup_'+ Math.floor(Math.random() * 80000);
    window.open(`${endpoint}?${params.toString()}`, windowName, 'resizable=yes,scrollbars=yes,toolbar=no,status=yes,height=600,width=1000');
}

export const isWindowPopup = () => (window.name || '').startsWith('wealth_ks_popup_');