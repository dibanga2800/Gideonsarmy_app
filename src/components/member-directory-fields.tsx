import { BIRTH_DAYS, BIRTH_MONTHS } from '@/lib/dates/birthday'
import {
	formGridClass,
	formSpan2Class,
	formSpanFullClass,
	helpTextClass,
	inputClass,
	labelClass,
	textareaClass,
} from '@/lib/ui'
import {
	PROFILE_ADDRESS_MAX,
	PROFILE_SHORT_TEXT_MAX,
} from '@/lib/validation/member'
import type { Profile } from '@/types/database'

interface MemberDirectoryFieldsProps {
	profile: Profile
}

export const MemberDirectoryFields = ({ profile }: MemberDirectoryFieldsProps) => {
	return (
		<div className={formGridClass}>
			<div>
				<label htmlFor="first_name" className={labelClass}>
					First name
				</label>
				<input
					id="first_name"
					name="first_name"
					type="text"
					required
					maxLength={PROFILE_SHORT_TEXT_MAX}
					autoComplete="given-name"
					defaultValue={profile.first_name}
					className={inputClass}
				/>
			</div>
			<div>
				<label htmlFor="last_name" className={labelClass}>
					Last name
				</label>
				<input
					id="last_name"
					name="last_name"
					type="text"
					required
					maxLength={PROFILE_SHORT_TEXT_MAX}
					autoComplete="family-name"
					defaultValue={profile.last_name}
					className={inputClass}
				/>
			</div>
			<div>
				<label htmlFor="phone" className={labelClass}>
					Phone
				</label>
				<input
					id="phone"
					name="phone"
					type="tel"
					maxLength={PROFILE_SHORT_TEXT_MAX}
					autoComplete="tel"
					defaultValue={profile.phone ?? ''}
					className={inputClass}
				/>
			</div>
			<div>
				<label htmlFor="department" className={labelClass}>
					Department
				</label>
				<input
					id="department"
					name="department"
					type="text"
					maxLength={PROFILE_SHORT_TEXT_MAX}
					defaultValue={profile.department ?? ''}
					className={inputClass}
				/>
				<p className={helpTextClass}>Church department, if applicable.</p>
			</div>
			<div>
				<label htmlFor="occupation" className={labelClass}>
					Occupation
				</label>
				<input
					id="occupation"
					name="occupation"
					type="text"
					maxLength={PROFILE_SHORT_TEXT_MAX}
					autoComplete="organization-title"
					defaultValue={profile.occupation ?? ''}
					className={inputClass}
				/>
			</div>
			<div className={formSpanFullClass}>
				<label htmlFor="address" className={labelClass}>
					Address
				</label>
				<textarea
					id="address"
					name="address"
					rows={3}
					maxLength={PROFILE_ADDRESS_MAX}
					autoComplete="street-address"
					defaultValue={profile.address ?? ''}
					className={textareaClass}
				/>
			</div>
			<fieldset className={formSpan2Class}>
				<legend className={labelClass}>Birthday</legend>
				<p className={helpTextClass}>
					Day and month only. The year is not stored, so age is not recorded.
				</p>
				<div className="mt-3 grid grid-cols-2 gap-3">
					<div>
						<label htmlFor="birth_day" className={labelClass}>
							Day
						</label>
						<select
							id="birth_day"
							name="birth_day"
							defaultValue={profile.birth_day?.toString() ?? ''}
							className={inputClass}
						>
							<option value="">Day</option>
							{BIRTH_DAYS.map((day) => (
								<option key={day} value={day}>
									{day}
								</option>
							))}
						</select>
					</div>
					<div>
						<label htmlFor="birth_month" className={labelClass}>
							Month
						</label>
						<select
							id="birth_month"
							name="birth_month"
							defaultValue={profile.birth_month?.toString() ?? ''}
							className={inputClass}
						>
							<option value="">Month</option>
							{BIRTH_MONTHS.map((month) => (
								<option key={month.value} value={month.value}>
									{month.label}
								</option>
							))}
						</select>
					</div>
				</div>
			</fieldset>
			<div>
				<label htmlFor="wedding_anniversary" className={labelClass}>
					Anniversary
				</label>
				<input
					id="wedding_anniversary"
					name="wedding_anniversary"
					type="date"
					defaultValue={profile.wedding_anniversary ?? ''}
					className={inputClass}
				/>
			</div>
			<div>
				<label htmlFor="spouse_name" className={labelClass}>
					Spouse name
				</label>
				<input
					id="spouse_name"
					name="spouse_name"
					type="text"
					maxLength={PROFILE_SHORT_TEXT_MAX}
					defaultValue={profile.spouse_name ?? ''}
					className={inputClass}
				/>
			</div>
		</div>
	)
}
