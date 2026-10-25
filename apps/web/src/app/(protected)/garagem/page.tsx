import { PageLoading } from "@/components/ui/PageLoading";
import { Suspense } from "react";
import { GaragePageContent } from "@/features/garage/GaragePageContent";

export default function GaragemPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <GaragePageContent />
    </Suspense>
  );
}
