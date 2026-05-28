import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
plugins: [react()],

server: {
host: true,
port: 5173,
},

build: {
sourcemap: false,
minify: 'esbuild',
target: 'es2020',

```
rollupOptions: {
  output: {
    manualChunks(id) {
      if (id.includes('node_modules')) {
        return 'vendor'
      }
    },
  },
},
```

},
})
