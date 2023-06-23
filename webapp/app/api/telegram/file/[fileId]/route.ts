import { NextRequest, NextResponse } from "next/server";

const {
	API_URL,
} = process.env;

const cacheControlKeepForever = 'max-age=31536000, public, immutable';

export async function GET(_request: NextRequest, { params: { fileId } }: { params: { fileId?: string } }) {
	if (!fileId) {
		return new NextResponse(null, {
			status: 404,
			headers: {
				'cache-control': cacheControlKeepForever,
			},
		});
	}

	const apiResponse = await fetch(`${API_URL}/api/v1/file?id=${encodeURIComponent(fileId)}`, {
		headers: {
			'accept': 'application/json',
		},
	});

	if (!apiResponse.ok) {
		return apiResponse;
	}

	return new NextResponse(apiResponse.body, {
		status: apiResponse.status,
		headers: {
			'content-type': apiResponse.headers.get('content-type') ?? 'application/octet-stream',
			'cache-control': cacheControlKeepForever,
		},
	});
}
