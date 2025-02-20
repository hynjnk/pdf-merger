import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
    // https://github.com/solidjs/solid-start/discussions/1398#discussioncomment-8833738
    ssr: false,
    server: {
        static: true
    }
});
