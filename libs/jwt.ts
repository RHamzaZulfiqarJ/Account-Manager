import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export type JWTPayload = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export function signToken(payload: JWTPayload) {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "3d",
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
