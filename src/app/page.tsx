import { redirect } from "next/navigation";
import { SessionLib } from "@/lib/session.lib";

export default async function Home() {
  const session = await SessionLib.getSession();
  if (session) redirect("/products");
  redirect("/login");
}
