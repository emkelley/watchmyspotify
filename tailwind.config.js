module.exports = {
  purge: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    fontFamily: {
      sans: ["Space Grotesk", "sans-serif"],
    },
    extend: {
      colors: {
        gray: {
          950: "#0C121D",
          975: "#030508",
        },
        primary: {
          light: "#D1FAE5", // For lighter primary color
          DEFAULT: "#047857", // Normal primary color
          dark: "#14533C", // Used for hover, active, etc.
        },
      },
    },
  },
  variants: {
    extend: {
      opacity: ["disabled"],
    },
  },
  plugins: [require("kutty")],
};
