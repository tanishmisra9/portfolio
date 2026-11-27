/**
 * Copy text to the clipboard; resolves true on success.
 *
 * `navigator.clipboard` only exists in a secure context (https or localhost). Over plain http, e.g. the LAN dev URL on
 * a phone, it's undefined and every copy failed. The fallback is the legacy path: select a hidden textarea and
 * `execCommand("copy")`, which still works there, iOS Safari included (it needs the selection range set, and
 * `readonly` so the keyboard doesn't open). Call it straight from the click handler: the legacy path needs the gesture.
 */
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission refused: try the legacy path below.
    }
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}
