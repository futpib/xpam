import { NextRequest } from "next/server";

const {
	API_URL,
} = process.env;

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const query = searchParams.get('q')?.trim() || '';
	const skip = searchParams.get('skip') || '0';

	return fetch(`${API_URL}/api/v1/search?q=${encodeURIComponent(query)}&skip=${skip}`, {
		headers: {
			'accept': 'application/json',
		},
	});
}
