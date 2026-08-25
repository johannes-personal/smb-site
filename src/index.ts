// @smb-site/engine — the parts of a small-business site that are the same
// every time.
//
// What is in here: the domain models (facts, hours, taxonomy, collections),
// the blocks a page is built from, and the page editor's registry.
//
// What is deliberately NOT in here: anything that knows where data lives or
// how a route is served. The host application owns the database, the routes
// and the environment; it passes facts and resolved items in. That seam is the
// reason this is a dependency rather than a template to copy — the previous
// version was copied per project, and five bugs came from copies nobody had
// run in months.

export * from "./facts";
export * from "./hours";
export * from "./taxonomy";
export * from "./links";
export * from "./collections";
export * from "./jsonld";
export * from "./types";
export * from "./puck.config";
export { SiteHeader } from "./components/SiteHeader";
export { SiteFooter } from "./components/SiteFooter";
export { ProductCard } from "./components/ProductCard";
export * from "./components/blocks";
