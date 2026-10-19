import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { visibleNav } from './adminNav';

interface NavTab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number | string;
}

interface LayoutProps {
  title?: string;
  subtitle?: string;
  /** Staff portal only — the admin portal menu comes from adminNav.ts. */
  tabs?: NavTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  /** Admin portal: counts shown next to nav items, keyed by nav item id. */
  badges?: Record<string, number>;
  children: ReactNode;
}

// A simple SVG icon helper for the sidebar
function Icon({ name }: { name: string }) {
  switch (name) {
    case 'home':
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
    case 'setup':
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    case 'users':
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
    case 'transfer':
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
    case 'news':
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>;
    case 'reports':
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    case 'overview':
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 13h6V4H4v9zm10 7h6V4h-6v16zM4 20h6v-3H4v3z" /></svg>;
    case 'map':
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3zm0 0V3m6 15V6" /></svg>;
    case 'visits':
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21s7-4.35 7-11a7 7 0 10-14 0c0 6.65 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" strokeWidth={2} /></svg>;
    case 'attendance':
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3v4m10-4v4M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zm3 8h3m-3 4h6" /></svg>;
    case 'leaves':
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" /></svg>;
    case 'roles':
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3zm-3 9l2 2 4-4" /></svg>;
    case 'settings':
      return <Icon name="setup" />;
    case 'globe':
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9s1.3-6.5 3.8-9z" /></svg>;
    case 'building':
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16m0-11h4a1 1 0 011 1v10M3 21h18M8 8h3m-3 4h3m-3 4h3" /></svg>;
    case 'id':
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" strokeWidth={2} /><circle cx="9" cy="11" r="2" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 16c.5-1.5 1.7-2 3-2s2.5.5 3 2m3-6h3m-3 3h3" /></svg>;
    case 'drop':
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z" /></svg>;
    case 'key':
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="8" cy="15" r="4" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 12l9-9m-4 4l3 3m-6 0l2 2" /></svg>;
    case 'logout':
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
    default:
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
  }
}

function tabIcon(tab: NavTab): ReactNode {
  if (tab.id === 'overview') return <Icon name="home" />;
  if (typeof tab.icon === 'string') return <Icon name={tab.icon} />;
  if (tab.icon) return tab.icon;
  return <Icon name={tab.id} />;
}

interface FloatingTooltipState {
  label: string;
  badge?: number | string;
  top: number;
  left: number;
}

