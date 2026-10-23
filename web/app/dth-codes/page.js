// Server wrapper: renders the static sports channel directory.
import { DthCodesClient } from "@/components/DthCodesClient";

export const revalidate = 86400; // directory changes rarely
export const metadata = { title: "DTH Channel Numbers — CricCast" };

export default async function DthCodesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-5 md:max-w-4xl lg:max-w-6xl">
      <h1 className="text-xl font-extrabold tracking-tight text-navy dark:text-white">DTH Codes</h1>
      <DthCodesClient />
    </div>
  );
}
