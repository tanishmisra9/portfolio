import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAdmin } from "@/lib/auth/session";

/**
 * Photos and blog images upload directly from the browser to Blob, bypassing this
 * server — Vercel caps a server action / API route request body at 4.5MB regardless of
 * next.config.ts's serverActions.bodySizeLimit, which silently broke uploads of the
 * larger photos already in public/photos. This route only issues the client token and
 * records nothing itself.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async (pathname) => {
      await requireAdmin();
      if (!/^(photos|blog)\//.test(pathname)) {
        throw new Error("Uploads are only allowed under photos/ or blog/.");
      }
      return {
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"],
        addRandomSuffix: true,
      };
    },
    onUploadCompleted: async () => {
      // No-op: the browser registers the finished upload itself (uploadPhoto action /
      // markdown insert), so there's nothing to persist here.
    },
  });

  return NextResponse.json(jsonResponse);
}
