import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { navLinkClass, pageNarrowClass } from '@/lib/ui'

const proseClass =
	'space-y-4 rounded-xl border border-line bg-white p-6 text-[0.9375rem] leading-7 text-slate-700 shadow-card sm:p-9'

export const metadata: Metadata = {
	title: 'Privacy notice',
}

const PrivacyPage = () => {
	return (
		<main className={pageNarrowClass}>
			<PageHeader
				title="Privacy notice"
				description="What this portal records about you, who can see it, and why."
			/>
			<article className={proseClass}>
				<p>
					Gideon&apos;s Army Men&apos;s Fellowship at RCCG Living Water Parish,
					Stoke-on-Trent, uses this application to manage membership, monthly
					dues, events, and fellowship reminders.
				</p>
				<p>
					We collect only the information needed to operate the fellowship:
					name, contact details, department, occupation, address, birthday
					(day and month only, not the year), wedding anniversaries where
					provided, dues records, and payment confirmation details. Birth year
					is not stored, so age is not recorded.
				</p>
				<p>
					Member data is not public. Members can see their own information.
					Administrators can see information required to administer the
					fellowship. Payment evidence is stored privately and is available only
					to the submitting member and authorised administrators. Names of
					brothers celebrating a birthday or wedding anniversary this month are
					shown only to signed-in approved members. An optional birthday portrait
				and a separate optional couple photo may be shown beside the relevant
				celebration. These photos are stored privately, compressed before storage,
				and are not included in emails.
				</p>
				<p>
					The application uses service providers for hosting, authentication,
					database and private file storage, and email delivery. Access is limited
					by account permissions. For information about your rights, retention,
					and how to make a request, see the{' '}
					<Link href="/gdpr" className={navLinkClass}>
						GDPR and data rights page
					</Link>
					.
				</p>
			</article>
		</main>
	)
}

export default PrivacyPage
