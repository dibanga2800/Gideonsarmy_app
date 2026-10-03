import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentSession } from '@/server/services/auth-service'
import { getMemberForAdmin } from '@/server/services/member-service'
import { getMemberDuesForAdmin } from '@/server/services/dues-service'
import { saveMemberRecordAction } from '@/server/actions/member-actions'
import {
	changeMemberPasswordAction,
	deleteMemberAccountAction,
} from '@/server/actions/member-actions'
import { recordPaymentAction, waiveDuesAction } from '@/server/actions/payment-actions'
import { AlertNotice } from '@/components/alert-notice'
import { ConfirmDeleteForm } from '@/components/confirm-delete-form'
import { MemberDirectoryFields } from '@/components/member-directory-fields'
import { RecordPaymentForm } from '@/components/record-payment-form'
import { canAdminAllocateDues, canAdminWaiveDues } from '@/lib/dues/transitions'
import { memberIdSchema } from '@/lib/validation/member'
import { formatDueMonth, getCurrentDueMonth } from '@/lib/dates/due-month'
import { duesStartMonthFromJoinedAt, isFullYearDuesStart, joinedAtToMonthInput } from '@/lib/dates/dues-year'
import { duesStatusLabel } from '@/lib/dues/display'
import { formatPenceAsGbp } from '@/lib/money'
import {
	formatDuesStartLabel,
	membershipStatusLabel,
	roleLabel,
} from '@/lib/members/display'
import {
	cardComfortClass,
	ddClass,
	dtClass,
	eyebrowClass,
	formGridClass,
	helpTextClass,
	inputClass,
	labelClass,
	navLinkClass,
	pageContentClass,
	pageLeadWideClass,
	pageTitleClass,
	primaryButtonClass,
	sectionHeadingClass,
} from '@/lib/ui'

interface MemberDetailPageProps {
	params: { id: string }
	searchParams: {
		updated?: string
		error?: string
		created?: string
		email?: string
		password?: string
	}
}

export const generateMetadata = async ({
	params,
}: {
	params: { id: string }
}): Promise<Metadata> => {
	const parsedId = memberIdSchema.safeParse(params.id)
	if (!parsedId.success) {
		return { title: 'Member' }
	}

	const member = await getMemberForAdmin(parsedId.data)
	if (!member) {
		return { title: 'Member' }
	}

	return { title: `${member.first_name} ${member.last_name}` }
}

