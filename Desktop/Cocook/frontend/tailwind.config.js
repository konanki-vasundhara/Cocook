/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        "primary": "#9f4118",
        "on-secondary-fixed-variant": "#334d38",
        "on-tertiary": "#ffffff",
        "on-tertiary-fixed-variant": "#930013",
        "primary-fixed": "#ffdbce",
        "primary-container": "#ff8a5b",
        "on-secondary": "#ffffff",
        "surface-container-highest": "#e6e2d8",
        "background": "#fdf9ef",
        "surface-bright": "#fdf9ef",
        "on-secondary-container": "#4e6953",
        "tertiary-fixed": "#ffdad7",
        "on-background": "#1c1c16",
        "surface-container": "#f1eee4",
        "secondary": "#4a654f",
        "on-primary-container": "#722500",
        "secondary-fixed": "#cceacf",
        "inverse-surface": "#31312a",
        "surface-container-high": "#ece8de",
        "surface-tint": "#9f4118",
        "surface-container-low": "#f7f3e9",
        "tertiary-container": "#ff8780",
        "tertiary": "#b91a24",
        "primary-fixed-dim": "#ffb599",
        "secondary-container": "#c9e7cc",
        "on-primary": "#ffffff",
        "on-surface": "#1c1c16",
        "on-secondary-fixed": "#062010",
        "on-surface-variant": "#56423b",
        "outline": "#8a726a",
        "surface": "#fdf9ef",
        "surface-container-lowest": "#ffffff",
        "error-container": "#ffdad6",
        "outline-variant": "#ddc1b7",
        "inverse-primary": "#ffb599",
        "surface-variant": "#e6e2d8",
        "inverse-on-surface": "#f4f0e6",
        "on-primary-fixed-variant": "#7f2b01",
        "on-primary-fixed": "#370e00",
        "on-tertiary-fixed": "#410004",
        "on-tertiary-container": "#830010",
        "tertiary-fixed-dim": "#ffb3ad",
        "surface-dim": "#dddad0",
        "on-error": "#ffffff",
        "error": "#ba1a1a",
        "secondary-fixed-dim": "#b0ceb4",
        "on-error-container": "#93000a"
      },
      "borderRadius": {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      "spacing": {
        "unit": "8px",
        "container-padding-desktop": "48px",
        "gutter": "24px",
        "section-gap": "64px",
        "container-padding-mobile": "20px"
      },
      "fontFamily": {
        "body-lg": ["Plus Jakarta Sans", "sans-serif"],
        "body-md": ["Plus Jakarta Sans", "sans-serif"],
        "headline-lg": ["Plus Jakarta Sans", "sans-serif"],
        "title-md": ["Plus Jakarta Sans", "sans-serif"],
        "headline-lg-mobile": ["Plus Jakarta Sans", "sans-serif"],
        "display-lg": ["Plus Jakarta Sans", "sans-serif"],
        "label-md": ["Plus Jakarta Sans", "sans-serif"]
      },
      "fontSize": {
        "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
        "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "700"}],
        "title-md": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
        "headline-lg-mobile": ["28px", {"lineHeight": "36px", "fontWeight": "700"}],
        "display-lg": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
        "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.02em", "fontWeight": "600"}]
      },
      "keyframes": {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      "animation": {
        "fade-in": "fade-in 0.5s ease-out forwards"
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
