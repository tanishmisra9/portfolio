/** Admin-browser only: measures a clip's RMS so publish() can ship a playback gain. Visitors never run this. */

function computeRms(buffer: AudioBuffer): number {
  let sumSquares = 0;
  let count = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) sumSquares += data[i] * data[i];
    count += data.length;
  }
  return count === 0 ? 0 : Math.sqrt(sumSquares / count);
}

/** RMS of a File or URL, or null if it can't be fetched/decoded (the clip then plays at gain 1). */
export async function measureRms(source: File | string): Promise<number | null> {
  let context: AudioContext | null = null;
  try {
    const bytes = typeof source === "string" ? await (await fetch(source)).arrayBuffer() : await source.arrayBuffer();
    context = new AudioContext();
    return computeRms(await context.decodeAudioData(bytes));
  } catch {
    return null;
  } finally {
    // Awaited: browsers cap live AudioContexts (~4-6), and the backfill measures clips back to back.
    await context?.close().catch(() => {});
  }
}
