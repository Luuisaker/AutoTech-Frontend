import { createFileRoute } from "@tanstack/react-router";
import { PurchaseDetailPage } from "../../../components/purchases/PurchaseDetailPage";

export const Route = createFileRoute(
  "/_authenticated/dashboard/my-workshops/$workshopId/sales/purchases/$purchaseId",
)({
  component: PurchaseDetailPage,
});
