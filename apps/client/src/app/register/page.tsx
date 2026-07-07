import { Suspense } from "react";
import { RegisterPage } from "@/components/auth-pages";
import { LoadingBlock } from "@/components/loading-block";

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading registration..." />}>
      <RegisterPage />
    </Suspense>
  );
}
