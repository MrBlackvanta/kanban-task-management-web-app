import { installDialog } from "@/test/dialog";
import { installFetch } from "@/test/fetch";
import { installMatchMedia } from "@/test/media";
import { installMotion } from "@/test/motion";
import { installPopover } from "@/test/popover";
import { installScrolling } from "@/test/scrolling";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vite-plus/test";

installPopover();
installDialog();
installScrolling();

beforeEach(() => {
  installMatchMedia();
  installFetch();
  installMotion();
});

afterEach(cleanup);
