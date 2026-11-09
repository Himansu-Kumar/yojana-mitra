import bcrypt from "bcryptjs";
import { User } from "../users/user.model.js";
import { signToken } from "../../middleware/auth.js";
import { HttpError, unauthorized } from "../../utils/httpError.js";

export async function register({ name, email, password }) {
  const exists = await User.exists({ email: email.toLowerCase() });
  if (exists) throw new HttpError(409, "An account with this email already exists");
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
  return { user: user.toPublic(), token: signToken(user) };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw unauthorized("Wrong email or password");
  }
  return { user: user.toPublic(), token: signToken(user) };
}