/** Collapsible desktop sidebar (Admin/Manager command-center look), with an off-canvas drawer below 1024px. */
function AdminShell({ title, subtitle, badges, children }: LayoutProps) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [closedGroups, setClosedGroups] = useState<string[]>([]);
  const toggleGroup = (id: string) =>
    setClosedGroups((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));

  const [mobileOpen, setMobileOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('admin_sidebar_collapsed', String(next));
      } catch {
        // storage unavailable (private browsing) — collapse state just won't persist
      }
      return next;
    });
  };

  const [floatingTooltip, setFloatingTooltip] = useState<FloatingTooltipState | null>(null);

  const fullName = user?.full_name || user?.username || 'Administrator';
  const designation = user?.profile?.designation || (user?.role === 'ADMIN' ? 'System Administrator' : 'Manager');
  const department = user?.profile?.department || 'IT Division (GNFC)';

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    nav('/login', { replace: true });
  };

  const navGroups = visibleNav(user);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
        hamburgerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const showTooltip = (e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>, label: string, badge?: number | string) => {
    if (!collapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setFloatingTooltip({ label, badge, top: rect.top + rect.height / 2, left: rect.right + 12 });
  };
  const hideTooltip = () => setFloatingTooltip(null);

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white box-border overflow-x-hidden">
      {mobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close navigation menu"
          onClick={() => {
            setMobileOpen(false);
            hamburgerRef.current?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter') {
              setMobileOpen(false);
              hamburgerRef.current?.focus();
            }
          }}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#1e293b] text-white flex flex-col h-screen box-border overflow-x-hidden border-r border-slate-700/60 shadow-xl transition-[width,transform] duration-300 ease-in-out will-change-[width,transform] ${
          mobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full w-[280px]'
        } lg:translate-x-0 lg:static lg:h-screen lg:shrink-0 ${collapsed ? 'lg:w-[72px]' : 'lg:w-[272px]'}`}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-slate-700/60 bg-[#0f172a]/70 box-border">
          {collapsed ? (
            <div className="flex flex-col items-center justify-center w-full py-3 gap-2">
              <button
                type="button"
                onClick={() => nav('/admin')}
                aria-label="Ncode Command Center"
                onMouseEnter={(e) => showTooltip(e, 'Ncode Command Center')}
                onMouseLeave={hideTooltip}
                onFocus={(e) => showTooltip(e, 'Ncode Command Center')}
                onBlur={hideTooltip}
                className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-base shadow shrink-0 hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                (n)
              </button>
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="Expand sidebar"
                aria-expanded="false"
                onMouseEnter={(e) => showTooltip(e, 'Expand Sidebar')}
                onMouseLeave={hideTooltip}
                onFocus={(e) => showTooltip(e, 'Expand Sidebar')}
                onBlur={hideTooltip}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                title="Expand sidebar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </button>
            </div>
          ) : (
            <div className="h-16 flex items-center justify-between px-4 w-full box-border">
              <button type="button" onClick={() => nav('/admin')} className="flex items-center gap-3 overflow-hidden min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-base shadow shrink-0">(n)</div>
                <div className="flex flex-col min-w-0 text-left">
                  <span className="font-bold text-sm tracking-wide text-white leading-tight truncate">Ncode IT Division</span>
                  <span className="text-[10px] text-blue-400 font-medium tracking-wider uppercase truncate">Command Center</span>
                </div>
              </button>

              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="Collapse sidebar"
                aria-expanded="true"
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 ml-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                title="Collapse sidebar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  hamburgerRef.current?.focus();
                }}
                aria-label="Close navigation menu"
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 ml-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav aria-label="Admin" className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2.5 space-y-1.5 box-border">
          {navGroups.map((group, gi) => {
            const open = collapsed || !group.label || !closedGroups.includes(group.id);
            return (
              <div key={group.id} className="space-y-1.5">
                {group.label && !collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={open}
                    className={`w-full flex items-center justify-between px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 focus:outline-none focus:text-slate-300 ${gi > 0 ? 'pt-3' : 'pt-1'}`}
                  >
                    <span className="truncate">{group.label}</span>
                    <svg className={`w-3 h-3 shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                )}
                {(collapsed || !group.label) && gi > 0 && <div className="mx-2 my-2 border-t border-slate-700/60" aria-hidden="true" />}
                {open && group.items.map((tab) => {
                  const isActive = pathname === tab.route || pathname.startsWith(`${tab.route}/`);
                  const badge = badges?.[tab.id];
                  const badgeDisplay = badge ? (badge > 99 ? '99+' : String(badge)) : null;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        nav(tab.route);
                        setMobileOpen(false);
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      onMouseEnter={(e) => showTooltip(e, tab.label, badgeDisplay || undefined)}
                      onMouseLeave={hideTooltip}
                      onFocus={(e) => showTooltip(e, tab.label, badgeDisplay || undefined)}
                      onBlur={hideTooltip}
                      title={!collapsed ? tab.label : undefined}
                      className={`relative flex items-center h-11 rounded-xl font-medium text-sm transition-all box-border w-full group focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 focus:ring-offset-slate-900 ${
                        collapsed ? 'justify-center px-0' : 'gap-3 px-3'
                      } ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'}`}
                    >
                      <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                        <Icon name={tab.icon} />
                        {collapsed && badgeDisplay && (
                          <span
                            aria-hidden="true"
                            className={`absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-md pointer-events-none ${
                              isActive ? 'bg-white text-blue-700' : 'bg-blue-500 text-white'
                            }`}
                          >
                            {badgeDisplay}
                          </span>
                        )}
                      </div>

                      {collapsed ? (
                        <span className="sr-only">{tab.label} {badgeDisplay ? `(${badgeDisplay})` : ''}</span>
                      ) : (
                        <>
                          <span className="truncate min-w-0 flex-1 text-left">{tab.label}</span>
                          {badgeDisplay && (
                            <span
                              className={`ml-auto px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                                isActive ? 'bg-white text-blue-700' : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                              }`}
                            >
                              {badgeDisplay}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer: user card + sign out */}
        <div className="shrink-0 border-t border-slate-700/60 bg-[#0f172a]/50 p-2.5 box-border">
          {collapsed ? (
            <div className="flex flex-col items-center justify-center gap-2.5 w-full">
              <div
                tabIndex={0}
                aria-label={`Logged in as ${fullName}, ${designation}`}
                onMouseEnter={(e) => showTooltip(e, `${fullName} (${designation})`)}
                onMouseLeave={hideTooltip}
                onFocus={(e) => showTooltip(e, `${fullName} (${designation})`)}
                onBlur={hideTooltip}
                className="w-10 h-10 rounded-full bg-slate-700 text-blue-400 font-bold flex items-center justify-center text-sm border border-slate-600 shrink-0 cursor-default focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {fullName.charAt(0).toUpperCase()}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out"
                onMouseEnter={(e) => showTooltip(e, 'Sign Out')}
                onMouseLeave={hideTooltip}
                onFocus={(e) => showTooltip(e, 'Sign Out')}
                onBlur={hideTooltip}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-rose-300 hover:text-white hover:bg-rose-600/20 border border-rose-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400"
                title="Sign Out"
              >
                <Icon name="logout" />
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 w-full box-border">
              <div className="px-1.5 flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-slate-700 text-blue-400 font-bold flex items-center justify-center text-sm border border-slate-600 shrink-0">
                  {fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{fullName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{designation}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out of administration"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-600/20 border border-rose-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                <Icon name="logout" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Floating tooltip (collapsed sidebar only) */}
      {collapsed &&
        floatingTooltip &&
        createPortal(
          <div
            style={{ position: 'fixed', top: floatingTooltip.top, left: floatingTooltip.left, transform: 'translateY(-50%)' }}
            className="z-[9999] px-2.5 py-1.5 bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold rounded-lg shadow-2xl border border-slate-700/80 pointer-events-none flex items-center gap-2 whitespace-nowrap"
          >
            <span>{floatingTooltip.label}</span>
            {floatingTooltip.badge && <span className="bg-blue-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">{floatingTooltip.badge}</span>}
          </div>,
          document.body,
        )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-x-hidden box-border">
        <header className="h-16 bg-white border-b border-slate-200 z-30 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm box-border">
          <div className="flex items-center gap-3 min-w-0">
            <button
              ref={hamburgerRef}
              type="button"
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">{title || 'Command Center'}</h1>
              {subtitle && <p className="text-xs text-slate-500 truncate hidden sm:block">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 truncate">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span className="truncate">{department}</span>
            </span>
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                {fullName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-6 box-border min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Mobile-first bottom app nav (Staff/Field Officer portal — also used by the native app). */
function StaffShell({ title, subtitle, tabs, activeTab, onTabChange, children }: LayoutProps) {
  const { user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const employeeId = user?.profile?.employee_id || user?.username || '';
  const fullName = user?.full_name || user?.username || 'Field Officer';
  const designation = user?.profile?.designation || 'Field Officer';

  const defaultTabs = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'setup', label: 'Setup', icon: 'setup' },
    { id: 'users', label: 'User Management', icon: 'users' },
    { id: 'transfer', label: 'Transfer', icon: 'transfer' },
    { id: 'news', label: 'News', icon: 'news' },
    { id: 'reports', label: 'Reports', icon: 'reports' },
  ];

  const sidebarTabs = tabs && tabs.length > 0 ? tabs : defaultTabs;
  const bottomTabs = sidebarTabs.filter((tab) => !['users', 'leaves'].includes(tab.id));

  const selectTab = (tabId: string) => {
    onTabChange?.(tabId);
    if (tabId === 'home') nav('/');
  };

  return (
    <div className="min-h-screen bg-[#e8e9eb] flex font-sans text-slate-800">
      {/* Bottom app navigation */}
      <aside className="fixed inset-x-0 bottom-0 z-40 h-16 bg-[#2c3136] text-white border-t border-slate-700 shadow-[0_-4px_12px_rgba(0,0,0,0.12)]">
        <div className="h-full w-full overflow-x-auto px-2 flex items-stretch justify-start gap-1">
          {bottomTabs.map((tab) => {
            const isActive = activeTab === tab.id || (tab.id === 'home' && location.pathname === '/');
            return (
              <button
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                title={tab.label}
                className={`flex-1 min-w-14 h-full rounded-lg flex flex-col items-center justify-center px-1.5 transition-colors ${
                  isActive ? 'bg-[#00a29a] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">{tabIcon(tab)}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden pb-16">
        <header className="h-16 bg-white shadow-sm z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border border-blue-200 bg-blue-50 flex items-center justify-center">
                 <span className="text-blue-600 font-bold text-sm">(n)</span>
              </div>
              <h1 className="text-sm font-bold text-[#0088ff]">Ncode Staff Portal</h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative cursor-pointer">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">0</span>
            </div>

            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100"
                title={fullName}
              >
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-700 uppercase leading-none">{fullName}</div>
                <div className="text-[10px] text-slate-400 uppercase mt-1">{designation}</div>
              </div>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-24">
          {(title || subtitle) && (
             <div className="mb-6 flex items-center justify-between">
                <div>
                  {title && <h2 className="text-2xl font-semibold text-slate-800">{title}</h2>}
                  {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
                </div>
             </div>
          )}
          {children}

          <div className="mt-12 pt-4 border-t border-slate-300 text-center text-xs text-slate-400">
             Design & Developed by © {new Date().getFullYear()} (n)Code Solutions
          </div>
           <div className="h-24 shrink-0" aria-hidden="true" />
        </main>
      </div>
    </div>
  );
}

export default function Layout(props: LayoutProps) {
  const { user } = useAuth();
  const isAdminPortal = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  return isAdminPortal ? <AdminShell {...props} /> : <StaffShell {...props} />;
}
