import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  newCsrfToken,
  signSession,
} from "@/lib/auth";

export const revalidate = false;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "");

    if (!username || !password) {
      return NextResponse.json(
        { error: "Please enter your username and password." },
        { status: 400 }
      );
    }

    const user = await prisma.adminUser.findUnique({ where: { username } });
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "Incorrect username or password." },
        { status: 401 }
      );
    }

    const session = await signSession({ id: user.id, username: user.username });
    const csrf = newCsrfToken();

    const res = NextResponse.json({ ok: true, username: user.username });

    res.cookies.set(SESSION_COOKIE, session, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    res.cookies.set(CSRF_COOKIE, csrf, {
      httpOnly: false,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: "We couldn't sign you in right now. Please try again." },
      { status: 500 }
    );
  }
}
