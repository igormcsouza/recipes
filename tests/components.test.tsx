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
import { IngredientIcon } from "@/components/ingredient-icon";
import { PrintButton } from "@/components/print-button";
import { RootRedirect } from "@/components/root-redirect";
import { SettingsMenu } from "@/components/settings-menu";
import { ShareBar } from "@/components/share-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toc } from "@/components/toc";
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
  it("icon-only keeps an accessible name and stays quiet when clipboard fails", async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("no")) } });
    render(<CopyButton text="x" label="Copy list" copiedLabel="Copied" iconOnly />);
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

describe("IngredientIcon", () => {
  it("renders known and unknown icons", () => {
    const { container } = render(
      <>
        <IngredientIcon name="drumstick" />
        <IngredientIcon name="nope" />
      </>,
    );
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });
});

describe("SettingsMenu", () => {
  const t = dict.pt;
  const props = { lang: "pt" as const, routes: routeTable(), t };
  beforeEach(() => {
    theme.setTheme.mockClear();
    theme.theme = "system";
    pathname = "/pt/receitas/fricasse-missionario/";
  });

  it("opens, links to the same page in other languages, sets cookie", () => {
    render(<SettingsMenu {...props} />);
    const gear = screen.getByRole("button", { name: "Ajustes" });
    expect(gear).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(gear);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    const en = screen.getByRole("link", { name: "EN" });
    expect(en).toHaveAttribute("href", "/en/recipes/missionary-fricassee/");
    expect(screen.getByRole("link", { name: "PT" })).toHaveAttribute("aria-current", "true");
    fireEvent.click(en);
    expect(document.cookie).toContain("lang=en");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("changes theme and shows the active one", () => {
    render(<SettingsMenu {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Ajustes" }));
    expect(screen.getByRole("button", { name: "Sistema" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Escuro" }));
    expect(theme.setTheme).toHaveBeenCalledWith("dark");
  });
  it("closes on Escape and on outside click, ignores other keys and inside clicks", () => {
    render(<SettingsMenu {...props} />);
    const gear = screen.getByRole("button", { name: "Ajustes" });
    fireEvent.click(gear);
    fireEvent.keyDown(document, { key: "a" });
    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(gear);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("toggles closed with the button", () => {
    render(<SettingsMenu {...props} />);
    const gear = screen.getByRole("button", { name: "Ajustes" });
    fireEvent.click(gear);
    fireEvent.click(gear);
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
  it("renders header, footer, toc and share bar in French", () => {
    pathname = "/fr/";
    render(
      <>
        <SiteHeader lang="fr" />
        <SiteFooter lang="fr" />
        <Toc lang="fr" />
        <ShareBar url="https://x.test/a" title="T" image="https://x.test/i.jpg" t={dict.fr} />
      </>,
    );
    expect(screen.getByRole("link", { name: /Recettes d'Igor Souza/ })).toHaveAttribute("href", "/fr/");
    expect(screen.getAllByRole("link", { name: "RSS" })[0]).toHaveAttribute("href", "/fr/rss.xml");
    expect(screen.getByRole("link", { name: "Ingrédients" })).toHaveAttribute("href", "#ingredients");
    expect(screen.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("button", { name: "Copier le lien" })).toBeInTheDocument();
  });
});
