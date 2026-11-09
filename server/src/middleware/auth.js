import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { User } from "../modules/users/user.model.js";
import { forbidden, unauthorized } from "../utils/httpError.js";

export function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

/** Requires a valid Bearer token; sets req.user (a Mongoose document). */
export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw unauthorized("Your session has expired. Please sign in again.");
  }

  const user = await User.findById(payload.sub);
  if (!user) throw unauthorized();
  req.user = user;
  next();
}

/** Use after requireAuth: requireRole("official", "ngo") */
export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user?.role)) throw forbidden();
    next();
  };
