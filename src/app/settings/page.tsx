import { redirect } from "next/navigation";

// Settings is now the "You" tab on the home shell.
export default function SettingsRedirect() {
  redirect("/");
}
