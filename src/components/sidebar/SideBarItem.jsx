import { NavLink } from "react-router-dom";
import { ChevronRight } from "lucide-react";

function SidebarItem({ to, icon: Icon, title, badge, collapsed = false }) {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <div
          className={`
            group
            relative
            flex
            items-center
            gap-3
            rounded-2xl
            px-4
            py-3
            transition-all
            duration-200
            ease-out
            cursor-pointer
            select-none
            ${
              isActive
                ? "bg-[#173B2F] text-white shadow-sm"
                : "text-[#3c6255] hover:bg-[#d8fff2] hover:text-slate-900 hover:translate-x-1"
            }
          `}
        >
          {/* Active Indicator */}
          <span
            className={`
              absolute
              left-0
              top-1/2
              h-8
              w-1
              -translate-y-1/2
              rounded-r-full
              bg-[#173B2F]
              transition-all
              ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"}
            `}
          />

          {/* Icon */}
          <Icon
            size={20}
            strokeWidth={2}
            className={`
              flex-shrink-0
              transition-transform
              duration-200
              ${isActive ? "scale-105" : "group-hover:scale-110"}
            `}
          />

          {/* Text */}
          {!collapsed && (
            <>
              <span className="flex-1 text-sm font-medium">{title}</span>

              {badge && (
                <span
                  className="
                    rounded-full
                    bg-indigo-600
                    px-2
                    py-0.5
                    text-[11px]
                    font-semibold
                    text-white
                  "
                >
                  {badge}
                </span>
              )}

              <ChevronRight
                size={16}
                className={`
                  transition-all
                  duration-200
                  ${
                    isActive
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                  }
                `}
              />
            </>
          )}
        </div>
      )}
    </NavLink>
  );
}

export default SidebarItem;
