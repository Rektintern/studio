import { redirect } from "next/navigation";

// The add flow is now an in-app bottom sheet on the home shell.
export default function AddRedirect() {
  redirect("/");
}
