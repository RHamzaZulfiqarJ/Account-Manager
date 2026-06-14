import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pgPool: Pool | undefined;
};

const getPoolSize = () => {
    const value = Number(process.env.DATABASE_POOL_SIZE);

    if (Number.isFinite(value) && value > 0) {
        return value;
    }

    return process.env.NODE_ENV === "production" ? 1 : 5;
};

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}

const pool =
    globalForPrisma.pgPool ??
    new Pool({
        connectionString: process.env.DATABASE_URL,
        max: getPoolSize(),
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 10000,
        allowExitOnIdle: true,
    });

const adapter = new PrismaPg(pool);

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
    });

globalForPrisma.pgPool = pool;
globalForPrisma.prisma = prisma;
