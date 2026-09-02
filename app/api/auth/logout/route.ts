import { NextResponse } from "next/server";
import { encerrarSessaoLogin } from "@/lib/auth/session";

export async function POST() {
  await encerrarSessaoLogin();
  return NextResponse.json({ ok: true });
}
