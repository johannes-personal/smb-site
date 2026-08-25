import type { Facts } from "../facts";
import { describeNextOpen, isOpenNow } from "../hours";
import { externalProps } from "../links";

/** Header and footer are locked — they are not part of the editable canvas.
 *  Their content comes from facts, so the owner still changes the phone number
 *  or a menu item in one place and sees it here.
 *
 *  Three rows, in the order a visitor needs them:
 *
 *  1. A utility strip carrying what every page of a shop site repeats — where,
 *     open or not, and the phone number. Competitors put this above the logo;
 *     it is the row that answers "can I go there this afternoon".
 *  2. The name, with the things that distinguish this shop from a chain.
 *  3. The catalogue itself. Departments expand on hover and on focus, so a
 *     visitor reaches a category from any page without a stop at a landing
 *     page in between.
 */
export function SiteHeader({ facts }: { facts: Facts }) {
  const items = facts.meta.nav ?? [];
  const { nap } = facts;
  const open = isOpenNow(facts.hours);

  return (
    <header>
      <div className="bg-(--color-brand-dark) text-white">
        <div className="page flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2 text-sm">
          <p className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`inline-block h-2 w-2 rounded-full ${open ? "bg-emerald-400" : "bg-white/40"}`}
            />
            {describeNextOpen(facts.hours, "nl-NL")}
          </p>
          <p className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <span className="hidden sm:inline">
              {nap.address.street}, {nap.address.city}
            </span>
            <a href={`tel:${nap.phone}`} className="font-semibold hover:underline">
              {nap.phoneDisplay}
            </a>
          </p>
        </div>
      </div>

      <div className="page flex flex-wrap items-end justify-between gap-4 py-5">
        <a href="/" className="group">
          <span className="font-(family-name:--font-display) text-2xl leading-none font-semibold text-(--color-brand-dark) group-hover:underline sm:text-3xl">
            {facts.meta.siteName}
          </span>
          {facts.meta.tagline && (
            <span className="mt-1 block text-sm text-(--color-muted)">{facts.meta.tagline}</span>
          )}
        </a>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-(--color-muted)">
          {(facts.meta.predicates ?? []).map((p) => (
            <li key={p.id} className="font-medium text-(--color-accent)">
              {p.label}
            </li>
          ))}
          <li>Eigen steunzolen welkom</li>
          <li>Vier generaties vakmanschap</li>
        </ul>
      </div>

      <nav aria-label="Hoofdmenu" className="border-y border-black/10 bg-(--color-brand-tint)">
        {/* Every item keeps the same padding on both sides. `first:pl-0` made
            the first one look clipped, with its hover block flush against the
            text. The list is pulled out by one step inside the page container
            instead, so the first label still lines up with the logo above it
            and the padding stays even — the container keeps doing the
            centring, which a negative margin on `.page` itself would break. */}
        <div className="page">
          <ul className="-mx-4 flex flex-wrap items-stretch">
          {items.map((item) => (
            <li key={item.href} className="group relative">
              <a
                href={item.href}
                {...externalProps(item.href)}
                className="block px-4 py-3 font-medium text-(--color-brand-dark) hover:bg-(--color-brand) hover:text-white"
              >
                {item.label}
              </a>
              {item.children && item.children.length > 0 && (
                // Hover *or* focus-within, so the dropdown is reachable by
                // keyboard and not only by mouse.
                <ul className="invisible absolute top-full left-0 z-20 min-w-56 border border-black/10 bg-white py-2 opacity-0 shadow-lg group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  {item.children.map((child) => (
                    <li key={child.href}>
                      <a
                        href={child.href}
                        {...externalProps(child.href)}
                        className="block px-4 py-2 text-sm hover:bg-(--color-brand-tint) hover:text-(--color-brand-dark)"
                      >
                        {child.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
