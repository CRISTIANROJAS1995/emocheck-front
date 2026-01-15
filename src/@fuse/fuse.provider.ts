import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
    EnvironmentProviders,
    Provider,
    importProvidersFrom,
    inject,
    provideEnvironmentInitializer,
} from '@angular/core';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { FUSE_CONFIG } from '@fuse/services/config/config.constants';
import { FuseLoadingService, fuseLoadingInterceptor } from '@fuse/services/loading';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FusePlatformService } from '@fuse/services/platform';
import { FuseSplashScreenService } from '@fuse/services/splash-screen';
import { FuseUtilsService } from '@fuse/services/utils';

export const provideFuse = (
    config: any
): Array<Provider | EnvironmentProviders> => {
    return [
        {
            provide: MATERIAL_SANITY_CHECKS,
            useValue: {
                doctype: true,
                theme: false,
                version: true,
            },
        },
        {
            provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
            useValue: {
                appearance: 'fill',
            },
        },
        {
            provide: FUSE_CONFIG,
            useValue: config,
        },
        importProvidersFrom(MatDialogModule),
        provideEnvironmentInitializer(() => inject(FuseLoadingService)),
        provideEnvironmentInitializer(() => inject(FuseMediaWatcherService)),
        provideEnvironmentInitializer(() => inject(FusePlatformService)),
        provideEnvironmentInitializer(() => inject(FuseSplashScreenService)),
        provideEnvironmentInitializer(() => inject(FuseUtilsService)),
        provideHttpClient(withInterceptors([fuseLoadingInterceptor])),
    ];
};
