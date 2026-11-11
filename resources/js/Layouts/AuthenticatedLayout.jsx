import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';

export default function AuthenticatedLayout({ user, header, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { url, props } = usePage();
    const currentUser = props.auth?.user ?? user;
    // Utamakan role Spatie bila tersedia di shared props Inertia.
    const roles = (currentUser?.roles ?? []).map((role) =>
        typeof role === 'string' ? role : role.name
    );
    const currentRole = roles.includes('superadmin')
        ? 'superadmin'
        : roles.includes('admin_kemantren')
        ? 'admin_kemantren'
        : (currentUser?.role ?? 'kader');
    const canViewAnalytics = ['superadmin', 'admin_kemantren'].includes(currentRole);
    const isAnalyticsPage = url.startsWith('/analytics');
    const selectedModule = isAnalyticsPage
        ? new URLSearchParams(url.split('?')[1] ?? '').get('module') || 'bumil'
        : null;
    const [analyticsOpen, setAnalyticsOpen] = useState(isAnalyticsPage);
    const analyticsModules = [
        { key: 'catin', name: 'Catin' },
        { key: 'bumil', name: 'Bumil' },
        { key: 'bulin', name: 'Bulin' },
        { key: 'baduta', name: 'Baduta' },
    ];

    const getSidebarTitle = () => {
        if (currentRole === 'superadmin') return 'SuperAdmin TPK';
        if (currentRole === 'admin_kemantren') return 'Admin TPK';
        return 'Kader TPK';
    };

    const getUserRoleLabel = () => {
        if (currentRole === 'superadmin') return 'Pengelola Kota';
        if (currentRole === 'admin_kemantren') return 'Admin Kemantren';
        return 'Petugas TPK';
    };

    const navItems = [
        {
            name: 'Beranda',
            href: '/dashboard',
            active: url === '/dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            name: 'Catin',
            href: '/catin',
            active: url.startsWith('/catin'),
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
        },
        {
            name: 'Ibu Hamil',
            href: '/bumil',
            active: url.startsWith('/bumil'),
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
        },
        {
            name: 'Pasca Salin',
            href: '/bulin',
            active: url.startsWith('/bulin'),
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            name: 'Baduta/Balita',
            href: '/baduta',
            active: url.startsWith('/baduta'),
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
    ];

    if (currentRole === 'superadmin') {
        navItems.push({
            name: 'Manajemen Pengguna',
            href: '/users',
            active: url.startsWith('/users'),
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        });
    }

    return (
        /* LOCK VIEWPORT HEIGHT AGAR TIDAK SCROLL DI LEVEL BODY */
        <div className="h-screen w-screen bg-[#fff6f6] flex overflow-hidden">
            {/* BACKDROP MOBILE */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/40 md:hidden"
                ></div>
            )}

            {/* ================= SIDEBAR KIRI (PINNED / TIDAK IKUT TURUN) ================= */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r-2 border-[#8cc7c4]/60 flex flex-col justify-between h-full flex-shrink-0 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="p-6 border-b border-gray-100 flex-shrink-0">
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                            {getSidebarTitle()}
                        </h1>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                            Pemerintah Kota Yogyakarta
                        </p>
                    </div>

                    <nav className="p-4 space-y-1.5 overflow-y-auto min-h-0">
                        {navItems.map((item) => {
                            const isCurrent = item.active;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-150 ${
                                        isCurrent
                                            ? 'bg-[#EEF3FF] text-[#2c687b] border-l-4 border-brand-primary font-black'
                                            : 'text-gray-600 hover:bg-brand-secondary hover:text-brand-complement'
                                    }`}
                                >
                                    <span className={isCurrent ? 'text-brand-primary' : 'text-gray-400'}>
                                        {item.icon}
                                    </span>
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                        {canViewAnalytics && (
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => setAnalyticsOpen((open) => !open)}
                                    aria-expanded={analyticsOpen}
                                    className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-bold transition-colors ${
                                        isAnalyticsPage
                                            ? 'bg-[#EEF3FF] text-[#2c687b]'
                                            : 'bg-slate-50 text-gray-600 hover:bg-[#EEF3FF]'
                                    }`}
                                >
                                    <span>Analytics</span>
                                    <svg
                                        className={`h-4 w-4 transition-transform ${analyticsOpen ? 'rotate-180' : ''}`}
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                        aria-hidden="true"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                                    </svg>
                                </button>
                                {analyticsOpen && (
                                    <div className="space-y-1 bg-slate-50 px-3 py-2">
                                        {analyticsModules.map((module) => {
                                            const active = isAnalyticsPage && selectedModule === module.key;
                                            return (
                                                <Link
                                                    key={module.key}
                                                    href={`/analytics?module=${module.key}`}
                                                    onClick={() => setSidebarOpen(false)}
                                                    aria-current={active ? 'page' : undefined}
                                                    className={`block rounded-md px-5 py-2 text-sm transition-colors ${
                                                        active
                                                            ? 'bg-[#E0E7F8] font-bold text-[#2c687b]'
                                                            : 'text-slate-600 hover:bg-[#EEF3FF]'
                                                    }`}
                                                >
                                                    {module.name}
                                                </Link>
                                            );
                                        })}
                                        <span className="block cursor-not-allowed px-5 py-2 text-sm text-slate-400" title="Halaman Analytics Balita belum tersedia">
                                            Balita (belum tersedia)
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </nav>
                </div>

                <div className="p-4 border-t border-gray-100 space-y-1">
                    <Link
                        href="#"
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                    >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Pusat Bantuan</span>
                    </Link>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-brand-primary hover:bg-red-50 transition text-left"
                    >
                        <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Keluar</span>
                    </Link>
                </div>
            </aside>

            {/* ================= KONTEN KANAN (HANYA AREA INI YANG DAPAT DI-SCROLL) ================= */}
            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
                {/* TOPBAR FIXED DI ATAS KONTEN */}
                <header className="flex-shrink-0 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 z-30 shadow-sm">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 md:hidden"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <div className="hidden md:flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-brand-primary rounded-full"></span>
                        <span className="font-bold text-sm text-brand-complement uppercase tracking-wide">
                            SIM TPK KOTA YOGYAKARTA
                        </span>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button
                                    type="button"
                                    className="flex items-center gap-3 text-right hover:opacity-80 transition focus:outline-none"
                                >
                                    <div>
                                        <div className="text-sm font-black text-gray-900 leading-tight">
                                            {currentUser?.name || 'Petugas'}
                                        </div>
                                        <div className="text-[11px] font-semibold text-gray-400">
                                            {getUserRoleLabel()}
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-[#EEF3FF] border-2 border-[#8cc7c4] flex items-center justify-center text-brand-complement">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="right" width="48">
                                <Dropdown.Link href={route('profile.edit')}>Profil Akun</Dropdown.Link>
                                <Dropdown.Link href={route('logout')} method="post" as="button">
                                    Keluar
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                {/* AREA SCROLL INDEPENDEN */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}