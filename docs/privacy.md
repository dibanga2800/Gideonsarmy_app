# Privacy

This application stores member personal information and financial records for Gideon's Army Men's Fellowship, RCCG Living Water Parish, Stoke-on-Trent.

## Data minimisation

Collect only what the fellowship needs to operate:

- identity and contact details
- department, occupation, and address when provided
- birthday as day and month only, with no birth year
- wedding anniversaries when provided
- dues and payment confirmation records
- optional payment evidence
- an optional birthday portrait and a separate optional couple photo for signed-in approved members

## Display rules

- Do not store or show birth years
- Do not show another member's dues, phone number, or payment evidence
- Do not put bank secrets in frontend source or `NEXT_PUBLIC_*` variables
- Authenticated members may see official payment instructions
- This month's birthday brothers and wedding anniversaries are shown only to signed-in approved members, never on the public home page
- Birthday portraits and anniversary couple photos are stored in a private bucket. The app compresses them before storage and serves them to approved members through short-lived signed URLs. They are not included in emails or shown on the public home page.

A public privacy notice is available at `/privacy`.
