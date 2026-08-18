import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const appDir = path.join(projectRoot, "src", "app");
const sidebarFile = path.join(projectRoot, "src", "components", "app-sidebar.tsx");

function getPhysicalRoutes(dir, baseRoute = "") {
  let routes = [];
  if (!fs.existsSync(dir)) return routes;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (entry.name.startsWith("(") && entry.name.endsWith(")")) {
        // Route group, don't add to URL path
        routes = routes.concat(getPhysicalRoutes(path.join(dir, entry.name), baseRoute));
      } else if (!entry.name.startsWith("_") && !entry.name.startsWith(".")) {
        routes = routes.concat(getPhysicalRoutes(path.join(dir, entry.name), `${baseRoute}/${entry.name}`));
      }
    } else if (entry.name === "page.tsx" || entry.name === "page.js" || entry.name === "page.jsx") {
      routes.push(baseRoute || "/");
    }
  }

  return routes;
}

function getSidebarRoutes(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  const urlRegex = /url:\s*["']([^"']+)["']/g;
  const urls = [];
  let match;
  while ((match = urlRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }
  return [...new Set(urls)];
}

console.log("\n==========================================");
console.log(" 🔍 SIDEBAR ROUTES AUDIT TOOL");
console.log("==========================================\n");

const physicalRoutes = getPhysicalRoutes(appDir);
const sidebarRoutes = getSidebarRoutes(sidebarFile);

console.log("📁 Rutas Físicas Detectadas en Next.js (src/app):");
physicalRoutes.forEach((r) => console.log(`   ✓ ${r}`));

console.log("\n🧭 Rutas Registradas en Sidebar (src/components/app-sidebar.tsx):");
sidebarRoutes.forEach((r) => console.log(`   → ${r}`));

console.log("\n------------------------------------------");
console.log("📊 ANÁLISIS DE COHERENCIA");
console.log("------------------------------------------");

// Orphaned routes (in app but not in sidebar)
const ignoredRoutes = ["/", "/login", "/_not-found"];
const orphaned = physicalRoutes.filter((r) => !sidebarRoutes.includes(r) && !ignoredRoutes.includes(r));
if (orphaned.length > 0) {
  console.log("\n⚠️  Páginas Huérfanas (Existen en código pero NO están en el Sidebar):");
  orphaned.forEach((r) => console.log(`   - ${r}`));
} else {
  console.log("\n✅ No hay páginas huérfanas.");
}

// Ghost routes (in sidebar but don't exist in app)
const ghost = sidebarRoutes.filter((r) => !physicalRoutes.includes(r));
if (ghost.length > 0) {
  console.log("\n❌ Rutas Fantasma (Están en el Sidebar pero NO existen en src/app):");
  ghost.forEach((r) => console.log(`   - ${r}`));
} else {
  console.log("✅ No hay rutas fantasma.");
}

console.log("\n==========================================\n");
