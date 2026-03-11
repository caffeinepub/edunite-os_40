import { Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";

interface HeaderProps {
  moduleName: string;
}

export default function Header({ moduleName }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border flex-shrink-0 gap-4">
      {/* Left: App name + module */}
      <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
        <h1 className="font-display font-semibold text-foreground text-lg whitespace-nowrap">
          EdUnite Academy
        </h1>
        <span className="text-muted-foreground">|</span>
        <span className="text-muted-foreground font-medium whitespace-nowrap">
          {moduleName}
        </span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ml-1"
          style={{ backgroundColor: "oklch(0.48 0.22 293)" }}
        >
          <User size={16} />
        </div>
      </div>
    </header>
  );
}
