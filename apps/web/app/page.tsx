import { SkyblockCalculatorClient } from "@/components/skyblock-calculator-client";
import { generateMetadata as generateDynamicMetadata } from "@/lib/metadata";
import { Metadata } from "next";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  return generateDynamicMetadata({
    shared: Array.isArray(params.shared) ? params.shared[0] : params.shared,
  });
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <div>
      <SkyblockCalculatorClient />
    </div>
  );
}
