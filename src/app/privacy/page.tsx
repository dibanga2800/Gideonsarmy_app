import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import {
	cardComfortClass,
	pageNarrowClass,
} from '@/lib/ui'

export const metadata: Metadata = {
	title: 'Privacy notice',
}

const PrivacyPage = () => {
	return (
		<main className={pageNarrowClass}>
			<PageHeader eyebrow="Fellowship records" title="Privacy notice" />
			<section className={`${cardComfortClass} mt-8 space-y-4 text-navy-800`}>
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
					shown only to signed-in members. An optional portrait may be shown
					beside those names. Portraits are private, compressed before storage,
					and are not included in emails.
				</p>
				<p>
					If you have a privacy question or want to update or remove your
					information, contact the fellowship administrators.
				</p>
			</section>
		</main>
	)
}

export default PrivacyPage
