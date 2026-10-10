import type { Metadata } from 'next'
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
import { AlertNotice, NoticeStack } from '@/components/alert-notice'
import { ConfirmDeleteForm } from '@/components/confirm-delete-form'
import { EmptyState } from '@/components/empty-state'
import { Icon } from '@/components/icons'
import { MemberDirectoryFields } from '@/components/member-directory-fields'
import { PageHeader } from '@/components/page-header'
import { PendingSubmitButton } from '@/components/pending-submit-button'
import { RecordPaymentForm } from '@/components/record-payment-form'
import { SectionCard } from '@/components/section-card'
import { DuesStatusBadge, MembershipBadge, RoleBadge } from '@/components/status-badge'
import { canAdminAllocateDues, canAdminWaiveDues } from '@/lib/dues/transitions'
import { memberIdSchema } from '@/lib/validation/member'
import { formatDueMonth, getCurrentDueMonth } from '@/lib/dates/due-month'
import { duesStartMonthFromJoinedAt, isFullYearDuesStart, joinedAtToMonthInput } from '@/lib/dates/dues-year'
import { formatPenceAsGbp } from '@/lib/money'
import { formatDuesStartLabel, memberDisplayName } from '@/lib/members/display'
import {
	formGridClass,
	ghostButtonClass,
	helpTextClass,
	inputClass,
	labelClass,
	pageContentClass,
	primaryButtonClass,
	secondaryButtonClass,
	smallButtonClass,
	tableClass,
	tdClass,
	thClass,
	theadClass,
	trClass,
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

	const memberName = memberDisplayName(member) || member.email
	const allocatable = dues
		? dues.filter(
				(row) =>
					canAdminAllocateDues(row.status) &&
					row.due_month >= duesStartMonthFromJoinedAt(member.joined_at),
			)
		: []
	const sortedDues = dues ? [...dues].sort((left, right) => right.due_month.localeCompare(left.due_month)) : []

	return (
		<main className={pageContentClass}>
			<PageHeader
				back={{ href: '/admin/members', label: 'Members' }}
				title={memberName}
				meta={
					<>
						<MembershipBadge status={member.membership_status} />
						<RoleBadge role={member.role} />
					</>
				}
				description={
					<>
						{member.email}
						<span className="mx-2 text-slate-300" aria-hidden="true">|</span>
						Dues: {formatDuesStartLabel(member.joined_at)}
					</>
				}
			/>

			<NoticeStack>
				{searchParams.updated === '1' ? (
					<AlertNotice kind="success" title="Member record saved">
						Changes to this record have been saved.
					</AlertNotice>
				) : null}
				{searchParams.created === '1' ? (
					<AlertNotice kind={searchParams.email === '0' ? 'danger' : 'success'} title="Account created">
						{searchParams.email === '0'
							? "The account exists, but the welcome email didn't send. Share the temporary password with him privately."
							: 'A welcome email has been sent. Share the temporary password with him privately as well.'}
					</AlertNotice>
				) : null}
				{searchParams.password === '1' ? (
					<AlertNotice kind="success" title="Password changed">
						He has been signed out everywhere and must use the new password next time.
					</AlertNotice>
				) : null}
				{searchParams.error ? (
					<AlertNotice kind="danger" title="Change not saved">
						{searchParams.error.startsWith('password')
							? 'Use at least 10 characters, make sure both entries match, and note you cannot change your own password here.'
							: searchParams.error.startsWith('delete')
								? searchParams.error === 'delete-dues_history'
									? 'This account has a dues ledger that must be kept. Leave it inactive instead of removing it.'
									: searchParams.error === 'delete-payment_history'
										? 'This account has payment history that must be kept. Leave it inactive instead of removing it.'
										: 'Mark the member inactive first. Accounts with any financial history are kept.'
								: 'Check the details and that you are allowed to change this member, then try again.'}
					</AlertNotice>
				) : null}
			</NoticeStack>

			<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
				<div className="space-y-5">
					<form action={saveMemberRecordAction}>
						<input type="hidden" name="memberId" value={member.id} />
						<SectionCard title="Member record">
							<div className="space-y-8">
								<fieldset>
									<legend className="text-sm font-semibold text-navy-950">Personal details</legend>
									<div className="mt-4">
										<MemberDirectoryFields profile={member} />
									</div>
								</fieldset>

								{isSelf ? (
									<p className="flex items-start gap-2 rounded-lg bg-cream-50 px-3.5 py-3 text-sm text-slate-600 ring-1 ring-inset ring-line">
										<Icon name="info" className="mt-0.5 h-4 w-4 text-slate-500" />
										This is your own record. Another administrator has to change your role, membership
										status or dues start.
									</p>
								) : (
									<fieldset className="border-t border-line pt-6">
										<legend className="sr-only">Membership and role</legend>
										<h3 className="text-sm font-semibold text-navy-950">Membership and role</h3>
										<div className={`mt-4 ${formGridClass}`}>
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
												<select id="role" name="role" defaultValue={member.role} className={inputClass}>
													<option value="MEMBER">Member</option>
													<option value="ADMIN">Administrator</option>
												</select>
											</div>
										</div>
										<fieldset className="mt-6 space-y-3">
											<legend className={labelClass}>When dues start</legend>
											<p className={helpTextClass}>
												Keep the full year for brothers already in the fellowship. Choose a later start only
												for someone who joined after January, so earlier months aren&apos;t charged.
											</p>
											<label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3.5 text-sm has-[:checked]:border-navy-800 has-[:checked]:bg-navy-50">
												<input
													type="radio"
													name="dues_start_mode"
													value="full_year"
													required
													defaultChecked={fullYearDues}
													className="mt-0.5 h-4 w-4 accent-navy-900"
												/>
												<span>
													<span className="font-medium text-navy-950">Full year from January 2026</span>
													<span className="mt-0.5 block text-slate-600">
														£120 for twelve months, paid together or month by month.
													</span>
												</span>
											</label>
											<div className="rounded-lg border border-line p-3.5 text-sm has-[:checked]:border-navy-800 has-[:checked]:bg-navy-50">
												<label className="flex cursor-pointer items-start gap-3">
													<input
														type="radio"
														name="dues_start_mode"
														value="from_month"
														defaultChecked={!fullYearDues}
														className="mt-0.5 h-4 w-4 accent-navy-900"
													/>
													<span className="font-medium text-navy-950">Starts later (new member)</span>
												</label>
												<div className="mt-3 max-w-xs pl-7">
													<label htmlFor="joined_on" className="text-[0.8125rem] font-medium text-slate-600">
														First month to pay
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
																: joinedAtToMonthInput(member.joined_at) || getCurrentDueMonth().slice(0, 7)
														}
														className={inputClass}
													/>
												</div>
											</div>
										</fieldset>
									</fieldset>
								)}
							</div>
							<div className="mt-6 flex justify-end border-t border-line pt-5">
								<PendingSubmitButton className={primaryButtonClass} pendingLabel="Saving…">
									Save member record
								</PendingSubmitButton>
							</div>
						</SectionCard>
					</form>

					<SectionCard title="Dues history" flush>
						{sortedDues.length === 0 ? (
							<EmptyState icon="wallet" title="No dues set up yet" compact>
								Opening Payments creates the current month for active members.
							</EmptyState>
						) : (
							<div className="overflow-x-auto">
								<table className={tableClass}>
									<caption className="sr-only">Dues for {memberName}</caption>
									<thead className={theadClass}>
										<tr>
											<th scope="col" className={thClass}>Month</th>
											<th scope="col" className={`${thClass} text-right`}>Due</th>
											<th scope="col" className={`${thClass} text-right`}>Paid</th>
											<th scope="col" className={thClass}>Status</th>
											<th scope="col" className={thClass}>
												<span className="sr-only">Actions</span>
											</th>
										</tr>
									</thead>
									<tbody>
										{sortedDues.map((row) => (
											<tr key={row.id} className={trClass}>
												<td className={`${tdClass} whitespace-nowrap font-medium`}>{formatDueMonth(row.due_month)}</td>
												<td className={`${tdClass} text-right`}>{formatPenceAsGbp(row.amount_due_pence)}</td>
												<td className={`${tdClass} text-right`}>{formatPenceAsGbp(row.amount_paid_pence)}</td>
												<td className={tdClass}>
													<DuesStatusBadge status={row.status} />
												</td>
												<td className={`${tdClass} text-right`}>
													{canAdminWaiveDues(row.status) ? (
														<form action={waiveDuesAction}>
															<input type="hidden" name="duesId" value={row.id} />
															<input type="hidden" name="memberId" value={member.id} />
															<PendingSubmitButton
																className={`${ghostButtonClass} ${smallButtonClass}`}
																pendingLabel="Waiving…"
																aria-label={`Waive ${formatDueMonth(row.due_month)}`}
															>
																Waive
															</PendingSubmitButton>
														</form>
													) : null}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</SectionCard>
				</div>

				<div className="space-y-5">
					{member.membership_status === 'ACTIVE' && dues ? (
						<SectionCard
							title="Record a payment"
							description="Match a transfer that has arrived to the months it covers."
						>
							<RecordPaymentForm
								action={recordPaymentAction}
								members={[member]}
								outstandingDues={allocatable}
								initialMemberId={member.id}
							/>
						</SectionCard>
					) : null}

					{!isSelf ? (
						<SectionCard
							title="Reset password"
							description="Signs him out on every device. Share the new password privately."
						>
							<form action={changeMemberPasswordAction} className="space-y-4">
								<input type="hidden" name="memberId" value={member.id} />
								<div>
									<label htmlFor="member_password" className={labelClass}>
										New password
									</label>
									<input
										id="member_password"
										name="password"
										type="password"
										minLength={10}
										maxLength={72}
										required
										autoComplete="new-password"
										className={inputClass}
									/>
									<p className={helpTextClass}>At least 10 characters.</p>
								</div>
								<div>
									<label htmlFor="member_confirm_password" className={labelClass}>
										Confirm new password
									</label>
									<input
										id="member_confirm_password"
										name="confirm_password"
										type="password"
										minLength={10}
										maxLength={72}
										required
										autoComplete="new-password"
										className={inputClass}
									/>
								</div>
								<PendingSubmitButton className={secondaryButtonClass} pendingLabel="Saving…">
									Reset password
								</PendingSubmitButton>
							</form>
						</SectionCard>
					) : null}

					{!isSelf ? (
						<SectionCard
							title="Remove account"
							tone="danger"
							description="Only possible for inactive members with no dues or payment history. Otherwise, set the member to inactive to keep the financial record."
						>
							<ConfirmDeleteForm
								action={deleteMemberAccountAction}
								idName="memberId"
								idValue={member.id}
								triggerLabel="Remove account permanently"
								title="Remove this account permanently?"
								body="This can't be undone. Members with dues or payment history must be kept as inactive instead."
								confirmLabel="remove account"
							/>
						</SectionCard>
					) : null}
				</div>
			</div>
		</main>
	)
}

export default MemberDetailPage
