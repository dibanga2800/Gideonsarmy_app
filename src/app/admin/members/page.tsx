import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
	listInvitesForAdmin,
	listMembersPageForAdmin,
} from '@/server/services/member-service'
import { getAdminEmailStatus } from '@/server/services/notification-admin-service'
import {
	approveMemberAction,
	createMemberManuallyAction,
	inviteMemberAction,
} from '@/server/actions/member-actions'
import { AlertNotice, NoticeStack } from '@/components/alert-notice'
import { EmptyState } from '@/components/empty-state'
import { Icon } from '@/components/icons'
import { MemberAvatar } from '@/components/member-avatar'
import { MembersPagination } from '@/components/members-pagination'
import { ListPagination } from '@/components/list-pagination'
import { MemberInviteRow } from '@/components/member-invite-row'
import { PageHeader } from '@/components/page-header'
import { PendingSubmitButton } from '@/components/pending-submit-button'
import { SectionCard } from '@/components/section-card'
import { StatGroup } from '@/components/stat-group'
import { MembershipBadge, RoleBadge, StatusBadge } from '@/components/status-badge'
import {
	memberDirectorySearchSchema,
	memberStatusFilterSchema,
} from '@/lib/validation/member'
import { memberDisplayName } from '@/lib/members/display'
import { DEFAULT_LIST_PAGE_SIZE, parsePageParam } from '@/lib/list-pagination'
import {
	filterActiveClass,
	filterIdleClass,
	formGridClass,
	formSpanFullClass,
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

export const metadata: Metadata = {
	title: 'Members',
}

interface MembersPageProps {
	searchParams: {
		status?: string
		q?: string
		page?: string
		invitePage?: string
		error?: string
		reason?: string
		invited?: string
		updated?: string
		email?: string
		approved?: string
	}
}

const inviteErrorMessage = (reason?: string) => {
	switch (reason) {
		case 'exists':
			return 'A member with that email already exists.'
		case 'used':
			return 'That invitation has already been used.'
		case 'invalid':
			return 'Enter a valid email address and try again.'
		case 'denied':
			return 'You do not have permission to invite members.'
		case 'not-found':
			return 'That invitation has already been used or no longer exists.'
		default:
			return 'That invitation could not be completed. Try again, or add the member manually.'
	}
}

const createErrorMessage = (reason?: string) => {
	switch (reason) {
		case 'exists':
			return 'A member with that email already exists.'
		case 'auth':
			return 'The account could not be created in authentication. Check the email and temporary password.'
		case 'denied':
			return 'You do not have permission to add members.'
		default:
			return 'The member could not be created. Check the details and try again.'
	}
}

const MembersPage = async ({ searchParams }: MembersPageProps) => {
	const filter = memberStatusFilterSchema.safeParse(searchParams.status ?? 'ACTIVE')
	const status = filter.success && filter.data !== 'all' ? filter.data : undefined
	const statusParam = filter.success ? filter.data : 'ACTIVE'
	const parsedSearch = memberDirectorySearchSchema.safeParse(searchParams.q ?? '')
	const search = parsedSearch.success ? parsedSearch.data : ''
	const page = parsePageParam(searchParams.page)
	const invitePage = parsePageParam(searchParams.invitePage)

	const [directory, pendingPage, invites, emailStatus] = await Promise.all([
		listMembersPageForAdmin({
			status,
			search,
			page,
			pageSize: DEFAULT_LIST_PAGE_SIZE,
		}),
		listMembersPageForAdmin({
			status: 'PENDING',
			page: 1,
			pageSize: 50,
		}),
		listInvitesForAdmin({
			page: invitePage,
			pageSize: DEFAULT_LIST_PAGE_SIZE,
		}),
		getAdminEmailStatus(),
	])

	if (!directory || !pendingPage || !invites) {
		redirect('/dashboard')
	}

	const openInvites = invites.invites
	const filterQuery = statusParam === 'ACTIVE' ? undefined : statusParam === 'all' ? 'all' : statusParam
	const filterHref = (nextStatus?: string, includeSearch = true) => {
		const params = new URLSearchParams()
		if (nextStatus) {
			params.set('status', nextStatus)
		}
		if (includeSearch && search) {
			params.set('q', search)
		}
		if (invitePage > 1) {
			params.set('invitePage', String(invitePage))
		}
		const query = params.toString()
		return query ? `/admin/members?${query}` : '/admin/members'
	}
	const inviteHrefForPage = (nextPage: number) => {
		const params = new URLSearchParams()
		if (filterQuery) {
			params.set('status', filterQuery)
		}
		if (search) {
			params.set('q', search)
		}
		if (directory.page > 1) {
			params.set('page', String(directory.page))
		}
		if (nextPage > 1) {
			params.set('invitePage', String(nextPage))
		}
		return `/admin/members?${params.toString()}`
	}

	const directoryLabel =
		statusParam === 'all'
			? 'All members'
			: statusParam === 'PENDING'
				? 'Pending members'
				: statusParam === 'INACTIVE'
					? 'Inactive members'
					: 'Active members'

	return (
		<main className={pageContentClass}>
			<PageHeader
				title="Members"
				description="Approve new brothers, keep the directory current, and send invitations."
				actions={
					<Link href="#invite" className={primaryButtonClass}>
						<Icon name="mail" className="h-4 w-4" />
						Invite a member
					</Link>
				}
			/>

			<NoticeStack>
				{searchParams.approved === '1' ? (
					<AlertNotice kind="success" title="Member approved">
						He is now an active member and can sign in to the full portal.
					</AlertNotice>
				) : null}
				{searchParams.invited === '1' ? (
					<AlertNotice kind={searchParams.email === '0' ? 'danger' : 'success'} title="Invitation saved">
						{searchParams.email === '0'
							? "The invitation was saved, but the email didn't send. Ask him to sign in or create a password with that address, or add him manually."
							: 'The invitation email has been sent. He stays pending until you approve him.'}
					</AlertNotice>
				) : null}
				{searchParams.updated === '1' ? (
					<AlertNotice kind={searchParams.email === '0' ? 'danger' : 'success'} title="Invitation updated">
						{searchParams.email === '0'
							? "The details were saved, but the email didn't send. Use Resend to try again."
							: 'The details were saved and a fresh email was sent.'}
					</AlertNotice>
				) : null}
				{searchParams.error === 'invite' ? (
					<AlertNotice kind="danger" title="Invitation not sent">
						{inviteErrorMessage(searchParams.reason)}
					</AlertNotice>
				) : null}
				{searchParams.error === 'create' ? (
					<AlertNotice kind="danger" title="Member not added">
						{createErrorMessage(searchParams.reason)}
					</AlertNotice>
				) : null}
				{searchParams.error === 'approve' ? (
					<AlertNotice kind="danger" title="Member not approved">
						Open his record and try again from there.
					</AlertNotice>
				) : null}
				{searchParams.error &&
				searchParams.error !== 'invite' &&
				searchParams.error !== 'create' &&
				searchParams.error !== 'approve' ? (
					<AlertNotice kind="danger" title="Membership not updated">
						That change couldn&apos;t be completed. Try again.
					</AlertNotice>
				) : null}
			</NoticeStack>

			<StatGroup
				label="Membership summary"
				items={[
					{
						label: 'Awaiting approval',
						value: pendingPage.total,
						detail: pendingPage.total > 0 ? 'Review them below' : 'Nobody waiting',
						attention: pendingPage.total > 0,
					},
					{ label: directoryLabel, value: directory.total, detail: 'In the current filter' },
					{ label: 'Open invitations', value: invites.total, detail: "Invited but not signed in yet", href: '#invite' },
				]}
			/>

			{pendingPage.members.length > 0 ? (
				<SectionCard
					title="Awaiting approval"
					description="These brothers have signed in or been added but can't use the portal yet."
					className="mt-5"
					flush
				>
					<ul className="divide-y divide-cream-100">
						{pendingPage.members.map((member) => (
							<li
								key={member.id}
								className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
							>
								<div className="flex min-w-0 items-center gap-3">
									<MemberAvatar name={memberDisplayName(member) || member.email} />
									<div className="min-w-0">
										<p className="truncate text-sm font-semibold text-navy-950">
											{memberDisplayName(member) || 'Name not added yet'}
										</p>
										<p className="truncate text-[0.8125rem] text-slate-500">{member.email}</p>
									</div>
								</div>
								<div className="flex flex-wrap gap-2">
									<Link
										href={`/admin/members/${member.id}`}
										className={`${secondaryButtonClass} ${smallButtonClass}`}
									>
										Review
									</Link>
									<form action={approveMemberAction}>
										<input type="hidden" name="memberId" value={member.id} />
										<PendingSubmitButton className={`${primaryButtonClass} ${smallButtonClass}`} pendingLabel="Approving…">
											<Icon name="check" className="h-4 w-4" />
											Approve
										</PendingSubmitButton>
									</form>
								</div>
							</li>
						))}
					</ul>
				</SectionCard>
			) : null}

			<SectionCard title="Directory" className="mt-5" flush>
				<div className="flex flex-col gap-3 border-b border-line px-5 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
					<nav className="flex flex-wrap gap-1" aria-label="Filter members">
						<FilterLink href={filterHref()} active={statusParam === 'ACTIVE'}>
							Active
						</FilterLink>
						<FilterLink href={filterHref('PENDING')} active={statusParam === 'PENDING'}>
							Pending
						</FilterLink>
						<FilterLink href={filterHref('INACTIVE')} active={statusParam === 'INACTIVE'}>
							Inactive
						</FilterLink>
						<FilterLink href={filterHref('all')} active={statusParam === 'all'}>
							All
						</FilterLink>
					</nav>
					<form method="get" role="search" className="flex gap-2 lg:w-96">
						{filterQuery ? <input type="hidden" name="status" value={filterQuery} /> : null}
						<div className="relative min-w-0 flex-1">
							<Icon
								name="search"
								className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
							/>
							<input
								type="search"
								name="q"
								defaultValue={search}
								placeholder="Search name or email"
								aria-label="Search members by name or email"
								className={`${inputClass} mt-0 pl-9`}
								maxLength={100}
							/>
						</div>
						<button type="submit" className={secondaryButtonClass}>
							Search
						</button>
						{search ? (
							<Link href={filterHref(filterQuery, false)} className={ghostButtonClass}>
								Clear
							</Link>
						) : null}
					</form>
				</div>
				{!parsedSearch.success ? (
					<p className="border-b border-line bg-red-50 px-5 py-2.5 text-sm text-red-800 sm:px-6" role="alert">
						Search using letters, numbers, spaces, apostrophes, hyphens, full stops, + or @.
					</p>
				) : null}

				{directory.members.length === 0 ? (
					<EmptyState icon="users" title={search ? 'No members match that search' : 'No members in this view'} compact>
						{search ? 'Try a different name or email, or switch filter.' : 'Try another filter.'}
					</EmptyState>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className={tableClass}>
								<caption className="sr-only">Fellowship members</caption>
								<thead className={theadClass}>
									<tr>
										<th scope="col" className={thClass}>Member</th>
										<th scope="col" className={thClass}>Status</th>
										<th scope="col" className={thClass}>Role</th>
										<th scope="col" className={thClass}>
											<span className="sr-only">Open record</span>
										</th>
									</tr>
								</thead>
								<tbody>
									{directory.members.map((member) => (
										<tr key={member.id} className={`${trClass} hover:bg-cream-50`}>
											<td className={tdClass}>
												<div className="flex items-center gap-3">
													<MemberAvatar name={memberDisplayName(member) || member.email} />
													<div className="min-w-0">
														<p className="font-medium text-navy-950">{memberDisplayName(member) || '—'}</p>
														<p className="text-[0.8125rem] text-slate-500">{member.email}</p>
													</div>
												</div>
											</td>
											<td className={tdClass}>
												<MembershipBadge status={member.membership_status} />
											</td>
											<td className={tdClass}>
												<RoleBadge role={member.role} />
											</td>
											<td className={`${tdClass} text-right`}>
												<Link
													href={`/admin/members/${member.id}`}
													className={`${ghostButtonClass} ${smallButtonClass}`}
													aria-label={`Open record for ${memberDisplayName(member) || member.email}`}
												>
													Open
													<Icon name="arrow-right" className="h-4 w-4" />
												</Link>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<MembersPagination
							page={directory.page}
							totalPages={directory.totalPages}
							total={directory.total}
							pageSize={directory.pageSize}
							status={filterQuery}
							search={search}
							invitePage={invitePage}
						/>
					</>
				)}
			</SectionCard>

			<div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
				<SectionCard
					id="invite"
					title="Invite by email"
					description="He can then sign in with Google, or create a password if his address isn't Gmail. If the email doesn't arrive, ask him to check spam, resend, or add him manually."
					actions={
						emailStatus ? (
							<StatusBadge tone={emailStatus.ready ? 'positive' : 'warning'}>{emailStatus.label}</StatusBadge>
						) : undefined
					}
				>
					{emailStatus && !emailStatus.ready ? (
						<p className="mb-4 text-sm text-slate-600">{emailStatus.detail}</p>
					) : null}
					<form action={inviteMemberAction} className={formGridClass}>
						<div className={formSpanFullClass}>
							<label htmlFor="invite_email" className={labelClass}>
								Email
							</label>
							<input
								id="invite_email"
								name="email"
								type="email"
								required
								maxLength={254}
								className={inputClass}
								autoComplete="email"
							/>
						</div>
						<div>
							<label htmlFor="invite_first_name" className={labelClass}>
								First name <span className="font-normal text-slate-500">(optional)</span>
							</label>
							<input id="invite_first_name" name="first_name" type="text" maxLength={80} className={inputClass} />
						</div>
						<div>
							<label htmlFor="invite_last_name" className={labelClass}>
								Last name <span className="font-normal text-slate-500">(optional)</span>
							</label>
							<input id="invite_last_name" name="last_name" type="text" maxLength={80} className={inputClass} />
						</div>
						<div className={formSpanFullClass}>
							<PendingSubmitButton className={primaryButtonClass} pendingLabel="Sending…">
								Send invitation
							</PendingSubmitButton>
						</div>
					</form>

					<div className="mt-6 border-t border-line pt-5">
						<h3 className="text-sm font-semibold text-navy-950">
							Open invitations
							<span className="ml-2 font-normal text-slate-500">{invites.total}</span>
						</h3>
						{openInvites.length > 0 ? (
							<>
								<ul className="mt-3 space-y-2">
									{openInvites.map((invite) => (
										<MemberInviteRow
											key={invite.id}
											id={invite.id}
											email={invite.email}
											firstName={invite.first_name}
											lastName={invite.last_name}
										/>
									))}
								</ul>
								<ListPagination
									page={invites.page}
									totalPages={invites.totalPages}
									total={invites.total}
									pageSize={invites.pageSize}
									hrefForPage={inviteHrefForPage}
									label="Invitation list pages"
									className="mt-3 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between"
								/>
							</>
						) : (
							<p className="mt-2 text-sm text-slate-500">Everyone invited has signed in.</p>
						)}
					</div>
				</SectionCard>

				<SectionCard
					title="Add an account manually"
					description="Creates the account straight away with a temporary password you share with him privately. Use this when email invitations aren't getting through."
				>
					<form action={createMemberManuallyAction} className={formGridClass}>
						<div className={formSpanFullClass}>
							<label htmlFor="create_email" className={labelClass}>
								Email
							</label>
							<input
								id="create_email"
								name="email"
								type="email"
								required
								maxLength={254}
								className={inputClass}
								autoComplete="off"
							/>
						</div>
						<div>
							<label htmlFor="create_first_name" className={labelClass}>
								First name
							</label>
							<input
								id="create_first_name"
								name="first_name"
								type="text"
								required
								maxLength={80}
								className={inputClass}
								autoComplete="off"
							/>
						</div>
						<div>
							<label htmlFor="create_last_name" className={labelClass}>
								Last name
							</label>
							<input
								id="create_last_name"
								name="last_name"
								type="text"
								required
								maxLength={80}
								className={inputClass}
								autoComplete="off"
							/>
						</div>
						<div>
							<label htmlFor="create_password" className={labelClass}>
								Temporary password
							</label>
							<input
								id="create_password"
								name="password"
								type="text"
								required
								minLength={10}
								maxLength={72}
								className={inputClass}
								autoComplete="new-password"
								aria-describedby="create_password_help"
							/>
							<p id="create_password_help" className={helpTextClass}>
								At least 10 characters.
							</p>
						</div>
						<div>
							<label htmlFor="create_membership_status" className={labelClass}>
								Membership
							</label>
							<select
								id="create_membership_status"
								name="membership_status"
								className={inputClass}
								defaultValue="PENDING"
							>
								<option value="PENDING">Pending approval</option>
								<option value="ACTIVE">Active now</option>
							</select>
						</div>
						<div className={formSpanFullClass}>
							<PendingSubmitButton className={secondaryButtonClass} pendingLabel="Creating…">
								Create account
							</PendingSubmitButton>
						</div>
					</form>
				</SectionCard>
			</div>
		</main>
	)
}

const FilterLink = ({
	href,
	active,
	children,
}: {
	href: string
	active: boolean
	children: string
}) => {
	return (
		<Link
			href={href}
			className={active ? filterActiveClass : filterIdleClass}
			aria-current={active ? 'page' : undefined}
		>
			{children}
		</Link>
	)
}

export default MembersPage
