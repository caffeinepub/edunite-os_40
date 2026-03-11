/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      /* ============================================================
         FONT FAMILIES
         ============================================================ */
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      /* ============================================================
         COLOR TOKENS — all reference OKLCH CSS custom properties
         from index.css. Do NOT add raw hex values here.
         ============================================================ */
      colors: {
        /* Semantic tokens (shadcn/ui compat) */
        background:  'var(--color-background)',
        foreground:  'var(--color-foreground)',
        border:      'var(--color-border)',
        input:       'var(--color-input)',
        ring:        'var(--color-ring)',

        primary: {
          DEFAULT:    'var(--color-primary)',
          hover:      'var(--color-primary-hover)',
          active:     'var(--color-primary-active)',
          subtle:     'var(--color-primary-subtle)',
          foreground: 'var(--color-primary-foreground)',
        },
        secondary: {
          DEFAULT:    'var(--color-secondary)',
          hover:      'var(--color-secondary-hover)',
          foreground: 'var(--color-secondary-foreground)',
        },
        muted: {
          DEFAULT:    'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        accent: {
          DEFAULT:    'var(--color-accent)',
          foreground: 'var(--color-accent-foreground)',
        },
        destructive: {
          DEFAULT:    'var(--color-destructive)',
          subtle:     'var(--color-destructive-subtle)',
          foreground: 'var(--color-destructive-foreground)',
        },
        success: {
          DEFAULT:    'var(--color-success)',
          subtle:     'var(--color-success-subtle)',
          foreground: 'var(--color-success-foreground)',
        },
        warning: {
          DEFAULT:    'var(--color-warning)',
          subtle:     'var(--color-warning-subtle)',
          foreground: 'var(--color-warning-foreground)',
        },
        info: {
          DEFAULT:    'var(--color-info)',
          subtle:     'var(--color-info-subtle)',
          foreground: 'var(--color-info-foreground)',
        },
        card: {
          DEFAULT:    'var(--color-card)',
          foreground: 'var(--color-card-foreground)',
        },
        popover: {
          DEFAULT:    'var(--color-popover)',
          foreground: 'var(--color-popover-foreground)',
        },
        surface: {
          DEFAULT:    'var(--color-surface)',
          raised:     'var(--color-surface-raised)',
          overlay:    'var(--color-surface-overlay)',
        },

        /* Sidebar tokens */
        sidebar: {
          DEFAULT:    'var(--color-sidebar)',
          foreground: 'var(--color-sidebar-foreground)',
          primary: {
            DEFAULT:    'var(--color-sidebar-primary)',
            foreground: 'var(--color-sidebar-primary-foreground)',
          },
          accent: {
            DEFAULT:    'var(--color-sidebar-accent)',
            foreground: 'var(--color-sidebar-accent-foreground)',
          },
          border:     'var(--color-sidebar-border)',
          ring:       'var(--color-sidebar-ring)',
        },

        /* Legacy brand tokens — kept for backward compat, do NOT remove */
        edpurple: {
          50:  'oklch(0.97 0.03 290)',
          100: 'oklch(0.93 0.06 290)',
          200: 'oklch(0.86 0.10 290)',
          300: 'oklch(0.76 0.14 290)',
          400: 'oklch(0.63 0.18 290)',
          500: 'oklch(0.53 0.21 290)',
          600: 'oklch(0.45 0.22 290)',
          700: 'oklch(0.38 0.21 290)',
          800: 'oklch(0.30 0.18 290)',
          900: 'oklch(0.22 0.14 290)',
        },
        lavender: {
          50:  'oklch(0.97 0.02 290)',
          100: 'oklch(0.93 0.04 290)',
          200: 'oklch(0.88 0.06 290)',
          300: 'oklch(0.80 0.09 290)',
          400: 'oklch(0.70 0.12 290)',
          500: 'oklch(0.60 0.14 290)',
        },
      },

      /* ============================================================
         BORDER RADIUS SCALE
         ============================================================ */
      borderRadius: {
        none:  'var(--radius-none)',
        xs:    'var(--radius-xs)',
        sm:    'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md:    'var(--radius-md)',
        lg:    'var(--radius-lg)',
        xl:    'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full:  'var(--radius-full)',
      },

      /* ============================================================
         SPACING SCALE (4px base)
         xs=4  sm=8  md=16  lg=24  xl=32  2xl=48  3xl=64
         ============================================================ */
      spacing: {
        xs:  'var(--space-xs)',
        sm:  'var(--space-sm)',
        md:  'var(--space-md)',
        lg:  'var(--space-lg)',
        xl:  'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
        '3xl': 'var(--space-3xl)',
      },

      /* ============================================================
         BOX SHADOWS
         ============================================================ */
      boxShadow: {
        xs:    'var(--shadow-xs)',
        sm:    'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md:    'var(--shadow-md)',
        lg:    'var(--shadow-lg)',
        xl:    'var(--shadow-xl)',
        focus: 'var(--shadow-focus)',
        card:  'var(--shadow-sm)',
      },

      /* ============================================================
         TYPOGRAPHY SCALE
         ============================================================ */
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        xs:    ['0.75rem',  { lineHeight: '1rem' }],
        sm:    ['0.875rem', { lineHeight: '1.25rem' }],
        base:  ['1rem',     { lineHeight: '1.5rem' }],
        lg:    ['1.125rem', { lineHeight: '1.75rem' }],
        xl:    ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem',   { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem',  { lineHeight: '2.5rem' }],
        '5xl': ['3rem',     { lineHeight: '1' }],
      },

      /* ============================================================
         KEYFRAME ANIMATIONS (accordion only — no entrance animations)
         ============================================================ */
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
  ],
};
