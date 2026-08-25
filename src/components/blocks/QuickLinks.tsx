import type { BlockProps } from "../../types";
import { externalProps } from "../../links";

export type QuickLinksProps = {
  heading?: string;
  items: { icon?: string; label: string; description?: string; href: string }[];
};

export function QuickLinks({ heading, items }: BlockProps<QuickLinksProps>) {
  return (
    <section className="page py-14">
      {heading && <h2 className="mb-6 text-2xl font-semibold">{heading}</h2>}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items?.map((item, i) => (
          <li key={i}>
            <a href={item.href} className="block h-full rounded-(--radius-soft) bg-(--color-surface-alt) p-5 transition hover:brightness-95" {...externalProps(item.href)}>
              {item.icon && <span className="text-2xl" aria-hidden>{item.icon}</span>}
              <span className="mt-2 block font-semibold">{item.label}</span>
              {item.description && <span className="mt-1 block text-sm text-(--color-muted)">{item.description}</span>}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