const MemberDetailPage = async ({ params, searchParams }: MemberDetailPageProps) => {
	const parsedId = memberIdSchema.safeParse(params.id)
	if (!parsedId.success) {
		notFound()
	}

	const session = await getCurrentSession()
	const member = await getMemberForAdmin(parsedId.data)

	if (!member) {
		redirect('/admin/members')
	}

	const isSelf = session.userId === member.id
	const dues = await getMemberDuesForAdmin(member.id)
	const fullYearDues = isFullYearDuesStart(member.joined_at)

	return (
		<main className={pageContentClass}>
			<p className="mb-6">
				<Link href="/admin/members" className={navLinkClass}>
					Back to members
				</Link>
			</p>
			<p className={eyebrowClass}>Member record</p>
			<h1 className={`${pageTitleClass} mt-3`}>
				{member.first_name} {member.last_name}
			</h1>
			<p className={pageLeadWideClass}>
				Review directory details, approve membership, and set dues start. Everyone
				owes a full year from January (£120) unless you set a later payment start.
			</p>

			{searchParams.updated === '1' ? (
				<div className="mt-6">
					<AlertNotice kind="success" title="Saved">
						This member record has been saved.
					</AlertNotice>
				</div>
			) : null}

			{searchParams.created === '1' ? (
				<div className="mt-6">
					<AlertNotice kind="success" title="Member account created">
						{searchParams.email === '0'
							? 'The account was created. Share the temporary password privately. The welcome email could not be sent.'
							: 'The account was created and a welcome email was sent. Share the temporary password privately as well.'}
					</AlertNotice>
				</div>
			) : null}

			{searchParams.password === '1' ? (
				<div className="mt-6">
					<AlertNotice kind="success" title="Password changed">
						The member must use the new password the next time they sign in.
					</AlertNotice>
				</div>
			) : null}

			{searchParams.error ? (
				<div className="mt-6">
					<AlertNotice kind="danger" title="Could not save">
						{searchParams.error.startsWith('password')
							? 'The password could not be changed. Use at least 10 characters and do not change your own password here.'
							: searchParams.error.startsWith('delete')
								? searchParams.error === 'delete-dues_history'
									? 'This account is inactive, but its dues ledger must be retained. Keep it inactive instead of deleting it.'
									: searchParams.error === 'delete-payment_history'
										? 'This account is inactive, but it has payment history that must be retained. Keep it inactive instead of deleting it.'
										: 'The account could not be removed. Mark the member inactive first; accounts with financial history must be retained.'
								: 'That update could not be saved. Check the details and that you are allowed to change this member, then try again.'}
					</AlertNotice>
				</div>
			) : null}

			<form action={saveMemberRecordAction} className={`${cardComfortClass} mt-8 space-y-8`}>
				<input type="hidden" name="memberId" value={member.id} />
				<div>
					<p className={eyebrowClass}>Account</p>
					<dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
						<div>
							<dt className={dtClass}>Email</dt>
							<dd className={ddClass}>{member.email}</dd>
						</div>
						<div>
							<dt className={dtClass}>Current status</dt>
							<dd className={ddClass}>
								{membershipStatusLabel(member.membership_status)} ·{' '}
								{roleLabel(member.role)}
							</dd>
						</div>
						<div>
							<dt className={dtClass}>Dues start</dt>
							<dd className={ddClass}>{formatDuesStartLabel(member.joined_at)}</dd>
						</div>
					</dl>
				</div>

				<div>
					<p className={eyebrowClass}>Directory</p>
					<h2 className={`${sectionHeadingClass} mt-2`}>Personal details</h2>
					<div className="mt-5">
						<MemberDirectoryFields profile={member} />
					</div>
				</div>

				{isSelf ? (
					<div className="space-y-3 text-navy-800">
						<p>
							You cannot change your own role, membership status, or payment
							start. Another administrator must do that.
						</p>
					</div>
				) : (
					<div>
						<p className={eyebrowClass}>Access</p>
						<h2 className={`${sectionHeadingClass} mt-2`}>Membership and role</h2>
						<div className={`mt-5 ${formGridClass}`}>
							<div>
								<label htmlFor="membership_status" className={labelClass}>
									Membership status
								</label>
								<select
									id="membership_status"
									name="membership_status"
									defaultValue={member.membership_status}
									className={inputClass}
								>
									<option value="PENDING">Pending</option>
									<option value="ACTIVE">Active</option>
									<option value="INACTIVE">Inactive</option>
								</select>
							</div>
							<div>
								<label htmlFor="role" className={labelClass}>
									Role
								</label>
								<select
									id="role"
									name="role"
									defaultValue={member.role}
									className={inputClass}
								>
									<option value="MEMBER">Member</option>
									<option value="ADMIN">Administrator</option>
								</select>
							</div>
							<fieldset className="sm:col-span-2 xl:col-span-3 space-y-3">
								<legend className={labelClass}>Dues</legend>
								<p className={helpTextClass}>
									Leave full year selected for brothers who were already in the
									fellowship. Choose a later start only if he joined after January,
									so earlier months are not billed.
								</p>
								<label className="flex items-start gap-3 text-sm text-navy-900">
									<input
										type="radio"
										name="dues_start_mode"
										value="full_year"
										required
										defaultChecked={fullYearDues}
										className="mt-1 h-4 w-4 border-cream-200"
									/>
									<span>
										Full year from January 2026
										<span className="block font-normal text-navy-800/80">
											£120 for twelve months. Pay outstanding months together or
											month by month.
										</span>
									</span>
								</label>
								<label className="flex items-start gap-3 text-sm text-navy-900">
									<input
										type="radio"
										name="dues_start_mode"
										value="from_month"
										defaultChecked={!fullYearDues}
										className="mt-1 h-4 w-4 border-cream-200"
									/>
									<span>Starts later (new member)</span>
								</label>
								<div className="max-w-xs pl-7">
									<label htmlFor="joined_on" className={labelClass}>
										Payment start month
									</label>
									<input
										id="joined_on"
										name="joined_on"
										type="month"
										min="2026-01"
										max={getCurrentDueMonth().slice(0, 7)}
										defaultValue={
											fullYearDues
												? ''
												: joinedAtToMonthInput(member.joined_at) ||
													getCurrentDueMonth().slice(0, 7)
										}
										className={inputClass}
									/>
								</div>
							</fieldset>
						</div>
					</div>
				)}
				<button type="submit" className={primaryButtonClass}>
					Save member record
				</button>
			</form>

			{!isSelf ? (
				<section className={`${cardComfortClass} mt-10 space-y-6`}>
					<div>
						<p className={eyebrowClass}>Account access</p>
						<h2 className={`${sectionHeadingClass} mt-2`}>Change password</h2>
						<p className="mt-2 text-sm leading-6 text-navy-800/80">
							This signs the member out everywhere. Share the new password privately.
						</p>
					</div>
					<form action={changeMemberPasswordAction} className="grid gap-4 sm:grid-cols-2">
						<input type="hidden" name="memberId" value={member.id} />
						<div>
							<label htmlFor="member_password" className={labelClass}>New password</label>
							<input id="member_password" name="password" type="password" minLength={10} maxLength={72} required autoComplete="new-password" className={inputClass} />
						</div>
						<div>
							<label htmlFor="member_confirm_password" className={labelClass}>Confirm password</label>
							<input id="member_confirm_password" name="confirm_password" type="password" minLength={10} maxLength={72} required autoComplete="new-password" className={inputClass} />
						</div>
						<button type="submit" className={primaryButtonClass}>Change password</button>
					</form>
				</section>
			) : null}

			{!isSelf ? (
				<section className={`${cardComfortClass} mt-10 border-red-200`}>
					<p className={eyebrowClass}>Destructive action</p>
					<h2 className={`${sectionHeadingClass} mt-2`}>Remove account</h2>
					<p className="mt-2 text-sm leading-6 text-navy-800/80">
						Permanent deletion is allowed only for inactive members with no dues or payment history. Mark members inactive to preserve financial records.
					</p>
					<ConfirmDeleteForm
						action={deleteMemberAccountAction}
						idName="memberId"
						idValue={member.id}
						triggerLabel="Permanently remove account"
						title="Permanently remove this account?"
						body="This cannot be undone. Members with dues or payment history must be marked inactive instead."
						confirmLabel="remove account"
					/>
				</section>
			) : null}

			{member.membership_status === 'ACTIVE' && dues ? (
				<section className={`${cardComfortClass} mt-10`}>
					<p className={eyebrowClass}>Record a payment</p>
					<p className="mt-3 text-sm leading-6 text-navy-800/80">
						Allocate a received transfer to outstanding months. Use Select all
						to record a full-year (or remaining-year) payment in one go.
					</p>
					<RecordPaymentForm
						action={recordPaymentAction}
						members={[member]}
						outstandingDues={dues.filter(
							(row) =>
								canAdminAllocateDues(row.status) &&
								row.due_month >= duesStartMonthFromJoinedAt(member.joined_at),
						)}
						initialMemberId={member.id}
					/>
				</section>
			) : null}

			<section className="mt-10">
				<h2 className={sectionHeadingClass}>Dues</h2>
				{!dues || dues.length === 0 ? (
					<p className={`${cardComfortClass} mt-4 text-navy-800`}>
						No dues records yet. Visiting Payments creates the current month for
						active members.
					</p>
				) : (
					<ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
						{dues.map((row) => (
							<li key={row.id} className={`${cardComfortClass} p-5`}>
								<p className="font-medium text-navy-950">
									{formatDueMonth(row.due_month)}
								</p>
								<p className="mt-1 text-sm text-navy-800">
									{formatPenceAsGbp(row.amount_due_pence)} due ·{' '}
									{formatPenceAsGbp(row.amount_paid_pence)} paid ·{' '}
									{duesStatusLabel(row.status)}
								</p>
								{canAdminWaiveDues(row.status) ? (
									<form action={waiveDuesAction} className="mt-3">
										<input type="hidden" name="duesId" value={row.id} />
										<input type="hidden" name="memberId" value={member.id} />
										<button type="submit" className={primaryButtonClass}>
											Waive this month
										</button>
									</form>
								) : null}
							</li>
						))}
					</ul>
				)}
			</section>
		</main>
	)
}

export default MemberDetailPage
