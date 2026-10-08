"use client";

import CardNav from "./CardNav";
import { StaggeredMenu } from "./StaggeredMenu";
import { Moon, Sun } from "lucide-react";

type RouteKey = "/" | "/about" | "/components" | "/resources" | "/architecture" | "/database";

const CARD_NAV_ITEMS = [
  {
    label: "Project",
    bgColor: "#1b2117",
    textColor: "#DBFF5C",
    links: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
    ],
  },
  {
    label: "Explore",
    bgColor: "#161b13",
    textColor: "#DBFF5C",
    links: [
      { label: "Dashboard Demo", href: "/components" },
      { label: "NoSQL Database", href: "/database" },
      { label: "Architecture", href: "/architecture" },
    ],
  },
  {
    label: "Research",
    bgColor: "#11140f",
    textColor: "#DBFF5C",
    links: [
      { label: "References", href: "/resources" },
    ],
  },
];

const MOBILE_MENU_ITEMS = [
  { label: "Home", link: "/" },
  { label: "About the Project", link: "/about" },
  { label: "Dashboard Demo", link: "/components" },
  { label: "NoSQL Database (CRUD/Index/Agg)", link: "/database" },
  { label: "Architecture", link: "/architecture" },
  { label: "References", link: "/resources" },
];

export default function NavShell({
  theme,
  onToggleTheme,
  navigate,
}: {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  navigate: (route: RouteKey) => void;
}) {
  const isLightMode = theme === "light";

  const ThemeToggleBtn = (
    <button
      onClick={onToggleTheme}
      aria-label="Toggle theme"
      style={{
        color: isLightMode ? "#111318" : "#DBFF5C",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px",
        borderRadius: "50%",
      }}
    >
      {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );

  return (
    <>
      {/* Desktop: GSAP floating CardNav from SafeCut */}
      <div className="hidden md:block">
        <CardNav
          logoText="CollabGuard"
          items={CARD_NAV_ITEMS.map((item) => ({
            ...item,
            bgColor: isLightMode ? "#F0F0F0" : item.bgColor,
            textColor: isLightMode ? "#111318" : item.textColor,
          }))}
          baseColor={isLightMode ? "#F5F5F0" : "#11140f"}
          menuColor={isLightMode ? "#111318" : "#DBFF5C"}
          buttonBgColor="#DBFF5C"
          buttonTextColor="#11140f"
          ease="power3.out"
          themeToggle={ThemeToggleBtn}
        />
      </div>

      {/* Mobile: StaggeredMenu from SafeCut */}
      <div className="md:hidden">
        <div
          style={{
            position: "fixed",
            top: "1.5rem",
            left: "1.5rem",
            zIndex: 50,
          }}
        >
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            style={{
              color: isLightMode ? "#111318" : "#DBFF5C",
              background: isLightMode ? "rgba(0,0,0,0.06)" : "rgba(219,255,92,0.08)",
              border: `1px solid ${isLightMode ? "rgba(0,0,0,0.12)" : "rgba(219,255,92,0.2)"}`,
              borderRadius: "50%",
              display: "flex",
              padding: "8px",
              cursor: "pointer",
            }}
          >
            {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        <StaggeredMenu
          items={MOBILE_MENU_ITEMS}
          position="right"
          isFixed={true}
          menuButtonColor={isLightMode ? "#111318" : "#DBFF5C"}
          openMenuButtonColor={isLightMode ? "#111318" : "#F5F5F0"}
          accentColor="#DBFF5C"
          displaySocials={false}
          displayItemNumbering={true}
          changeMenuColorOnOpen={true}
          closeOnClickAway={true}
        />
      </div>
    </>
  );
}
