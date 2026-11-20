"use client";

import { startSync } from "@/store";
import { useEffect } from "react";

export default function BoardSync() {
  useEffect(startSync, []);
  return null;
}
