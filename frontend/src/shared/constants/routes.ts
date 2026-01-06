export class PreRoute {
    static prefix = '/pre';
    static login = '/login';
    static loginFullPath: string = `${PreRoute.prefix}${PreRoute.login}`;

    static register = '/register';
    static registerFullPath: string = `${PreRoute.prefix}${PreRoute.register}`;

    static forgotPassword = '/forgot-password';
    static forgotPasswordFullPath: string = `${PreRoute.prefix}${PreRoute.forgotPassword}`;
}

export class CommonRoute {
    static unauthorized = '/unauthorized';
    static notFound = '/not-found';
}

export class ViewRoute {
    static prefix = '/view';

    static feature = '/feature';
    static featureFullPath: string = `${ViewRoute.prefix}${ViewRoute.feature}`;

    static client = '/client';
    static clientFullPath: string = `${ViewRoute.prefix}${ViewRoute.client}`;

    static product = '/product';
    static productFullPath: string = `${ViewRoute.prefix}${ViewRoute.product}`;
}