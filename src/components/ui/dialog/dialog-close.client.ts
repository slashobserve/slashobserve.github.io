import { mount } from "@/lib/client/mount";

mount("[data-dialog-close]", (btn) => {
  const close = () => btn.closest("dialog")?.close();
  btn.addEventListener("click", close);
  return () => btn.removeEventListener("click", close);
});
