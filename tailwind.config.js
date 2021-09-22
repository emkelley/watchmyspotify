module.exports = {
  purge: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    fontFamily: {
      sans: ["Nunito", "sans-serif"],
    },
    extend: {
      colors: {
        gray: {
          950: "#0C121D",
        },
        primary: {
          light: "#D1FAE5", // For lighter primary color
          DEFAULT: "#27A074", // Normal primary color
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
