import { defineConfig } from 'tsdown';

function fixDtsPlugins(plugins: any) {
  if (!plugins) return;
  for (const p of Array.isArray(plugins) ? plugins : [plugins]) {
    if (Array.isArray(p)) {
      fixDtsPlugins(p);
    } else if (p && typeof p === 'object' && p.name === 'rolldown-plugin-dts:generate') {
      const origTransform = p.transform?.handler;
      if (origTransform && !p._patched) {
        p._patched = true;
        p.transform.handler = function (code: string, id: string) {
          if (id.startsWith('\0') || id.includes('rolldown:')) {
            return;
          }
          return origTransform.call(this, code, id);
        };
      }
    }
  }
}

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    tsgo: true,
  },
  sourcemap: true,
  clean: true,
  hash: false,
  inputOptions(options) {
    fixDtsPlugins(options.plugins);
    return options;
  },
});
