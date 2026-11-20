"use client";

import { useNotice } from "@/store";
import { createPortal } from "react-dom";

export default function SaveNotice() {
  const notice = useNotice();
  if (!notice) return null;

  const message = (
    <p
      key={notice.id}
      role="alert"
      className="fixed inset-x-4 bottom-4 z-10 mx-auto w-fit rounded-md bg-black px-4 py-3 text-center text-button text-white shadow-menu md:bottom-8 dark:bg-white dark:text-black"
    >
      {notice.message}
    </p>
  );
  return notice.host ? createPortal(message, notice.host) : message;
}
