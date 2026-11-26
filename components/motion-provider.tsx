"use client";

import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Site-wide Framer setup. Public components import the slim `m` component (as `import { m as motion }`), which carries no
 * features of its own; LazyMotion supplies domAnimation (animations, variants, exit, hover/tap/focus and in-view).
 * The full `motion` component bundled drag and layout projection into every page, which no public page uses. Admin still
 * imports full `motion` for its drag-to-reorder lists, so those features load only in admin chunks. A new public
 * component should import `m as motion` too; importing plain `motion` pulls the full bundle back into that page.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>{children}</LazyMotion>
    </MotionConfig>
  );
}
