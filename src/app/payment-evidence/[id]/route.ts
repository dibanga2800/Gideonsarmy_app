import { NextResponse } from 'next/server'
import { evidenceIdSchema } from '@/lib/validation/payment'
import { getPaymentEvidenceDownloadUrl } from '@/server/services/dues-service'

interface EvidenceRouteProps {
	params: { id: string }
}

export const GET = async (request: Request, { params }: EvidenceRouteProps) => {
	const parsed = evidenceIdSchema.safeParse(params.id)

	if (!parsed.success) {
		return NextResponse.redirect(new URL('/dues', request.url))
	}

	const signedUrl = await getPaymentEvidenceDownloadUrl(parsed.data)

	if (!signedUrl) {
		return new NextResponse('Not found', { status: 404 })
	}

	return NextResponse.redirect(signedUrl)
}
