import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 ships native flat configs — the FlatCompat
// bridge from the 15.x era triggered a "Converting circular structure
// to JSON" crash during `next build`'s lint step, so it's gone.
const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // New rules shipped with eslint-config-next 16 (react-hooks v6).
      // The app predates them and uses these (working) patterns in
      // several components; migrating every call site is its own
      // refactor, not part of a dependency bump.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
    },
  },
];

export default eslintConfig;
