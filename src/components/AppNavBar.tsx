import { NavLink, useLocation } from "react-router-dom";
import { APP_NAV, type NavItem } from "../data/appConfig";
import aosxlogo from "../assets/aosxlogo.png"

function cx(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function groupActive(pathname: string, group: { items: { to: string }[] }) {
  return group.items.some(
    (x) => pathname === x.to || pathname.startsWith(x.to.replace(/\/start$/, ""))
  );
}

export function AppNavBar(props: {
  isLoggedIn: boolean;
  onLogoutClick: () => void;
}) {
  const { pathname } = useLocation();

  return (
    <div className="navbar">
      <div className="navbar_inner">
        <div className="navbar_brand">
          <img src={aosxlogo} alt="A" className="brand_logo" />
          <div className="brand_text">
            <div className="brand_title">AOSX School</div>
            <div className="brand_subtitle">Game Hub</div>
          </div>
        </div>

        <div className="navbar_links">
          {APP_NAV.map((item: NavItem) => {
            if (item.type === "link") {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cx("navlink", isActive && "navlink-active")
                  }
                >
                  {item.label}
                </NavLink>
              );
            }

            const active = groupActive(pathname, item);

            return (
              <div className="dropdown" key={item.label}>
                <div
                  className={cx(
                    "navlink",
                    "dropdown_trigger",
                    active && "navlink-active"
                  )}
                >
                  {item.label} <span className="chev">▾</span>
                </div>

                <div className="dropdown_panel">
                  {item.items.map((x) => (
                    <NavLink
                      key={x.to}
                      to={x.to}
                      className={({ isActive }) =>
                        cx("dropdown_item", isActive && "dropdown_item-active")
                      }
                    >
                      {x.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="navbar_right">
          {props.isLoggedIn && (
            <button className="btn-pill" onClick={props.onLogoutClick}>
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
