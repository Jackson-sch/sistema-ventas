import { getPurchaseOrdersAction } from "./src/actions/purchase-order-actions";
import { getProductsData, getSuppliersData } from "./src/actions/data-fetchers";

async function main() {
  console.log("Testing getPurchaseOrdersAction...");
  const t0 = Date.now();
  try {
    const ords = await getPurchaseOrdersAction();
    console.log("Orders loaded:", ords.length, `in ${Date.now() - t0}ms`);
  } catch (e) {
    console.error("Error in getPurchaseOrdersAction:", e);
  }

  try {
    const prods = await getProductsData();
    console.log("Prods loaded:", prods.length);
  } catch (e) {
    console.error("Error in getProductsData:", e);
  }

  try {
    const sups = await getSuppliersData();
    console.log("Sups loaded:", sups.length);
  } catch (e) {
    console.error("Error in getSuppliersData:", e);
  }
}

main().catch(console.error);
