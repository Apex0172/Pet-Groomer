import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="bg-background text-on-surface min-h-screen">
      <header className="docked full-width top-0 sticky z-50 bg-surface-container-lowest/90 dark:bg-inverse-surface/90 backdrop-blur-md border-b border-outline-variant/30 dark:border-outline-variant/10 shadow-sm dark:shadow-none">
<div className="max-w-7xl mx-auto px-space-md md:px-margin h-16 flex items-center justify-between w-full">

<Link className="text-headline-sm font-headline-sm font-bold text-on-surface dark:text-inverse-on-surface flex items-center gap-2" to="/">
<span className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
<span className="material-symbols-outlined text-xl" data-icon="pets">pets</span>
</span>
<span>GroomFlow</span>
</Link>

<nav className="hidden md:flex items-center gap-6">
<a className="text-label-md font-label-md text-secondary dark:text-secondary-fixed-dim hover:text-on-surface dark:hover:text-inverse-on-surface transition-colors" href="#features">Features</a>
<a className="text-label-md font-label-md text-secondary dark:text-secondary-fixed-dim hover:text-on-surface dark:hover:text-inverse-on-surface transition-colors" href="#route-optimization">Route Optimization</a>
<a className="text-label-md font-label-md text-secondary dark:text-secondary-fixed-dim hover:text-on-surface dark:hover:text-inverse-on-surface transition-colors" href="#pricing">Pricing</a>
<a className="text-label-md font-label-md text-secondary dark:text-secondary-fixed-dim hover:text-on-surface dark:hover:text-inverse-on-surface transition-colors" href="#testimonials">Reviews</a>
</nav>

<div className="flex items-center gap-3">
<Link className="hidden sm:inline-flex text-label-md font-label-md text-secondary hover:text-on-surface transition-colors py-2 px-3" to="/admin">
          Sign In
        </Link>
<Link className="inline-flex items-center justify-center bg-primary hover:bg-primary-container text-on-primary text-label-md font-label-md font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98]" to="/admin">
          Start Free Trial
        </Link>
</div>
</div>
</header>
<main>

<section className="relative pt-16 pb-20 md:pt-28 md:pb-32 overflow-hidden">

{/* Animated gradient mesh background */}
<div className="absolute inset-0 -z-10 overflow-hidden">
  <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
  <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-fixed/20 rounded-full blur-[100px]"></div>
  <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-tertiary-fixed/10 rounded-full blur-[80px]"></div>
  {/* Dot grid pattern */}
  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #0b1c30 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
</div>

