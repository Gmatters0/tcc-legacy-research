import { NextResponse } from "next/server";
import { encerrarSessaoAdmin } from "@/lib/admin/session";

export async function POST() {
  await encerrarSessaoAdmin();
  return NextResponse.json({ ok: true });
}
