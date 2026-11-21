import Link from "next/link";
import { RootRedirect } from "@/components/root-redirect";
import { LANGS } from "@/lib/i18n";

export default function Root() {
  return (
    <main className="p-6">
      <RootRedirect />
      <noscript>
        <ul>
          {LANGS.map((l) => (
            <li key={l}>
              <Link href={`/${l}/`}>{l.toUpperCase()}</Link>
            </li>
          ))}
        </ul>
      </noscript>
    </main>
  );
}