<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

    {/* Left Column: Text Content */}
    <div className="max-w-xl">
      {/* Micro pill badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 mb-8">
        <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
        <span className="text-sm font-semibold text-primary tracking-tight">&star; Built for Independent &amp; Mobile Groomers</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-on-surface leading-[1.1] tracking-tight mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        Stop Losing Revenue to
        <span className="relative inline-block ml-2">
          <span className="relative z-10">No-Shows</span>
          <span className="absolute bottom-1 left-0 right-0 h-3 bg-primary/20 -z-0 rounded-sm"></span>
        </span>
      </h1>

      {/* Subheadline */}
      <p className="text-lg text-secondary leading-relaxed mb-10 max-w-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
        Automated client self-booking, smart GPS travel buffers for mobile vans, upfront deposits, and digital health waivers &mdash; in one effortless system.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
        <Link className="inline-flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-container text-on-primary font-semibold px-8 py-4 rounded-xl shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98] text-base" to="/admin">
          <span>Start 14-Day Free Trial</span>
          <span className="material-symbols-outlined text-lg" data-icon="arrow_forward">arrow_forward</span>
        </Link>
        <a className="inline-flex items-center justify-center gap-2.5 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface border border-outline-variant/50 font-semibold px-8 py-4 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] text-base" href="#demo">
          <span className="material-symbols-outlined text-primary text-lg" data-icon="play_circle">play_circle</span>
          <span>Watch Demo</span>
        </a>
      </div>

      {/* Trust badges row */}
      <div className="flex flex-wrap items-center gap-6 text-sm text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-amber-500 text-base" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
          <span className="font-bold text-on-surface">4.9/5</span> from 850+ groomers
        </span>
        <span className="w-px h-4 bg-outline-variant/50 hidden sm:block"></span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base">verified_user</span>
          No credit card required
        </span>
        <span className="w-px h-4 bg-outline-variant/50 hidden sm:block"></span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base">bolt</span>
          2-min setup
        </span>
      </div>
    </div>

    {/* Right Column: Floating Dashboard Preview */}
    <div className="relative" id="demo">
      {/* Main booking card */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-6 shadow-2xl shadow-on-surface/5 relative z-10">
        {/* Browser chrome */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-outline-variant/20">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400"></span>
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
          </div>
          <span className="text-xs text-secondary flex items-center gap-1 font-mono">
            <span className="material-symbols-outlined text-xs" data-icon="lock">lock</span>
            groomflow.app/book/pawsome-mobile
          </span>
        </div>

        {/* Booking card content */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-3xl" data-icon="pets">pets</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-on-surface text-lg">Cooper</h3>
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">Dog</span>
            </div>
            <p className="text-sm text-secondary">Golden Retriever &bull; 65 lbs &bull; Full De-Shed &amp; Bath</p>
          </div>
        </div>

        {/* Travel buffer */}
        <div className="bg-primary/5 rounded-xl p-3.5 mb-5 border border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-lg" data-icon="commute">commute</span>
            <span className="text-sm font-bold">Smart Travel Buffer</span>
          </div>
          <span className="text-xs text-on-surface bg-surface-container-lowest px-2.5 py-1 rounded-lg border border-outline-variant/20 font-semibold">
            +25 min drive
          </span>
        </div>

        {/* Time & location grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/15">
            <span className="text-xs text-secondary block mb-1">Date &amp; Arrival</span>
            <span className="font-bold text-on-surface text-sm">Tomorrow, 10:00 AM</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/15">
            <span className="text-xs text-secondary block mb-1">Service Location</span>
            <span className="font-bold text-on-surface text-sm">Curbside Van</span>
          </div>
        </div>

        {/* Deposit confirmed */}
        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
          <div className="flex items-center gap-2 text-emerald-600">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
            <span className="text-sm font-bold">\$35 deposit collected</span>
          </div>
          <span className="text-xs text-secondary font-medium">Visa &bull;&bull;&bull;&bull; 4242</span>
        </div>
      </div>

      {/* Floating stat card: top-right */}
      <div className="absolute -top-4 -right-4 md:-top-6 md:-right-6 bg-surface-container-lowest rounded-xl border border-outline-variant/30 px-4 py-3 shadow-lg z-20 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-emerald-600 text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>trending_up</span>
        </div>
        <div>
          <p className="text-xs text-secondary">No-Show Rate</p>
          <p className="text-lg font-extrabold text-emerald-600 leading-tight">-94%</p>
        </div>
      </div>

      {/* Floating notification card: bottom-left */}
      <div className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 bg-surface-container-lowest rounded-xl border border-outline-variant/30 px-4 py-3 shadow-lg z-20 flex items-center gap-3 max-w-[240px]">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-xl">notifications_active</span>
        </div>
        <div>
          <p className="text-xs font-bold text-on-surface">Auto-Reminder Sent</p>
          <p className="text-xs text-secondary">Cooper&apos;s owner reminded 24h before</p>
        </div>
      </div>
    </div>

  </div>
</div>
</section>

<section className="py-16 md:py-24 bg-surface-container-low/50" id="features">
<div className="max-w-7xl mx-auto px-space-md md:px-margin">
<div className="text-center max-w-2xl mx-auto mb-12">
<span className="text-label-sm font-label-sm font-semibold text-primary uppercase tracking-wider block mb-2">Designed for the Grooming Van &amp; Salon</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface mb-3">
            Built Around Grooming Reality, Not Generic Appointments
          </h2>
<p className="text-body-md font-body-md text-secondary">
            Generic scheduling tools ignore dog coat variables, van driving routes, and sudden pet temperament changes. GroomFlow automates them all.
          </p>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">

<div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-6 md:p-8 flex flex-col justify-between hover:border-outline-variant hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200" id="route-optimization">
<div>
<div className="w-12 h-12 rounded-xl bg-surface-container text-primary flex items-center justify-center mb-5">
<span className="material-symbols-outlined text-2xl" data-icon="route">route</span>
</div>
<h3 className="font-headline-md text-headline-md text-on-surface mb-2">Smart Travel Buffers</h3>
<p className="text-body-md font-body-md text-secondary mb-6">
                Zero stress between stops. Automatic route calculation and traffic padding between client locations for mobile grooming vans.
              </p>
</div>

<div className="bg-surface-bright rounded-xl p-4 border border-outline-variant/30">
<div className="space-y-2.5">
<div className="flex items-center justify-between text-body-sm font-body-sm">
<div className="flex items-center gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
<span className="font-semibold text-on-surface">10:00 AM • Bella (Poodle)</span>
</div>
<span className="text-caption font-caption text-secondary">Oak Hill St</span>
</div>

<div className="flex items-center gap-2 pl-1 py-1 border-l-2 border-dashed border-primary ml-1 text-label-sm font-label-sm text-primary">
<span className="material-symbols-outlined text-sm ml-2" data-icon="navigation">navigation</span>
<span className="font-semibold">+25 min Transit &amp; Prep Buffer</span>
</div>
<div className="flex items-center justify-between text-body-sm font-body-sm">
<div className="flex items-center gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
<span className="font-semibold text-on-surface">11:30 AM • Milo (Shih Tzu)</span>
</div>
<span className="text-caption font-caption text-secondary">Bayview Ave</span>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-6 md:p-8 flex flex-col justify-between hover:border-outline-variant hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
<div>
<div className="w-12 h-12 rounded-xl bg-surface-container text-primary flex items-center justify-center mb-5">
<span className="material-symbols-outlined text-2xl" data-icon="health_and_safety">health_and_safety</span>
</div>
<h3 className="font-headline-md text-headline-md text-on-surface mb-2">Rabies &amp; Health Vault</h3>
<p className="text-body-md font-body-md text-secondary mb-6">
                Digital vaccine record uploads and automated expiry warnings. Keep your shop legally compliant and pets protected.
              </p>
</div>

<div className="bg-surface-bright rounded-xl p-4 border border-outline-variant/30 flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-xl" data-icon="description">description</span>
</div>
<div>
<div className="text-label-md font-label-md font-semibold text-on-surface">Rabies Certificate</div>
<div className="text-caption font-caption text-secondary">Uploaded by Vet Clinic</div>
</div>
</div>
<div className="text-right">
<span className="inline-flex items-center gap-1 text-label-sm font-label-sm font-semibold text-primary bg-primary-fixed/30 px-2.5 py-1 rounded-full">
<span className="material-symbols-outlined text-xs" data-icon="check_circle">check_circle</span> Verified
                </span>
<div className="text-caption font-caption text-secondary mt-1">Exp Oct 2026</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-6 md:p-8 flex flex-col justify-between hover:border-outline-variant hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
<div>
<div className="w-12 h-12 rounded-xl bg-surface-container text-primary flex items-center justify-center mb-5">
<span className="material-symbols-outlined text-2xl" data-icon="payments">payments</span>
</div>
<h3 className="font-headline-md text-headline-md text-on-surface mb-2">Digital Waivers &amp; Deposits</h3>
<p className="text-body-md font-body-md text-secondary mb-6">
                End costly no-shows with card pre-authorization, automated deposit collection, and signed liability terms before arrival.
              </p>
</div>

<div className="bg-surface-bright rounded-xl p-4 border border-outline-variant/30 space-y-2">
<div className="flex items-center justify-between text-body-sm font-body-sm pb-2 border-b border-outline-variant/20">
<span className="text-secondary">Upfront Card Pre-Auth</span>
<span className="font-semibold text-on-surface">$40.00 Collected</span>
</div>
<div className="flex items-center justify-between pt-1">
<span className="text-label-sm font-label-sm text-primary font-semibold flex items-center gap-1">
<span className="material-symbols-outlined text-sm" data-icon="trending_down">trending_down</span>
                  No-show rate dropped by 94%
                </span>
<span className="text-caption font-caption text-secondary">Auto-retained on cancellation</span>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-6 md:p-8 flex flex-col justify-between hover:border-outline-variant hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
<div>
<div className="w-12 h-12 rounded-xl bg-surface-container text-primary flex items-center justify-center mb-5">
<span className="material-symbols-outlined text-2xl" data-icon="flag">flag</span>
</div>
<h3 className="font-headline-md text-headline-md text-on-surface mb-2">Pet Safety Profiles</h3>
<p className="text-body-md font-body-md text-secondary mb-6">
                Instant temperament tags visible at a glance so you and your team are never surprised during nail trims or blow-drying.
              </p>
</div>

<div className="bg-surface-bright rounded-xl p-4 border border-outline-variant/30 flex flex-wrap gap-2">
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-label-sm font-medium bg-error-container text-on-error-container">
<span className="material-symbols-outlined text-xs" data-icon="warning">warning</span> Anxious in Dryers
              </span>
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-label-sm font-medium bg-surface-container text-on-surface-variant">
<span className="material-symbols-outlined text-xs" data-icon="front_hand">front_hand</span> Gentle Paw Handling
              </span>
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-label-sm font-medium bg-tertiary-fixed text-on-tertiary-fixed">
<span className="material-symbols-outlined text-xs" data-icon="vaccines">vaccines</span> Allergic to Oatmeal
              </span>
</div>
</div>
</div>
</div>
</section>

<section className="py-16 md:py-24" id="pricing">
<div className="max-w-7xl mx-auto px-space-md md:px-margin">
<div className="text-center max-w-2xl mx-auto mb-10">
<span className="text-label-sm font-label-sm font-semibold text-primary uppercase tracking-wider block mb-2">Simple, Predictable Plans</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface mb-3">
            Transparent Pricing for Growing Groomers
          </h2>
<p className="text-body-md font-body-md text-secondary">
            No hidden booking surcharges or locked contracts. Upgrade, switch, or cancel anytime.
          </p>

<div className="inline-flex items-center gap-3 bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/30 mt-6" id="billing-toggle-container">
<button className="px-4 py-1.5 rounded-lg text-label-md font-label-md font-semibold transition-all bg-surface-container-lowest text-on-surface shadow-sm" id="monthly-btn" type="button">
              Monthly
            </button>
<button className="px-4 py-1.5 rounded-lg text-label-md font-label-md font-semibold transition-all text-secondary hover:text-on-surface flex items-center gap-1.5" id="annual-btn" type="button">
<span>Annual</span>
<span className="text-label-sm font-label-sm px-2 py-0.5 rounded-full bg-primary text-on-primary font-bold">Save 20%</span>
</button>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

<div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
<div>
<div className="flex items-center justify-between mb-4">
<h3 className="font-headline-md text-headline-md text-on-surface">Solo Operator</h3>
<span className="text-label-sm font-label-sm px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-semibold">1 Van or 1 Salon Table</span>
</div>
<p className="text-body-sm font-body-sm text-secondary mb-6">
                Perfect for independent groomers wanting seamless booking without hiring a receptionist.
              </p>

<div className="mb-6 flex items-baseline gap-1">
<span className="text-headline-xl font-headline-xl text-on-surface font-extrabold price-solo">$39</span>
<span className="text-body-sm font-body-sm text-secondary duration-solo">/month</span>
</div>

<ul className="space-y-3 mb-8 text-body-sm font-body-sm text-on-surface">
<li className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-primary text-base" data-icon="check">check</span>
<span>Smart calendar &amp; client booking widget</span>
</li>
<li className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-primary text-base" data-icon="check">check</span>
<span>500 automated SMS appointment reminders</span>
</li>
<li className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-primary text-base" data-icon="check">check</span>
<span>Digital Rabies &amp; Health record vault</span>
</li>
<li className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-primary text-base" data-icon="check">check</span>
<span>Upfront card deposits &amp; signed waivers</span>
</li>
<li className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-primary text-base" data-icon="check">check</span>
<span>Full client CRM &amp; pet temperament notes</span>
</li>
</ul>
</div>
<Link className="w-full inline-flex items-center justify-center bg-surface-container-lowest hover:bg-surface-container-low text-on-surface border border-outline-variant/60 font-label-md text-label-md font-semibold py-3 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98]" to="/admin">
              Start Free Trial
            </Link>
</div>

<div className="bg-surface-container-lowest rounded-2xl border-2 border-primary p-6 md:p-8 flex flex-col justify-between shadow-xl relative">

<div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-label-sm font-label-sm font-bold py-1 px-3.5 rounded-full shadow-sm flex items-center gap-1">
<span className="material-symbols-outlined text-xs" data-icon="star" data-weight="fill" style={{ fontVariationSettings: "\"FILL\" 1" }}>star</span>
              Most Popular
            </div>
<div>
<div className="flex items-center justify-between mb-4 mt-1">
<h3 className="font-headline-md text-headline-md text-on-surface">Fleet &amp; Multi-Van</h3>
<span className="text-label-sm font-label-sm px-3 py-1 rounded-full bg-primary-fixed/40 text-on-primary-fixed-variant font-semibold">Up to 3 groomers / vans</span>
</div>
<p className="text-body-sm font-body-sm text-secondary mb-6">
                Engineered for scaling mobile operations and busy multi-station grooming salons.
              </p>

<div className="mb-6 flex items-baseline gap-1">
<span className="text-headline-xl font-headline-xl text-on-surface font-extrabold price-fleet">$79</span>
<span className="text-body-sm font-body-sm text-secondary duration-fleet">/month</span>
</div>

<ul className="space-y-3 mb-8 text-body-sm font-body-sm text-on-surface">
<li className="flex items-center gap-2.5 font-semibold text-primary">
<span className="material-symbols-outlined text-base" data-icon="add_circle">add_circle</span>
<span>Everything in Solo Operator, plus:</span>
</li>
<li className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-primary text-base" data-icon="check">check</span>
<span>Automated multi-van GPS route grouping</span>
</li>
<li className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-primary text-base" data-icon="check">check</span>
<span>Staff commissions &amp; tip payout tracking</span>
</li>
<li className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-primary text-base" data-icon="check">check</span>
<span>Unlimited automated SMS notifications</span>
</li>
<li className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-primary text-base" data-icon="check">check</span>
<span>VIP 24/7 priority support &amp; van fleet onboarding</span>
</li>
</ul>
</div>
<Link className="w-full inline-flex items-center justify-center bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold py-3.5 px-4 rounded-xl transition-all shadow-md active:scale-[0.98]" to="/admin">
              Start Free Trial
            </Link>
</div>
</div>
</div>
</section>

<section className="py-12 md:py-16 bg-surface-container-low/40 border-y border-outline-variant/30" id="testimonials">
<div className="max-w-4xl mx-auto px-space-md md:px-margin text-center">
<div className="flex justify-center gap-1 text-tertiary-container mb-6">
<span className="material-symbols-outlined text-2xl" data-icon="star" data-weight="fill" style={{ fontVariationSettings: "\"FILL\" 1" }}>star</span>
<span className="material-symbols-outlined text-2xl" data-icon="star" data-weight="fill" style={{ fontVariationSettings: "\"FILL\" 1" }}>star</span>
<span className="material-symbols-outlined text-2xl" data-icon="star" data-weight="fill" style={{ fontVariationSettings: "\"FILL\" 1" }}>star</span>
<span className="material-symbols-outlined text-2xl" data-icon="star" data-weight="fill" style={{ fontVariationSettings: "\"FILL\" 1" }}>star</span>
<span className="material-symbols-outlined text-2xl" data-icon="star" data-weight="fill" style={{ fontVariationSettings: "\"FILL\" 1" }}>star</span>
</div>
<blockquote className="font-headline-sm md:font-headline-md text-headline-sm md:text-headline-md text-on-surface mb-6 font-medium leading-relaxed">
          &ldquo;GroomFlow saved our mobile van over 8 hours a week in wasted drive time and completely eliminated no-shows with automated deposits.&rdquo;
        </blockquote>
<div className="inline-flex items-center gap-3">
<div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed font-bold flex items-center justify-center text-label-md font-label-md">
            SM
          </div>
<div className="text-left">
<div className="font-label-md text-label-md font-semibold text-on-surface">Sarah M.</div>
<div className="text-body-sm font-body-sm text-secondary">Owner, Paws &amp; Bubbles Mobile Grooming</div>
</div>
</div>
</div>
</section>

<section className="py-16 md:py-24">
<div className="max-w-7xl mx-auto px-space-md md:px-margin">
<div className="bg-inverse-surface text-inverse-on-surface rounded-3xl p-8 md:p-14 text-center relative overflow-hidden shadow-2xl">

<div className="absolute -right-16 -bottom-16 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
<div className="absolute -left-16 -top-16 w-80 h-80 bg-primary-container/20 rounded-full blur-3xl pointer-events-none"></div>
<div className="relative z-10 max-w-2xl mx-auto">
<h2 className="font-display-hero-mobile md:font-headline-xl text-display-hero-mobile md:text-headline-xl text-inverse-on-surface mb-4 font-bold tracking-tight">
              Ready to Put Your Grooming Schedule on Autopilot?
            </h2>
<p className="font-body-lg text-body-lg text-secondary-fixed-dim mb-8">
              Join over 850+ independent salons and mobile groomers saving 10+ hours every week.
            </p>
<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
<Link className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-bold px-8 py-4 rounded-xl shadow-lg transition-all active:scale-[0.98]" to="/admin">
<span>Get Started with 14 Days Free</span>
<span className="material-symbols-outlined text-lg" data-icon="arrow_forward">arrow_forward</span>
</Link>
</div>
<p className="text-caption font-caption text-secondary-fixed-dim">
              Instant access &bull; Cancel anytime &bull; Zero setup fees
            </p>
</div>
</div>
</div>
</section>
</main>

<footer className="bg-surface-container-lowest border-t border-outline-variant/30 pt-16 pb-8">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
      {/* Brand Column */}
      <div className="lg:col-span-2">
        <Link className="text-headline-sm font-bold text-on-surface flex items-center gap-2 mb-4" to="/">
          <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-lg" data-icon="pets">pets</span>
          </span>
          <span className="text-xl tracking-tight">GroomFlow</span>
        </Link>
        <p className="text-body-sm text-secondary mb-6 max-w-sm leading-relaxed">
          The all-in-one operating system for modern pet groomers. Automate your bookings, eliminate no-shows, and focus on what you love.
        </p>
        <div className="flex items-center gap-4 text-secondary">
          <a href="#" className="hover:text-primary transition-colors"><span className="material-symbols-outlined" data-icon="language">language</span></a>
          <a href="#" className="hover:text-primary transition-colors"><span className="material-symbols-outlined" data-icon="mail">mail</span></a>
          <a href="#" className="hover:text-primary transition-colors"><span className="material-symbols-outlined" data-icon="support_agent">support_agent</span></a>
        </div>
      </div>

      {/* Product Links */}
      <div>
        <h4 className="font-semibold text-on-surface mb-4 text-sm uppercase tracking-wider">Product</h4>
        <ul className="space-y-3 text-body-sm text-secondary">
          <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
          <li><a href="#route-optimization" className="hover:text-primary transition-colors">Route Optimization</a></li>
          <li><a href="#demo" className="hover:text-primary transition-colors">Live Demo</a></li>
          <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
          <li><a href="#testimonials" className="hover:text-primary transition-colors">Customer Stories</a></li>
        </ul>
      </div>

      {/* Resources Links */}
      <div>
        <h4 className="font-semibold text-on-surface mb-4 text-sm uppercase tracking-wider">Resources</h4>
        <ul className="space-y-3 text-body-sm text-secondary">
          <li><Link to="/support" className="hover:text-primary transition-colors">Help Center</Link></li>
          <li><a href="#" className="hover:text-primary transition-colors">Mobile Grooming Guide</a></li>
          <li><a href="#" className="hover:text-primary transition-colors">Salon Business Tips</a></li>
          <li><a href="#" className="hover:text-primary transition-colors">API Documentation</a></li>
        </ul>
      </div>

      {/* Legal Links */}
      <div>
        <h4 className="font-semibold text-on-surface mb-4 text-sm uppercase tracking-wider">Company</h4>
        <ul className="space-y-3 text-body-sm text-secondary">
          <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
          <li><a href="#" className="hover:text-primary transition-colors">Contact Sales</a></li>
          <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
          <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
        </ul>
      </div>
    </div>

    {/* Bottom Copyright Row */}
    <div className="pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4">
      <p className="text-caption text-secondary">
        &copy; {new Date().getFullYear()} GroomFlow Technologies Inc. All rights reserved.
      </p>
      <div className="flex items-center gap-2 text-caption text-secondary">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        All systems operational
      </div>
    </div>
  </div>
</footer>
    </div>
  );
}
