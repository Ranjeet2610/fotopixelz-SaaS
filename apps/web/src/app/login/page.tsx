import { Suspense } from "react";
import { LoginPage } from "@/components/auth-pages";
import { LoadingBlock } from "@/components/loading-block";

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading sign in..." />}>
      <LoginPage />
    </Suspense>
  );
}
