export async function load(url, context, defaultLoad) {
  if (url.endsWith('.css') || url.endsWith('.scss') || url.endsWith('.sass')) {
    return {
      format: 'module',
      source: 'export default {};',
      shortCircuit: true
    };
  }
  return defaultLoad(url, context, defaultLoad);
}