import { NextResponse } from "next/server";
import { checkRateLimit } from "./ratelimit";
import { getSession } from "./auth";

type ApiHandler<TArgs extends unknown[] = unknown[]> = (
	req: Request,
	...args: TArgs
) => Promise<NextResponse>;

/**
 * Higher Order Function to wrap API handlers with Rate Limiting and standard security headers.
 */
export function withSecurity<TArgs extends unknown[]>(
	handler: ApiHandler<TArgs>,
	options?: { limit?: number; window?: number }
) {
	return async (req: Request, ...args: TArgs) => {
		try {
			// 1. Identify User (IP or Session ID)
			const session = await getSession({ request: req });
			const identifier =
				session?.userId || req.headers.get("x-forwarded-for") || "anonymous";

			// 2. Rate Limiting Check
			const rateLimit = await checkRateLimit(
				identifier as string,
				options?.limit || 60,
				options?.window || 60
			);

			const response = !rateLimit.success
				? NextResponse.json(
						{ error: "Too many requests. Please try again later." },
						{ status: 429 }
				  )
				: await handler(req, ...args);

			// 3. Add Standard Security Headers
			response.headers.set("X-RateLimit-Limit", rateLimit.limit.toString());
			response.headers.set(
				"X-RateLimit-Remaining",
				rateLimit.remaining.toString()
			);
			response.headers.set("X-RateLimit-Reset", rateLimit.reset.toString());
			response.headers.set("X-Content-Type-Options", "nosniff");
			response.headers.set("X-Frame-Options", "DENY");

			return response;
		} catch (error) {
			console.error("Security Wrapper Error:", error);
			return NextResponse.json(
				{ error: "Internal Server Error" },
				{ status: 500 }
			);
		}
	};
}
