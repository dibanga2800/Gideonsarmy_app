import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { cardComfortClass, pageNarrowClass, sectionHeadingClass } from '@/lib/ui'

export const metadata: Metadata = {
	title: 'GDPR and data rights',
}

const GdprPage = () => {
	return (
		<main className={pageNarrowClass}>
			<PageHeader
				eyebrow="Data protection"
				title="GDPR and your data rights"
				lead="How personal information is used in the Gideon's Army fellowship application and how to make a data request."
			/>
			<article className={`${cardComfortClass} mt-8 space-y-8 text-navy-800`}>
				<section className="space-y-3">
					<h2 className={sectionHeadingClass}>Who is responsible</h2>
					<p>
						The application is operated for Gideon&apos;s Army Men&apos;s Fellowship at
						RCCG Living Water Parish, Stoke-on-Trent. The fellowship administration
						coordinates data requests. Contact an administrator through the usual
						fellowship or parish channels to obtain the parish&apos;s formal controller
						name and contact details.
					</p>
				</section>

				<section className="space-y-3">
					<h2 className={sectionHeadingClass}>What we use and why</h2>
					<p>
						We use account and profile details to identify members, manage invitations
						and membership approval, and provide fellowship services. We use event,
						announcement, and celebration details to coordinate fellowship activity.
						Dues and payment records support financial administration and
						accountability. Optional birthday portraits and couple photos are used
						only in the corresponding celebration listings.
					</p>
					<p>
						Processing is limited to what is needed to administer membership and
						the fellowship, meet applicable legal obligations, or pursue the
						fellowship&apos;s legitimate interests. Optional photos can be removed from
					your profile. The parish should confirm and document the lawful basis for
					each processing purpose.
					</p>
				</section>

				<section className="space-y-3">
					<h2 className={sectionHeadingClass}>Information and access</h2>
					<p>
						Information may include your name, email address, contact and directory
						details you provide, birthday day and month, wedding anniversary and
						spouse name, optional photos, membership details, and dues or payment
						records. Birth year is not collected. Member information is not public;
						access is limited by account role. Celebration names and relevant photos
						are available to signed-in approved members. Payment evidence is private
						and limited to the submitting member and authorised administrators.
					</p>
				</section>

				<section className="space-y-3">
					<h2 className={sectionHeadingClass}>Service providers and retention</h2>
					<p>
						The application relies on service providers for hosting, authentication,
						database and private file storage, and email delivery. These providers
						process information only as needed to provide their services. The parish
						should make available the current provider list and any applicable
						international transfer safeguards on request.
					</p>
					<p>
						Information is kept while needed to administer membership and the
						fellowship. Financial or audit records may need to be retained where
						required for accountability or by law. The parish should set and publish
						a retention schedule, then delete or anonymise information when it is no
						longer needed.
					</p>
				</section>

				<section className="space-y-3">
					<h2 className={sectionHeadingClass}>Your rights</h2>
					<p>Depending on the circumstances, you may have the right to:</p>
					<ul className="list-disc space-y-2 pl-5">
						<li>Request access to your personal information.</li>
						<li>Ask for inaccurate or incomplete information to be corrected.</li>
						<li>Request erasure or restriction of processing.</li>
						<li>Object to processing based on legitimate interests.</li>
						<li>Request a portable copy where the right applies.</li>
						<li>Withdraw consent where processing relies on consent.</li>
					</ul>
					<p>
						These rights are subject to legal conditions and exemptions. To make a
						request, contact a fellowship administrator through the usual parish or
						fellowship channels. The administrator may need to verify your identity
						before responding.
					</p>
				</section>

				<section className="space-y-3">
					<h2 className={sectionHeadingClass}>Complaints</h2>
					<p>
						You can raise a concern with the fellowship or parish administration.
						You also have the right to complain to the UK Information Commissioner&apos;s
						Office (ICO) at{' '}
						<a
							href="https://ico.org.uk/make-a-complaint/data-protection-complaints/"
							target="_blank"
							rel="noreferrer"
							className="font-semibold underline"
						>
							ico.org.uk
						</a>
						.
					</p>
				</section>
			</article>
		</main>
	)
}

export default GdprPage