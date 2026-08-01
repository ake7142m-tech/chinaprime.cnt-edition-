interface BreadcrumbProps {
  items: { label: string; href?: string }[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="เส้นทาง" className="font-thai text-sm text-neutral-400 mb-4">
      <ol className="flex items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span>/</span>}
            {item.href ? (
              <a href={item.href} className="hover:text-primary transition-colors duration-150">{item.label}</a>
            ) : (
              <span className="text-neutral-700">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
