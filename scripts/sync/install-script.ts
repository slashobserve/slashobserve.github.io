export const INSTALL_SCRIPT_URL = "https://raw.githubusercontent.com/slashobserve/slashobserve/main/install.sh"

export function isInstallScript(text: string | null): text is string {
  return text !== null && text.startsWith("#!/bin/sh")
}
