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
	resendMemberInviteAction,
	updateMemberInviteAction,
} from '@/server/actions/member-actions'
import { AlertNotice } from '@/components/alert-notice'
import { MembersPagination } from '@/components/members-pagination'
import { ListPagination } from '@/components/list-pagination'
import { PageHeader } from '@/components/page-header'
import { memberStatusFilterSchema } from '@/lib/validation/member'
import { membershipStatusLabel, roleLabel } from '@/lib/members/display'
import { DEFAULT_LIST_PAGE_SIZE, parsePageParam } from '@/lib/list-pagination'
import {
	cardComfortClass,
	emptyStateClass,
	eyebrowClass,
	filterActiveClass,
	filterIdleClass,
	formGridClass,
	formSpanFullClass,
	helpTextClass,
	inputClass,
	labelClass,
	navLinkClass,
	pageContentClass,
	primaryButtonClass,
	secondaryButtonClass,
	sectionHeadingClass,
	tableWrapClass,
} from '@/lib/ui'

export const metadata: Metadata = {
	title: 'Members',
}

interface MembersPageProps {
	searchParams: {
		status?: string
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
	const page = parsePageParam(searchParams.page)
	const invitePage = parsePageParam(searchParams.invitePage)

	const [directory, pendingPage, invites, emailStatus] = await Promise.all([
		listMembersPageForAdmin({
			status,
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
	const filterHref = (nextStatus?: string) => {
		const params = new URLSearchParams()
		if (nextStatus) {
			params.set('status', nextStatus)
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
		if (directory.page > 1) {
			params.set('page', String(directory.page))
		}
		if (nextPage > 1) {
			params.set('invitePage', String(nextPage))
		}
		return `/admin/members?${params.toString()}`
	}

	return (
		<main className={pageContentClass}>
			<PageHeader
				eyebrow="Administration"
				title="Members"
				lead="Approve new brothers first, then manage the active directory. Invite by email when you can; add manually if mail delivery fails."
				leadWide
			/>

			{searchParams.approved === '1' ? (
				<div className="mt-6">
					<AlertNotice kind="success" title="Member approved">
						That brother is now an active member.
					</AlertNotice>
				</div>
			) : null}

			{searchParams.invited === '1' ? (
				<div className="mt-6">
					<AlertNotice kind="success" title="Invitation saved">
						{searchParams.email === '0'
							? 'The invitation was saved, but the email could not be sent. Ask him to open Signup or Login with that address, or add him manually.'
							: 'The invitation has been sent. He remains pending until you approve membership.'}
					</AlertNotice>
				</div>
			) : null}

			{searchParams.updated === '1' ? (
				<div className="mt-6">
					<AlertNotice kind={searchParams.email === '0' ? 'danger' : 'success'} title="Invitation updated">
						{searchParams.email === '0'
							? 'The invitation details were saved, but the updated email could not be sent. Use Resend email to try again.'
							: 'The invitation details were saved and a fresh email was sent.'}
					</AlertNotice>
				</div>
			) : null}

			{searchParams.error === 'invite' ? (
				<div className="mt-6">
					<AlertNotice kind="danger" title="Invitation failed">
						{inviteErrorMessage(searchParams.reason)}
					</AlertNotice>
				</div>
			) : null}

			{searchParams.error === 'create' ? (
				<div className="mt-6">
					<AlertNotice kind="danger" title="Could not add member">
						{createErrorMessage(searchParams.reason)}
					</AlertNotice>
				</div>
			) : null}

			{searchParams.error === 'approve' ? (
				<div className="mt-6">
					<AlertNotice kind="danger" title="Could not approve">
						That membership could not be approved. Open the member record and try
						again.
					</AlertNotice>
				</div>
			) : null}

			{searchParams.error &&
			searchParams.error !== 'invite' &&
			searchParams.error !== 'create' &&
			searchParams.error !== 'approve' ? (
				<div className="mt-6">
					<AlertNotice kind="danger" title="Could not update">
						That membership update could not be completed.
					</AlertNotice>
				</div>
			) : null}

			<section className="mt-8 grid gap-4 sm:grid-cols-3">
				<div className={cardComfortClass}>
					<p className={eyebrowClass}>Awaiting approval</p>
					<p className="mt-3 font-serif text-3xl font-semibold text-navy-950">
						{pendingPage.total}
					</p>
					<p className="mt-1 text-sm text-navy-800/80">Pending members</p>
				</div>
				<div className={cardComfortClass}>
					<p className={eyebrowClass}>Directory</p>
					<p className="mt-3 font-serif text-3xl font-semibold text-navy-950">
						{directory.total}
					</p>
					<p className="mt-1 text-sm text-navy-800/80">
						{statusParam === 'all'
							? 'All members in this view'
							: statusParam === 'PENDING'
								? 'Pending in directory'
								: statusParam === 'INACTIVE'
									? 'Inactive members'
									: 'Active members'}
					</p>
				</div>
				<div className={cardComfortClass}>
					<p className={eyebrowClass}>Open invites</p>
					<p className="mt-3 font-serif text-3xl font-semibold text-navy-950">
						{invites.total}
					</p>
					<p className="mt-1 text-sm text-navy-800/80">Waiting to sign in</p>
				</div>
			</section>

			{pendingPage.members.length > 0 ? (
				<section className={`${cardComfortClass} mt-8`}>
					<p className={eyebrowClass}>New members</p>
					<h2 className={`${sectionHeadingClass} mt-2`}>Awaiting approval</h2>
					<p className="mt-2 max-w-3xl text-sm leading-6 text-navy-800/80">
						These brothers have signed in or been added, but are not yet active.
						Approve them here, or open the record to review details first.
					</p>
					<ul className="mt-6 divide-y divide-cream-100">
						{pendingPage.members.map((member) => (
							<li
								key={member.id}
								className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between"
							>
								<div>
									<p className="font-medium text-navy-950">
										{member.first_name} {member.last_name}
									</p>
									<p className="mt-1 text-sm text-navy-800">{member.email}</p>
								</div>
								<div className="flex flex-wrap gap-2">
									<form action={approveMemberAction}>
										<input type="hidden" name="memberId" value={member.id} />
										<button type="submit" className={primaryButtonClass}>
											Approve member
										</button>
									</form>
									<Link
										href={`/admin/members/${member.id}`}
										className={secondaryButtonClass}
									>
										Review record
									</Link>
								</div>
							</li>
						))}
					</ul>
				</section>
			) : null}

			<section className="mt-10">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className={eyebrowClass}>Directory</p>
						<h2 className={`${sectionHeadingClass} mt-2`}>Fellowship members</h2>
					</div>
					<nav className="flex flex-wrap gap-2" aria-label="Filter members">
						<FilterLink href={filterHref()} active={statusParam === 'ACTIVE'}>
							Active
						</FilterLink>
						<FilterLink
							href={filterHref('PENDING')}
							active={statusParam === 'PENDING'}
						>
							Pending
						</FilterLink>
						<FilterLink
							href={filterHref('INACTIVE')}
							active={statusParam === 'INACTIVE'}
						>
							Inactive
						</FilterLink>
						<FilterLink href={filterHref('all')} active={statusParam === 'all'}>
							All
						</FilterLink>
					</nav>
				</div>

				{directory.members.length === 0 ? (
					<p className={emptyStateClass}>No members match this filter.</p>
				) : (
					<div className={`${tableWrapClass} mt-6`}>
						<table className="min-w-full text-left text-sm">
							<caption className="sr-only">Fellowship members</caption>
							<thead className="border-b border-cream-200 bg-cream-50">
								<tr>
									<th scope="col" className="px-4 py-3 font-medium text-navy-800">
										Name
									</th>
									<th scope="col" className="px-4 py-3 font-medium text-navy-800">
										Email
									</th>
									<th scope="col" className="px-4 py-3 font-medium text-navy-800">
										Status
									</th>
									<th scope="col" className="px-4 py-3 font-medium text-navy-800">
										Role
									</th>
									<th scope="col" className="px-4 py-3 font-medium text-navy-800">
										<span className="sr-only">Open</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{directory.members.map((member) => (
									<tr
										key={member.id}
										className="border-b border-cream-100 last:border-0"
									>
										<td className="px-4 py-3 font-medium text-navy-950">
											{member.first_name} {member.last_name}
										</td>
										<td className="px-4 py-3 text-navy-800">{member.email}</td>
										<td className="px-4 py-3 text-navy-800">
											{membershipStatusLabel(member.membership_status)}
										</td>
										<td className="px-4 py-3 text-navy-800">
											{roleLabel(member.role)}
										</td>
										<td className="px-4 py-3 text-right">
											<Link
												href={`/admin/members/${member.id}`}
												className={navLinkClass}
											>
												Open
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
						<MembersPagination
							page={directory.page}
							totalPages={directory.totalPages}
							total={directory.total}
							pageSize={directory.pageSize}
							status={filterQuery}
							invitePage={invitePage}
						/>
					</div>
				)}
			</section>

			<section className="mt-10 grid gap-6 xl:grid-cols-2">
				<div className={cardComfortClass}>
					<p className={eyebrowClass}>Invite</p>
					<h2 className={`${sectionHeadingClass} mt-2`}>Invite by email</h2>
					<p className="mt-2 text-sm leading-6 text-navy-800/80">
						He can sign in with Google or create a password at signup. If mail
						does not arrive, check Spam, use Resend, or add him manually.
					</p>
					{emailStatus ? (
						<p className="mt-3 text-sm leading-6 text-navy-800">
							Delivery:{' '}
							<span className="font-semibold">{emailStatus.label}</span>
							{' · '}
							{emailStatus.detail}
						</p>
					) : null}
					<form action={inviteMemberAction} className={`mt-6 ${formGridClass}`}>
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
								First name
							</label>
							<input
								id="invite_first_name"
								name="first_name"
								type="text"
								maxLength={80}
								className={inputClass}
							/>
						</div>
						<div>
							<label htmlFor="invite_last_name" className={labelClass}>
								Last name
							</label>
							<input
								id="invite_last_name"
								name="last_name"
								type="text"
								maxLength={80}
								className={inputClass}
							/>
						</div>
						<div className={formSpanFullClass}>
							<button type="submit" className={primaryButtonClass}>
								Send invitation
							</button>
						</div>
					</form>
					{openInvites.length > 0 ? (
						<>
							<ul className="mt-6 space-y-4 border-t border-cream-100 pt-4 text-sm text-navy-800">
								{openInvites.map((invite) => (
									<li
										key={invite.id}
										className="rounded-xl border border-cream-200 bg-cream-50 p-4"
									>
										<p className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-700">
											Waiting to sign in
										</p>
										<form
											action={updateMemberInviteAction}
											className="grid gap-3 sm:grid-cols-2"
										>
											<input type="hidden" name="inviteId" value={invite.id} />
											<div className="sm:col-span-2">
												<label
													htmlFor={`invite-email-${invite.id}`}
													className={labelClass}
												>
													Email
												</label>
												<input
													id={`invite-email-${invite.id}`}
													name="email"
													type="email"
													required
													maxLength={254}
													defaultValue={invite.email}
													className={inputClass}
												/>
											</div>
											<div>
												<label
													htmlFor={`invite-first-${invite.id}`}
													className={labelClass}
												>
													First name
												</label>
												<input
													id={`invite-first-${invite.id}`}
													name="first_name"
													type="text"
													maxLength={80}
													defaultValue={invite.first_name ?? ''}
													className={inputClass}
												/>
											</div>
											<div>
												<label
													htmlFor={`invite-last-${invite.id}`}
													className={labelClass}
												>
													Last name
												</label>
												<input
													id={`invite-last-${invite.id}`}
													name="last_name"
													type="text"
													maxLength={80}
													defaultValue={invite.last_name ?? ''}
													className={inputClass}
												/>
											</div>
											<div className="flex flex-wrap gap-2 sm:col-span-2">
												<button type="submit" className={primaryButtonClass}>
													Save &amp; resend invitation
												</button>
											</div>
										</form>
										<form action={resendMemberInviteAction} className="mt-2">
											<input type="hidden" name="email" value={invite.email} />
											<button type="submit" className={secondaryButtonClass}>
												Resend current invitation
											</button>
										</form>
									</li>
								))}
							</ul>
							<ListPagination
								page={invites.page}
								totalPages={invites.totalPages}
								total={invites.total}
								pageSize={invites.pageSize}
								hrefForPage={inviteHrefForPage}
								label="Invitation list pages"
								className="mt-4 flex flex-col gap-3 border-t border-cream-100 pt-4 text-sm text-navy-800 sm:flex-row sm:items-center sm:justify-between"
							/>
						</>
					) : (
						<p className="mt-6 border-t border-cream-100 pt-4 text-sm text-navy-800/75">
							There are no open email invitations.
						</p>
					)}
				</div>

				<div className={cardComfortClass}>
					<p className={eyebrowClass}>Backup</p>
					<h2 className={`${sectionHeadingClass} mt-2`}>Add member manually</h2>
					<p className="mt-2 text-sm leading-6 text-navy-800/80">
						Creates the account now with a temporary password you can share
						privately. Prefer Pending, then approve after he signs in.
					</p>
					<form
						action={createMemberManuallyAction}
						className={`mt-6 ${formGridClass}`}
					>
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
							/>
							<p className={helpTextClass}>At least 10 characters.</p>
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
							<button type="submit" className={secondaryButtonClass}>
								Create member account
							</button>
						</div>
					</form>
				</div>
			</section>
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
