/**
 * Lets Payload hooks flush the Next cache the moment an admin saves, instead of
 * waiting out a timer. Safe to call from the CLI (`npm run seed`), where there
 * is no Next request context and revalidatePath throws — we swallow that.
 */
export const revalidatePaths = async (paths: (string | null | undefined)[]) => {
  const unique = [...new Set(paths.filter((path): path is string => Boolean(path)))]
  if (unique.length === 0) return

  try {
    const { revalidatePath } = await import('next/cache')
    for (const path of unique) revalidatePath(path)
  } catch {
    /* running outside Next — nothing to revalidate */
  }
}
