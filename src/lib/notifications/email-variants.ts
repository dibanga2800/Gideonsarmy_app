export const pickVariant = <T>(variants: readonly T[], seed: string): T => {
	if (variants.length === 0) {
		throw new Error('email variant list must not be empty')
	}

	let hash = 2166136261

	for (let index = 0; index < seed.length; index += 1) {
		hash ^= seed.charCodeAt(index)
		hash = Math.imul(hash, 16777619)
	}

	return variants[(hash >>> 0) % variants.length]!
}

export interface BirthdayCelebrantVariant {
	subject: string
	heading: string
	preheader: (celebrationDay: string) => string
	opening: (celebrationDay: string) => string
	blessing: string
	closing: string
}

export interface BirthdayFellowshipVariant {
	subject: (celebrantName: string) => string
	heading: string
	preheader: (celebrantName: string) => string
	opening: (celebrantName: string, celebrationDay: string) => string
	callToAction: string
	closing: string
}

export interface AnniversaryCelebrantVariant {
	subject: string
	heading: string
	preheader: (celebrationDay: string) => string
	opening: (celebrationDay: string) => string
	blessing: (spouseName: string | null) => string
	closing: string
}

export interface AnniversaryFellowshipVariant {
	subject: (celebrantName: string) => string
	heading: string
	preheader: (celebrantName: string) => string
	opening: (celebrantName: string, celebrationDay: string) => string
	callToAction: string
	closing: string
}

export interface DuesReminderVariant {
	heading: string
	opening: string
	closing: string
}

export interface EventReminderVariant {
	closingLead: string
	closing: string
}

export const birthdayCelebrantVariants: readonly BirthdayCelebrantVariant[] = [
	{
		subject: "Birthday greetings from Gideon's Army",
		heading: 'Happy birthday, brother',
		preheader: (day) => `We give thanks to God for your life on ${day}.`,
		opening: (day) =>
			`On this ${day}, the brethren of Gideon's Army give thanks to God for your life.`,
		blessing:
			'May the Lord bless you and keep you; may He make His face shine upon you and be gracious to you in the year ahead. We celebrate the gift you are to this fellowship and to the body of Christ.',
		closing: 'With love in Christ,',
	},
	{
		subject: "Celebrating you today · Gideon's Army",
		heading: "Another year of God's faithfulness",
		preheader: (day) => `Happy birthday on ${day}. The fellowship rejoices with you.`,
		opening: (day) =>
			`As we mark ${day}, we pause to thank God for the blessing you are among the men of Gideon's Army.`,
		blessing:
			"May this new year of life be marked by wisdom, strength, and quiet joy in Christ. Know that your brothers stand with you in prayer and thanksgiving.",
		closing: 'Grace and peace to you,',
	},
	{
		subject: 'A birthday blessing from your brethren',
		heading: 'We rejoice in your life',
		preheader: (day) => `A warm birthday greeting for ${day} from Gideon's Army.`,
		opening: (day) =>
			`Dear brother, on ${day} we celebrate the life God has entrusted to you.`,
		blessing:
			"May the Lord renew your strength like the eagle's, guard your steps, and fill your home with His peace. You are deeply valued in this fellowship.",
		closing: 'With warm Christian affection,',
	},
	{
		subject: "Happy birthday from Gideon's Army",
		heading: 'Blessed birthday greetings',
		preheader: (day) => `The men of Gideon's Army celebrate you on ${day}.`,
		opening: (day) =>
			`On ${day} we join our hearts in gratitude for the brother you are to us.`,
		blessing:
			'May Christ go before you, beside you, and within you throughout the year ahead. May your faith deepen and your joy in the Lord abound.',
		closing: 'Yours in the fellowship of Christ,',
	},
	{
		subject: 'With thanksgiving on your birthday',
		heading: 'God has been good to you',
		preheader: (day) => `Thanksgiving and prayer for you on ${day}.`,
		opening: (day) =>
			`This ${day}, Gideon's Army lifts thanksgiving to God for the story He is writing in your life.`,
		blessing:
			'May every good gift from above continue to rest upon you. May you walk in health, purpose, and steadfast love for the Lord and for those He has placed around you.',
		closing: 'In His care,',
	},
]

export const birthdayFellowshipVariants: readonly BirthdayFellowshipVariant[] = [
	{
		subject: (name) => `Birthday celebration · ${name}`,
		heading: 'Celebrating a brother',
		preheader: (name) => `Join Gideon's Army in celebrating ${name} today.`,
		opening: (name, day) =>
			`Today, ${day}, we give thanks to God for our brother ${name} as he celebrates his birthday. We are grateful for his life and for the fellowship we share with him.`,
		callToAction:
			'Please join us in sending him warm birthday wishes and remembering him in your prayers as he begins another year.',
		closing: 'With warm regards in Christ,',
	},
]

