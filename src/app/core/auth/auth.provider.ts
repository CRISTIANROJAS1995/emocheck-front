import { EnvironmentProviders, Provider } from '@angular/core';

/**
 * @deprecated Auth is configured in app.config.ts via provideHttpClient(withInterceptors([authInterceptor])).
 * Keeping this function as a no-op prevents accidentally registering duplicate interceptors/providers.
 */
export const provideAuth = (): Array<Provider | EnvironmentProviders> => [];
