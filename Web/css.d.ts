// This file provides fallback to css files TypeScript definitions.
// On CI, lint is run without running build, so the `.d.ts` files of
// `.module.css` files are not generated. When those `.d.ts` files are not
// available - TypeScript will use this file for types.

type CSSModuleClasses = { readonly [key: string]: string };

declare module '*.module.css' {
  const classes: CSSModuleClasses;
  export default classes;
}
