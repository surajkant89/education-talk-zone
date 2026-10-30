import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const rulesPath = fileURLToPath(new URL("./firestore.rules", import.meta.url));
const rules = readFileSync(rulesPath, "utf8");
const adminFunction = rules.match(/function isAdmin\(\)\s*\{([\s\S]*?)\n\s*\}/)?.[1];
const adminUid = adminFunction?.match(/request\.auth\.uid\s*==\s*'([^']+)'/)?.[1];

if (!adminUid || adminUid === "REPLACE_WITH_ADMIN_AUTH_UID" || !/^[A-Za-z0-9_-]{1,128}$/.test(adminUid)) {
  throw new Error("firestore.rules must contain a valid fixed admin UID in isAdmin().");
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __ETZ_ADMIN_UID__: JSON.stringify(adminUid),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/@firebase/firestore/")) return "firebase-firestore";
        },
      },
    },
  },
});
