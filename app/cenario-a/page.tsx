import { Suspense } from "react";
import { CenarioAApp } from "./CenarioAApp";

export default function CenarioAPage() {
  return (
    <Suspense>
      <CenarioAApp />
    </Suspense>
  );
}
