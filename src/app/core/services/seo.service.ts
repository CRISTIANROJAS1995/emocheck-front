import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';

export interface SeoConfig {
    title?: string;
    description?: string;
    keywords?: string;
    canonical?: string;
    ogImage?: string;
}

const APP_NAME = 'EmoCheck';
const DEFAULT_DESCRIPTION =
    'EmoCheck es una plataforma de bienestar emocional y salud mental laboral. Evalúa, monitorea y mejora el bienestar de tu equipo con análisis predictivos y recursos personalizados.';
const DEFAULT_KEYWORDS =
    'bienestar emocional, salud mental laboral, evaluación psicológica, análisis emocional, EmoCheck, burnout, clima organizacional, riesgo psicosocial';
const DEFAULT_OG_IMAGE = 'https://www.emocheck.app/images/logo/emocheck-og.png';
const BASE_URL = 'https://www.emocheck.app';

@Injectable({ providedIn: 'root' })
export class SeoService {
    constructor(
        private title: Title,
        private meta: Meta,
        private router: Router,
        private activatedRoute: ActivatedRoute,
    ) {}

    /**
     * Inicia la escucha de eventos de navegación para actualizar
     * automáticamente los meta tags al cambiar de ruta.
     */
    init(): void {
        this.router.events
            .pipe(
                filter((e) => e instanceof NavigationEnd),
                map(() => {
                    let route = this.activatedRoute;
                    while (route.firstChild) {
                        route = route.firstChild;
                    }
                    return route;
                }),
                filter((route) => route.outlet === 'primary'),
                map((route) => route.snapshot.data)
            )
            .subscribe((data) => {
                const seo: SeoConfig = data?.['seo'] ?? {};
                this.update(seo);
            });
    }

    /**
     * Actualiza manualmente todos los meta tags de SEO.
     */
    update(config: SeoConfig): void {
        const pageTitle = config.title
            ? `${config.title} | ${APP_NAME}`
            : APP_NAME;
        const description = config.description ?? DEFAULT_DESCRIPTION;
        const keywords = config.keywords ?? DEFAULT_KEYWORDS;
        const canonicalUrl = config.canonical
            ? `${BASE_URL}${config.canonical}`
            : `${BASE_URL}${this.router.url.split('?')[0]}`;
        const ogImage = config.ogImage ?? DEFAULT_OG_IMAGE;

        // ── Título ────────────────────────────────────────────────────────────
        this.title.setTitle(pageTitle);

        // ── Meta estándar ─────────────────────────────────────────────────────
        this.upsertTag('description', description);
        this.upsertTag('keywords', keywords);

        // ── Open Graph ────────────────────────────────────────────────────────
        this.upsertProperty('og:type', 'website');
        this.upsertProperty('og:site_name', APP_NAME);
        this.upsertProperty('og:title', pageTitle);
        this.upsertProperty('og:description', description);
        this.upsertProperty('og:url', canonicalUrl);
        this.upsertProperty('og:image', ogImage);
        this.upsertProperty('og:image:width', '1200');
        this.upsertProperty('og:image:height', '630');

        // ── Twitter Card ──────────────────────────────────────────────────────
        this.upsertTag('twitter:card', 'summary_large_image');
        this.upsertTag('twitter:site', '@EmoCheck');
        this.upsertTag('twitter:title', pageTitle);
        this.upsertTag('twitter:description', description);
        this.upsertTag('twitter:image', ogImage);

        // ── Canonical ─────────────────────────────────────────────────────────
        this.setCanonical(canonicalUrl);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private upsertTag(name: string, content: string): void {
        if (this.meta.getTag(`name='${name}'`)) {
            this.meta.updateTag({ name, content });
        } else {
            this.meta.addTag({ name, content });
        }
    }

    private upsertProperty(property: string, content: string): void {
        if (this.meta.getTag(`property='${property}'`)) {
            this.meta.updateTag({ property, content });
        } else {
            this.meta.addTag({ property, content });
        }
    }

    private setCanonical(url: string): void {
        // Busca el link canónico en el <head> y lo actualiza o crea
        let link: HTMLLinkElement | null = document.querySelector("link[rel='canonical']");
        if (!link) {
            link = document.createElement('link');
            link.setAttribute('rel', 'canonical');
            document.head.appendChild(link);
        }
        link.setAttribute('href', url);
    }
}
