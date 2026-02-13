// This file used to contain a legacy/mock AuthService from the Fuse template.
// The app now uses the real backend-connected AuthService in core/services.
// Re-export it here to avoid having two AuthService implementations in the codebase.
export { AuthService } from 'app/core/services/auth.service';
