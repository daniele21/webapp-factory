import React from 'react'

export default function StyleDemo() {
  return (
    <div className="min-h-screen bg-bg p-8 space-y-12">
      {/* Hero Section with Gradient */}
      <section className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-gradient-animated">
          Modern Design System
        </h1>
        <p className="text-xl text-muted-fg max-w-2xl mx-auto leading-relaxed">
          Experience our cool, modern, and effective styling system with glass morphism, 
          gradients, and smooth animations.
        </p>
      </section>

      {/* Cards Section */}
      <section className="space-y-8">
        <h2 className="text-3xl font-semibold text-center">Interactive Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Elevated Card */}
          <div className="card-elevated p-6 space-y-4">
            <div className="status-dot status-online"></div>
            <h3 className="text-xl font-semibold">Elevated Card</h3>
            <p className="text-muted-fg">
              This card uses our elevation system with smooth hover effects and modern shadows.
            </p>
            <button className="btn-ghost px-4 py-2 rounded-md">
              Learn More
            </button>
          </div>

          {/* Glass Card */}
          <div className="card-glass p-6 space-y-4">
            <div className="status-dot status-busy"></div>
            <h3 className="text-xl font-semibold">Glass Morphism</h3>
            <p className="text-muted-fg">
              Beautiful glass effect with backdrop blur and semi-transparent backgrounds.
            </p>
            <button className="btn-gradient px-4 py-2 rounded-md">
              Explore
            </button>
          </div>

          {/* Gradient Card */}
          <div className="card-gradient p-6 space-y-4">
            <div className="status-dot status-online"></div>
            <h3 className="text-xl font-semibold">Gradient Style</h3>
            <p className="text-muted-fg">
              Subtle gradient backgrounds with modern border treatments.
            </p>
            <button className="hover-lift px-4 py-2 bg-primary text-primary-fg rounded-md">
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Elements */}
      <section className="space-y-8">
        <h2 className="text-3xl font-semibold text-center">Interactive Elements</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <button className="hover-lift px-6 py-3 bg-primary text-primary-fg rounded-lg font-medium">
            Hover Lift
          </button>
          <button className="hover-scale px-6 py-3 bg-secondary text-secondary-fg rounded-lg font-medium">
            Hover Scale
          </button>
          <button className="hover-glow px-6 py-3 bg-accent text-accent-fg rounded-lg font-medium">
            Hover Glow
          </button>
          <button className="btn-gradient px-6 py-3 rounded-lg font-medium">
            Gradient Button
          </button>
        </div>
      </section>

      {/* Forms Section */}
      <section className="space-y-8 max-w-md mx-auto">
        <h2 className="text-3xl font-semibold text-center">Modern Forms</h2>
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Standard Input"
            className="input-modern w-full"
          />
          <input 
            type="email" 
            placeholder="Glass Input"
            className="input-glass w-full"
          />
          <textarea 
            placeholder="Your message..."
            rows={4}
            className="input-modern w-full resize-none"
          />
        </div>
      </section>

      {/* Gradient Text Examples */}
      <section className="space-y-8 text-center">
        <h2 className="text-3xl font-semibold">Gradient Typography</h2>
        <div className="space-y-4">
          <h3 className="text-4xl font-bold text-gradient-primary">
            Primary Gradient Text
          </h3>
          <h3 className="text-4xl font-bold text-gradient-accent">
            Accent Gradient Text
          </h3>
          <h3 className="text-4xl font-bold text-gradient-animated">
            Animated Gradient Text
          </h3>
        </div>
      </section>

      {/* Loading States */}
      <section className="space-y-8">
        <h2 className="text-3xl font-semibold text-center">Loading States</h2>
        <div className="space-y-4 max-w-md mx-auto">
          <div className="skeleton-text"></div>
          <div className="skeleton-text w-3/4"></div>
          <div className="skeleton-button"></div>
          <div className="flex items-center space-x-4">
            <div className="skeleton-avatar w-12 h-12"></div>
            <div className="flex-1 space-y-2">
              <div className="skeleton-text"></div>
              <div className="skeleton-text w-2/3"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Glass Navigation Example */}
      <section className="space-y-8">
        <h2 className="text-3xl font-semibold text-center">Glass Navigation</h2>
        <nav className="glass max-w-md mx-auto rounded-2xl p-4">
          <ul className="flex justify-around">
            <li>
              <a href="#" className="flex-center-col space-y-1 p-2 rounded-lg hover-scale">
                <div className="w-6 h-6 bg-primary rounded"></div>
                <span className="text-xs">Home</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex-center-col space-y-1 p-2 rounded-lg hover-scale">
                <div className="w-6 h-6 bg-secondary rounded"></div>
                <span className="text-xs">Dashboard</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex-center-col space-y-1 p-2 rounded-lg hover-scale">
                <div className="w-6 h-6 bg-accent rounded"></div>
                <span className="text-xs">Profile</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex-center-col space-y-1 p-2 rounded-lg hover-scale">
                <div className="w-6 h-6 bg-warning rounded"></div>
                <span className="text-xs">Settings</span>
              </a>
            </li>
          </ul>
        </nav>
      </section>

      {/* Status Indicators */}
      <section className="space-y-8 text-center">
        <h2 className="text-3xl font-semibold">Status Indicators</h2>
        <div className="flex justify-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="status-dot status-online"></div>
            <span>Online</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="status-dot status-busy"></div>
            <span>Busy</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="status-dot status-offline"></div>
            <span>Offline</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="status-dot status-error"></div>
            <span>Error</span>
          </div>
        </div>
      </section>
    </div>
  )
}