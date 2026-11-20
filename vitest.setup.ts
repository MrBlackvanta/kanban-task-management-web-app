import { installDialog } from "@/test/dialog";
import { installFetch } from "@/test/fetch";
import { installMatchMedia } from "@/test/media";
import { installPopover } from "@/test/popover";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vite-plus/test";

installPopover();
installDialog();

beforeEach(() => {
  installMatchMedia();
  installFetch();
});

afterEach(cleanup);
