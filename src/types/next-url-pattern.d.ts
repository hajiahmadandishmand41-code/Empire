// Next.js 16.3's declaration surface refers to these URLPattern helper
// types. TypeScript's DOM lib exposes URLPatternInit but not these aliases.
// Keep the declarations local to the application instead of suppressing
// node_modules diagnostics with skipLibCheck.
type URLPatternInput = string | URLPatternInit;
interface URLPatternOptions {
  ignoreCase?: boolean;
}
