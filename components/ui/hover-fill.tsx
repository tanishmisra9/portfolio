/**
 * Hover/focus "fill up" for text links: the parent link must carry `group relative overflow-hidden`
 * (HOVER_FILL_LINK). On hover a solid rectangle in the foreground colour rises from the bottom edge and the
 * text flips to the background colour. Reduced motion: the fill still appears, without the slide.
 */
export const HOVER_FILL_LINK =
  "group relative overflow-hidden rounded-none ring-1 ring-inset ring-transparent hover:ring-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg";

export function HoverFill({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span
        aria-hidden
        className="absolute inset-0 origin-bottom scale-y-0 bg-fg transition-transform duration-200 ease-out group-hover:scale-y-100 group-focus-visible:scale-y-100 motion-reduce:transition-none"
      />
      <span className="relative z-10 transition-colors duration-200 group-hover:text-bg group-focus-visible:text-bg">
        {children}
      </span>
    </>
  );
}
