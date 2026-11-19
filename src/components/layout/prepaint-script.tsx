import { PREPAINT_SCRIPT, PREPAINT_SCRIPT_ID } from "@/lib";

export default function PrepaintScript() {
  return (
    <>
      <link rel="expect" href={`#${PREPAINT_SCRIPT_ID}`} blocking="render" />
      <script
        id={PREPAINT_SCRIPT_ID}
        dangerouslySetInnerHTML={{ __html: PREPAINT_SCRIPT }}
      />
    </>
  );
}