export const anniversaryCelebrantVariants: readonly AnniversaryCelebrantVariant[] = [
	{
		subject: "Wedding anniversary greetings from Gideon's Army",
		heading: 'Happy wedding anniversary',
		preheader: (day) => `We rejoice with you in the covenant of marriage on ${day}.`,
		opening: (day) =>
			`On this ${day}, we rejoice with you in the covenant of marriage.`,
		blessing: (spouseName) => {
			const couple = spouseName ? `You and ${spouseName}` : 'You and your wife'
			return `${couple} are a testimony of God's faithfulness. May Christ remain the centre of your home, and may your love abound yet more and more.`
		},
		closing: 'With thanksgiving,',
	},
	{
		subject: "Celebrating your marriage · Gideon's Army",
		heading: 'A covenant worth honouring',
		preheader: (day) => `Anniversary blessings for ${day} from your brethren.`,
		opening: (day) =>
			`As you mark ${day}, the men of Gideon's Army celebrate God's goodness over your marriage.`,
		blessing: (spouseName) => {
			const couple = spouseName ? `You and ${spouseName}` : 'You and your wife'
			return `${couple} remind us that marriage is a gift and a calling. May the Lord renew your affection, deepen your unity, and keep your home under His covering.`
		},
		closing: 'With joy in Christ,',
	},
	{
		subject: 'Anniversary blessings from your brethren',
		heading: 'May your home continue to flourish',
		preheader: (day) => `Warm anniversary greetings for ${day}.`,
		opening: (day) =>
			`On ${day} we give thanks for the marriage God has entrusted to you.`,
		blessing: (spouseName) => {
			const couple = spouseName ? `you and ${spouseName}` : 'you and your wife'
			return `May ${couple} walk in patience, kindness, and steadfast love. May Christ be honoured at your table and in every season ahead.`
		},
		closing: 'Yours in Christian fellowship,',
	},
	{
		subject: "Happy anniversary from Gideon's Army",
		heading: 'God is faithful in every season',
		preheader: (day) => `We celebrate your wedding anniversary on ${day}.`,
		opening: (day) =>
			`This ${day}, we join you in celebrating the covenant of marriage.`,
		blessing: (spouseName) => {
			const couple = spouseName ? `You and ${spouseName}` : 'You and your wife'
			return `${couple} are precious to this fellowship. May the Lord strengthen your bond, guard your peace, and cause your home to be a place of prayer and welcome.`
		},
		closing: 'With warm regards in Christ,',
	},
	{
		subject: 'With joy on your wedding anniversary',
		heading: 'Rejoicing with you both',
		preheader: (day) => `Anniversary thanksgiving from Gideon's Army for ${day}.`,
		opening: (day) =>
			`Beloved brother, on ${day} we celebrate the gift of your marriage.`,
		blessing: (spouseName) => {
			const couple = spouseName ? `you and ${spouseName}` : 'you and your wife'
			return `We thank God that ${couple} continue to walk together. May His grace refresh your love and keep you rooted in Him.`
		},
		closing: 'In His goodness,',
	},
]

export const anniversaryFellowshipVariants: readonly AnniversaryFellowshipVariant[] = [
	{
		subject: (name) => `Wedding anniversary celebration · ${name}`,
		heading: 'Celebrating a marriage',
		preheader: (name) => `Join Gideon's Army in celebrating ${name} and his wife today.`,
		opening: (name, day) =>
			`Today, ${day}, we give thanks for our brother ${name} and his wife as they celebrate their wedding anniversary. We rejoice with them and give thanks for the commitment they share.`,
		callToAction:
			'Please join us in sending them warm congratulations and praying for continued love, unity and joy in their home.',
		closing: 'With warm regards in Christ,',
	},
]

export const duesReminderVariants: readonly DuesReminderVariant[] = [
	{
		heading: 'A gentle reminder about your fellowship dues',
		opening: 'Grace and peace to you in the name of our Lord Jesus Christ.',
		closing: 'The Lord bless you and keep you.',
	},
	{
		heading: 'Keeping fellowship dues in good order',
		opening: 'Beloved brother, grace and peace from our Lord Jesus Christ.',
		closing: 'Thank you for partnering with the fellowship in this way.',
	},
	{
		heading: 'A pastoral note on your dues',
		opening: 'We greet you warmly in the name of Jesus Christ our Lord.',
		closing: 'May the Lord prosper the work of your hands.',
	},
]

export const eventReminderVariants: readonly EventReminderVariant[] = [
	{
		closingLead:
			'We look forward to worshipping and praying together. You can view details and add the gathering to your calendar in the fellowship app.',
		closing: 'Grace and peace,',
	},
	{
		closingLead:
			'It will be a joy to gather. Please review the details in the fellowship app and, if you can, add the meeting to your calendar.',
		closing: 'We look forward to seeing you,',
	},
	{
		closingLead:
			'Come ready to pray and encourage one another. Full details and a calendar link are available in the fellowship app.',
		closing: 'In anticipation of our gathering,',
	},
]
