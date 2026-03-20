import { Component, ViewEncapsulation, AfterViewInit, OnDestroy, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AuthService } from 'app/core/services/auth.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { EmoButtonComponent } from 'app/shared/components';

@Component({
    selector: 'landing-welcome',
    templateUrl: './welcome.component.html',
    styleUrls: ['./welcome.component.scss'],
    encapsulation: ViewEncapsulation.ShadowDom,
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, EmoButtonComponent],
})
export class LandingWelcomeComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('signInNgForm') signInNgForm: NgForm;

    // ── Sign-in modal state ───────────────────────────────────────────────────
    showSignInModal  = false;
    showPassword     = false;
    showForgotModal  = false;
    signInForm: UntypedFormGroup;

    private _scrollHandler!: () => void;
    private _observers: IntersectionObserver[] = [];

    constructor(
        private _el: ElementRef,
        private _formBuilder: UntypedFormBuilder,
        private _authService: AuthService,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _alertService: AlertService,
    ) {}

    ngOnInit(): void {
        this.signInForm = this._formBuilder.group({
            email:      ['', [Validators.required]],
            password:   ['', Validators.required],
            rememberMe: [''],
        });
    }

    openSignInModal(): void {
        this.showSignInModal = true;
        this.showPassword    = false;
        this.showForgotModal = false;
    }

    closeSignInModal(): void {
        this.showSignInModal = false;
    }

    signIn(): void {
        if (this.signInForm.invalid) {
            this.signInForm.markAllAsTouched();
            return;
        }
        this.signInForm.disable();
        const credentials = {
            email:    this.signInForm.get('email')?.value,
            password: this.signInForm.get('password')?.value,
        };
        this._authService.signIn(credentials).subscribe({
            next: () => {
                this.signInForm.enable();
                const redirectURLParam = this._activatedRoute.snapshot.queryParamMap.get('redirectURL');
                const redirectURL = redirectURLParam
                    ? (redirectURLParam.startsWith('/') ? redirectURLParam : `/${redirectURLParam}`)
                    : '/signed-in-redirect';
                this._router.navigateByUrl(redirectURL);
            },
            error: (error) => {
                this.signInForm.enable();
                const msg = error?.message || error?.body?.message || 'Credenciales inválidas';
                this._alertService.error(msg);
            },
        });
    }

    private get _root(): ShadowRoot | HTMLElement {
        return this._el.nativeElement.shadowRoot ?? this._el.nativeElement;
    }

    ngAfterViewInit(): void {
        this._loadSwiper();
        this._initAnchorLinks();

        // Navbar scroll
        const navbar = this._root.querySelector<HTMLElement>('#lp-navbar');
        this._scrollHandler = () => {
            navbar?.classList.toggle('scrolled', window.scrollY > 50);
            const scrollBtn = this._root.querySelector<HTMLElement>('#lp-scrollup');
            scrollBtn?.classList.toggle('visible', window.scrollY > 300);
        };
        window.addEventListener('scroll', this._scrollHandler);

        // Hamburger
        const hamburger = this._root.querySelector<HTMLElement>('#lp-hamburger');
        const mobileMenu = this._root.querySelector<HTMLElement>('#lp-mobile-menu');
        hamburger?.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            mobileMenu?.classList.toggle('open');
        });
        mobileMenu?.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                hamburger?.classList.remove('open');
                mobileMenu?.classList.remove('open');
            });
        });

        // Scroll-to-top
        const scrollBtn = this._root.querySelector<HTMLElement>('#lp-scrollup');
        scrollBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

        // Fade observer
        const fadeObserver = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) { e.target.classList.add('visible'); fadeObserver.unobserve(e.target); }
            });
        }, { threshold: 0.12 });
        this._root.querySelectorAll('.lp-fade').forEach(el => fadeObserver.observe(el));
        this._observers.push(fadeObserver);

        // Counters
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) { this._animateCounter(e.target as HTMLElement); counterObserver.unobserve(e.target); }
            });
        }, { threshold: 0.5 });
        this._root.querySelectorAll('.lp-counter').forEach(el => counterObserver.observe(el));
        this._observers.push(counterObserver);

        // Progress bars
        const progressObserver = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    const el = e.target as HTMLElement;
                    el.style.width = el.dataset['width'] + '%';
                    progressObserver.unobserve(e.target);
                }
            });
        }, { threshold: 0.3 });
        this._root.querySelectorAll('.lp-progress-bar').forEach(el => progressObserver.observe(el));
        this._observers.push(progressObserver);
    }

    private _scrollToSection(id: string): void {
        const el = this._root.querySelector<HTMLElement>(id);
        if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    }

    private _initAnchorLinks(): void {
        this._root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href');
                if (target && target.length > 1) {
                    this._scrollToSection(target);
                    // Cierra menú móvil si está abierto
                    this._root.querySelector('#lp-hamburger')?.classList.remove('open');
                    this._root.querySelector('#lp-mobile-menu')?.classList.remove('open');
                }
            });
        });
    }

    private _animateCounter(el: HTMLElement): void {
        const target = +(el.dataset['target'] || 0);
        const step = target / (1800 / 16);
        let current = 0;
        const timer = setInterval(() => {
            current += step;
            if (current >= target) { current = target; clearInterval(timer); }
            el.textContent = Math.floor(current).toLocaleString('es-CO');
        }, 16);
    }

    private _loadSwiper(): void {
        if ((window as any)['Swiper']) { this._initSwiper(); return; }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';
        script.onload = () => this._initSwiper();
        document.head.appendChild(script);
    }

    private _initSwiper(): void {
        const swiperEl = this._root.querySelector('.lp-clients-swiper');
        if (swiperEl) {
            new (window as any)['Swiper'](swiperEl, {
                slidesPerView: 2, spaceBetween: 30, loop: true,
                autoplay: { delay: 2500, disableOnInteraction: false },
                breakpoints: { 480: { slidesPerView: 3 }, 768: { slidesPerView: 4 }, 1024: { slidesPerView: 5 } }
            });
        }
    }

    ngOnDestroy(): void {
        window.removeEventListener('scroll', this._scrollHandler);
        this._observers.forEach(o => o.disconnect());
    }
}
