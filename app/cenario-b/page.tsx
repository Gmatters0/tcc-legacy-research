import { Suspense } from "react";
import { CenarioBApp } from "./CenarioBApp";

export default function CenarioBPage() {
  return (
    <Suspense>
      <CenarioBApp />
    </Suspense>
  );
}
