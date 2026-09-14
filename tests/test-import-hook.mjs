export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('/js/')) {
    const bare = specifier.replace(/\?v=[^/?#]+$/, '')
    return {
      shortCircuit: true,
      url: new URL(`..${bare}`, import.meta.url).href,
    }
  }
  return nextResolve(specifier, context)
}
