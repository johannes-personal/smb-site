// Every link that leaves the site opens in a new tab.
//
// For a shop this is not a stylistic preference. A visitor who taps "Route
// plannen" and lands in Google Maps has left; on a phone, coming back means
// finding the browser again and hoping the page survived. The same goes for
// Facebook and for the shoemaker in Nunspeet. Keeping our own tab alive is the
// difference between a detour and an exit.
//
// `rel` is not optional. `noopener` stops the opened page reaching back through
// `window.opener`, and `noreferrer` keeps our URLs out of its analytics.

/** True for anything that leaves this site: another origin, or a scheme that
 *  hands off to another app entirely. `tel:` and `mailto:` are excluded — they
 *  open a dialer or a mail client, and a blank tab left behind is litter. */
export function isExternal(href: string): boolean {
  return /^(https?:)?\/\//i.test(href.trim());
}

export type ExternalProps = { target?: "_blank"; rel?: string };

/** Spread onto an anchor. Returns nothing for internal links, so it is safe to
 *  apply to a href that may be either. */
export function externalProps(href: string | undefined | null): ExternalProps {
  if (!href || !isExternal(href)) return {};
  return { target: "_blank", rel: "noopener noreferrer" };
}
