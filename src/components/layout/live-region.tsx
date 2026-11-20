"use client";

import { useAnnouncement } from "@/store";

export default function LiveRegion() {
  const announcement = useAnnouncement();

  return (
    <p aria-live="assertive" aria-atomic="true" className="sr-only">
      {announcement}
    </p>
  );
}
