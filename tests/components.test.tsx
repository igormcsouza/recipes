import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dict } from "@/lib/i18n";

const theme = { theme: "system", setTheme: vi.fn() };
let pathname = "/pt/receitas/fricasse-missionario/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("next-themes", () => ({ useTheme: () => theme }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { CopyButton } from "@/components/copy-button";
import { IngredientList } from "@/components/ingredient-list";
import { PrintButton } from "@/components/print-button";
import { RootRedirect } from "@/components/root-redirect";
import { SettingsMenu } from "@/components/settings-menu";
import { ShareBar } from "@/components/share-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { routeTable } from "@/lib/recipes";

afterEach(() => vi.restoreAllMocks());

describe("CopyButton", () => {
  it("copies, shows feedback, then resets", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<CopyButton text={"1. a\n2. b"} label="Copy" copiedLabel="Copied" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Copied"));
    expect(writeText).toHaveBeenCalledWith("1. a\n2. b");
    vi.advanceTimersByTime(1600);
    await waitFor(() => expect(screen.getByRole("status")).toBeEmptyDOMElement());
    vi.useRealTimers();
  });
  it("shows the link icon variant", () => {
    const { container } = render(<CopyButton text="x" label="Copy link" copiedLabel="Copied" link />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
  it("keeps an accessible name and stays quiet when clipboard fails", async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("no")) } });
    render(<CopyButton text="x" label="Copy list" copiedLabel="Copied" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy list" }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});

describe("PrintButton", () => {
  it("prints", () => {
    const print = vi.fn();
    vi.stubGlobal("print", print);
    render(<PrintButton label="Print" />);
    fireEvent.click(screen.getByRole("button", { name: "Print" }));
    expect(print).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe("IngredientList", () => {
  it("ticks and unticks an ingredient", () => {
    render(<IngredientList items={[{ text: "Chicken", note: "shredded" }, { text: "Corn" }]} />);
    const chicken = screen.getByRole("button", { name: /Chicken/ });
    expect(chicken).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("shredded")).toBeInTheDocument();
    fireEvent.click(chicken);
    expect(chicken).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Corn/ })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(chicken);
    expect(chicken).toHaveAttribute("aria-pressed", "false");
  });
});

describe("SettingsMenu", () => {
  const props = { lang: "pt" as const, routes: routeTable(), t: dict.pt };
  const open = () => fireEvent.click(screen.getByRole("button", { name: "Ajustes" }));
  beforeEach(() => {
    theme.setTheme.mockClear();
    theme.theme = "system";
    pathname = "/pt/receitas/fricasse-missionario/";
  });

  it("is a modal dialog, hidden until the gear is pressed", () => {
    render(<SettingsMenu {...props} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    open();
    expect(screen.getByRole("dialog", { name: "Ajustes" })).toBeInTheDocument();
  });
  it("links to the same page in other languages and sets the cookie", () => {
    render(<SettingsMenu {...props} />);
    open();
    const en = screen.getByRole("link", { name: "EN" });
    expect(en).toHaveAttribute("href", "/en/recipes/missionary-fricassee/");
    expect(screen.getByRole("link", { name: "PT" })).toHaveAttribute("aria-current", "true");
    fireEvent.click(en);
    expect(document.cookie).toContain("lang=en");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("changes theme and shows the active one", () => {
    render(<SettingsMenu {...props} />);
    open();
    expect(screen.getByRole("button", { name: "Sistema" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Escuro" }));
    expect(theme.setTheme).toHaveBeenCalledWith("dark");
  });
  it("closes with the X button and on a backdrop click, but not on clicks inside", () => {
    render(<SettingsMenu {...props} />);
    open();
    fireEvent.click(screen.getByText("Idioma"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    open();
    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("RootRedirect", () => {
  const run = (cookie: string, languages: string[]) => {
    const replace = vi.fn();
    vi.stubGlobal("location", { replace });
    Object.defineProperty(navigator, "languages", { value: languages, configurable: true });
    document.cookie = cookie;
    render(<RootRedirect />);
    vi.unstubAllGlobals();
    return replace;
  };
  it("uses the saved language first", () => expect(run("lang=fr;path=/", ["pt-BR"])).toHaveBeenCalledWith("/fr/"));
  it("ignores an invalid cookie and uses the browser", () => expect(run("lang=xx;path=/", ["pt-BR", "en"])).toHaveBeenCalledWith("/pt/"));
  it("falls back to the browser when there is no cookie", () => {
    document.cookie = "lang=;path=/;max-age=0";
    expect(run("", ["de"])).toHaveBeenCalledWith("/en/");
  });
});

describe("server-rendered pieces", () => {
  it("renders header, footer and share bar in French", () => {
    pathname = "/fr/";
    render(
      <>
        <SiteHeader lang="fr" />
        <SiteFooter lang="fr" />
        <ShareBar url="https://x.test/a" title="T" image="https://x.test/i.jpg" t={dict.fr} />
      </>,
    );
    expect(screen.getByRole("link", { name: /Recettes d'Igor Souza/ })).toHaveAttribute("href", "/fr/");
    expect(screen.getAllByRole("link", { name: "RSS" })[0]).toHaveAttribute("href", "/fr/rss.xml");
    expect(screen.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("button", { name: "Copier le lien" })).toBeInTheDocument();
  });
});
