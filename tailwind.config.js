/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  corePlugins: {
    // Legacy pages still rely on hand-written CSS resets/defaults.
    // Preflight is off globally so migrating one page at a time doesn't
    // reset headings/buttons/lists on pages that haven't moved to Tailwind yet.
    preflight: false,
  },
  theme: {
    extend: {
      screens: {
        split: "900px",
        wide: "992px",
      },
      colors: {
        "signal-blue": "#0080ff",
        "voltage-violet": "#0050ff",
        "sky-wash": "#c5e0fb",
        "pencil-gray": "#8c9baa",
        graphite: "#636f7b",
        ink: "#000000",
        carbon: "#222222",
        paper: "#ffffff",
        "surface-bg": "#f8fafc",
        "border-subtle": "#e2e8f0",
      },
      borderRadius: {
        buttons: "1600px",
        cards: "16px",
        inputs: "8px",
        tags: "1600px",
        images: "24px",
      },
      boxShadow: {
        card: "0px 10px 30px rgba(0, 0, 0, 0.04), 0px 2px 8px rgba(0, 0, 0, 0.02)",
        float: "0px 18px 40px -10px rgba(0, 0, 0, 0.06), 0px 1px 3px rgba(0, 0, 0, 0.04)",
        "glow-blue": "0px 10px 30px rgba(0, 128, 255, 0.35)",
        "glow-blue-lg": "0px 12px 32px rgba(0, 128, 255, 0.45)",
        "float-sitemap": "0px 12px 32px rgba(147, 197, 253, 0.25), 0px 18px 40px -10px rgba(0, 0, 0, 0.06), 0px 1px 3px rgba(0, 0, 0, 0.04)",
      },
      fontFamily: {
        inter: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      keyframes: {
        shine: {
          "0%": { transform: "translateX(-100%) translateY(-100%) rotate(45deg)" },
          "100%": { transform: "translateX(100%) translateY(100%) rotate(45deg)" },
        },
      },
      animation: {
        shine: "shine 3s infinite",
      },
    },
  },
  plugins: [],
};
