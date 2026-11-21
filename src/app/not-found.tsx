import { ErrorPanel } from "@/components/layout";
import { SITE_NAME } from "@/data";
import type { Metadata } from "next";
import Link from "next/link";

const description =
  "There’s no board at this address. Every board you’ve made is still on the home page.";

export const metadata: Metadata = {
  title: `${SITE_NAME} | Page not found`,
  description,
  alternates: { canonical: null },
};

export default function NotFound() {
  return (
    <ErrorPanel title="Page not found" description={description}>
      <Link href="/" className="v-button-l">
        Back to boards
      </Link>
    </ErrorPanel>
  );
}
