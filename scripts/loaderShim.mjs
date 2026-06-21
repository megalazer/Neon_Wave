// Node ESM resolve hook: retries extensionless relative specifiers with `.js`.
// generateRecruit's dependency graph uses extensionless imports (e.g.
// recruitGenerator.js -> '../data/recruitQuality'), which Node ESM cannot resolve.
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (err && err.code === 'ERR_MODULE_NOT_FOUND'
        && /^\.\.?\//.test(specifier)
        && !/\.(js|mjs|cjs|json)$/.test(specifier)) {
      return await nextResolve(specifier + '.js', context);
    }
    throw err;
  }
}
