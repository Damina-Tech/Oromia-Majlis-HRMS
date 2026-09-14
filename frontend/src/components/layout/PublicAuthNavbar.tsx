import { Link } from "react-router-dom";
import { ExternalLink, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

const PUBLIC_WEBSITE_URL =
  (import.meta.env.VITE_PUBLIC_WEBSITE_URL as string | undefined)?.trim() || "https://oriasc.org";

type PublicAuthNavbarProps = {
  /** Highlight Sign in when already on the login page */
  signInActive?: boolean;
};

export default function PublicAuthNavbar({ signInActive = false }: PublicAuthNavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-indigo-200/70 bg-white/90 backdrop-blur-md dark:border-indigo-900/50 dark:bg-slate-950/90">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="min-w-0 truncate text-sm font-semibold text-indigo-900 dark:text-indigo-100">
          ORIASC
        </Link>
        <nav className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" className="text-indigo-800 dark:text-indigo-200" asChild>
            <a href={PUBLIC_WEBSITE_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Visit website
            </a>
          </Button>
          <Button
            size="sm"
            variant={signInActive ? "default" : "outline"}
            className={
              signInActive
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "border-indigo-300 text-indigo-800 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-100"
            }
            asChild
          >
            <Link to="/login">
              <LogIn className="mr-1.5 h-4 w-4" />
              Sign in
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
