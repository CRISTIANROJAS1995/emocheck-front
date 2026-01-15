/**
 * Color Design Tokens
 * Centraliza todos los colores y gradientes usados en la aplicación
 */

export const Colors = {
    primary: {
        green: '#7CCF00',
        greenDark: '#5EA500',
        greenLight: '#9AE600',
        teal: '#00BBA7',
        tealDark: '#009689',
        tealLight: '#00D5BE',
        blue: '#2B7FFF',
        blueDark: '#155DFC',
    },

    text: {
        primary: '#0A0A0A',
        secondary: '#4A5565',
        tertiary: '#2D3748',
        white: '#FFFFFF',
    },

    border: {
        teal: '#96F7E4',
        gray: '#E5E7EB',
        green: '#D8F999',
    },

    background: {
        gray: '#F3F3F5',
        greenLight: '#F7FEE7',
        blueLight: '#EBF5FF',
        tealLight: '#F0FDFA',
    },

    gradients: {
        primaryButton: 'linear-gradient(90deg, #7CCF00 0%, #5EA500 100%)',
        secondaryButton: 'linear-gradient(90deg, #00BBA7 0%, #009689 100%)',
        tertiaryButton: 'linear-gradient(90deg, #2B7FFF 0%, #155DFC 100%)',
        greenCard: 'linear-gradient(135deg, #9AE600 0%, #7CCF00 100%)',
        blueCard: 'linear-gradient(135deg, #2B7FFF 0%, #155DFC 100%)',
        tealCard: 'linear-gradient(135deg, #00BBA7 0%, #009689 100%)',
        pageBackground: 'linear-gradient(135deg, #EFF6FF 0%, #FFF 50%, #F0FDFA 100%)',
        homeBackground: 'linear-gradient(180deg, #F0FDF4 0%, #FEFEFE 40%, #F0FDFA 100%)',
        banner: 'linear-gradient(90deg, #00BBA7 0%, #009689 45%, #155DFC 100%)',
    },
};

export const Spacing = {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
};

export const BorderRadius = {
    sm: '8px',
    md: '14px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
};

export const Shadows = {
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.10), 0 8px 10px -6px rgba(0, 0, 0, 0.10)',
};
