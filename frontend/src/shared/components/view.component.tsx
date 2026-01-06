/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import { ViewRoute } from '../constants/routes';
import { openPopup } from '../handlers/navigator.handler';

type ChildProps = {
    id: string;
    viewKey: string;
    cell: any;
    disabled?: boolean;
};

export default function ViewComponent({ id, viewKey, cell, disabled }: ChildProps) {
    const text = cell.text;

    const { link, linkOptions } = useMemo(() => {
        switch (viewKey) {
            case 'feature':
                return {
                    link: ViewRoute.featureFullPath,
                    linkOptions: { featureId: cell['data']['featureId'] },
                };

            default: {
                return { link: null, linkOptions: null };
            }
        }
    }, [viewKey, cell]);

    function onClickLink() {
        if (disabled || !link) return;

        console.log(link, linkOptions);
        openPopup(link, linkOptions);
    }

    return (
        <a id={'view_' + id} onClick={onClickLink}>
            {text}
        </a>
    );
}
