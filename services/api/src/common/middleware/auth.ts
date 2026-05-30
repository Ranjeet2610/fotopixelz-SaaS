import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@repo/auth/roles";
import { env } from "../../config/env";

type JwtPayload = {
  sub: string;
  email?: string;
  role?: Role;
};

function parseRole(value: string | undefined): Role | undefined {
  if (!value) return undefined;
  const upper = value.toUpperCase();
  if (
    upper === "CLIENT" ||
    upper === "EDITOR" ||
    upper === "QA" ||
    upper === "ADMIN" ||
    upper === "SUPER_ADMIN"
  ) {
    return upper;
  }
  return undefined;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!process.env.JWT_ACCESS_SECRET) {
    return res.status(500).json({
      success: false,
      message: "JWT_ACCESS_SECRET is missing",
    });
  }
  try {
    if (!process.env.JWT_ACCESS_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_ACCESS_SECRET is missing",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET) as JwtPayload

    const userId = decoded.sub;
    const role = parseRole(decoded.role);

    if (!userId || !role) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    req.userId = userId;
    req.role = role;

    next();
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
}
