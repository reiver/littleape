// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
	const acceptHeader = request.headers.get('accept') || '';

	if (acceptHeader && acceptHeader.includes('application/activity+json')) {
		const url = request.nextUrl.clone();

		// Construct the new URL on a different domain
		const redirectUrl = `https://${process.env.NEXT_PUBLIC_LOGJAM_HOST}${url.pathname}${url.search}`;

		const redirectResponse = NextResponse.redirect(redirectUrl, 307);
		redirectResponse.headers.set('Vary', 'Accept');
		return redirectResponse;
	}

	const response = NextResponse.next();

	// Always set the Vary header
	response.headers.set('Vary', 'Accept');

	return response;
}
