import type { Metadata } from "next";
import { Title } from "@/components/ui";

export const metadata: Metadata = { title: "Rules & guidelines" };

// Optional: link to the waiver form. Set WAIVER_URL in .env.local to show a button.
const WAIVER_URL = process.env.WAIVER_URL;

const FACTS = [
  { label: "Games", value: "Sundays, 2-6pm" },
  { label: "Where", value: "Corona Friends Church" },
  { label: "Roster cap", value: "48 players" },
];

const SECTIONS = [
  {
    title: "Community and teams",
    items: [
      "This is not just a basketball league. By participating, you are expected to help out and build community it’s not just about coming to play for 40 minutes and then leaving every week",
      "Everyone will be drafted to a team, and you may elect to be paired with up to 1 friend/family member",
    ],
  },
  {
    title: "Conduct and suspensions",
    items: [
      "We have a zero tolerance policy for any unsportsmanlike behavior (including but not limited to: aggressive behavior, excessive profanity, arguing with referees, etc.)",
      "Suspensions will be issued at the discretion of the league commissioner and team captains and are effective immediately",
      "Players who get suspended will forfeit their league fees",
      "Suspensions cannot be appealed, but players may petition to rejoin the league the following season",
    ],
  },
  {
    title: "Games and sign-up",
    items: [
      "Games are held on Sundays from 2-6pm at Corona Friends Church",
      "We cap our league to the first 48 players who sign up, any players who sign up after will be placed on a waitlist",
    ],
  },
  {
    title: "Fees",
    items: [
      "League fees will be charged per person each season depending on our player count, gym costs, and referee fees",
      "All fees go 100% toward gym rental rate, ref fees, insurance and other league related costs.",
    ],
  },
];

export default function RulesPage() {
  return (
    <>
      <Title>Rules &amp; guidelines</Title>

      <dl className="mb-12 mt-6 flex flex-wrap gap-x-12 gap-y-4">
        {FACTS.map((f) => (
          <div key={f.label}>
            <dt className="text-slate-600">{f.label}</dt>
            <dd className="font-display text-3xl font-bold text-blue-900">{f.value}</dd>
          </div>
        ))}
      </dl>

      <section className="grid gap-x-12 gap-y-4 border-t border-slate-300 py-8 md:grid-cols-[15rem_1fr]">
        <h2 className="font-display text-3xl font-bold text-blue-900">Player conduct</h2>
        <div className="max-w-prose">
          <p>Please make sure to sign the Waiver and Player Conduct Agreement each season{WAIVER_URL ? ":" : "."}</p>
          {WAIVER_URL && (
            <a
              href={WAIVER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
            >
              Sign the waiver
            </a>
          )}
        </div>
      </section>

      <h2 className="sr-only">Notes about our league</h2>
      {SECTIONS.map((s) => (
        <section key={s.title} className="grid gap-x-12 gap-y-4 border-t border-slate-300 py-8 md:grid-cols-[15rem_1fr]">
          <h3 className="font-display text-3xl font-bold text-blue-900">{s.title}</h3>
          <ul className="max-w-prose list-disc space-y-4 pl-5 marker:text-red-600">
            {s.items.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
