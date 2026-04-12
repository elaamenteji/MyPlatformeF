import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

/* ════════════════════════════════
   HOOK — Scroll Reveal
════════════════════════════════ */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ════════════════════════════════
   SUB-COMPONENTS
════════════════════════════════ */

function SectionBanner({ img, alt, title }) {
  return (
    <div className="section-banner">
      <img src={img} alt={alt} loading="lazy" />
      <div className="section-banner-overlay" />
      <div className="section-banner-title">{title}</div>
    </div>
  );
}

function SectionHeader({ label, title, text, dark = false }) {
  return (
    <div className="reveal">
      <span className="section-label">{label}</span>
      <h2 className="section-title">{title}</h2>
      <div className="section-rule" />
      {text && <p className="section-text">{text}</p>}
    </div>
  );
}

/* ── Navbar ── */
function Navbar({ activeSection }) {
  const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <img
          src="/logo_mitech.png"
          alt="Mitech Tunisie"
          className="nav-logo-img"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>
 
      <ul className="nav-links">
        <li>
          <a href="#home" className={`nav-link${activeSection === 'home' ? ' active' : ''}`}>Home</a>
        </li>
        <li className="nav-divider" />
        <li className="nav-dropdown-wrap">
          <button className="nav-btn">Company ▾</button>
          <div className="nav-dropdown">
            <a href="#about">About Us</a>
            <a href="#history">History</a>
            <a href="#group">The Group</a>
          </div>
        </li>
        {['products', 'process', 'certifications', 'customers', 'contact'].map((s) => (
          <li key={s}>
            <a
              href={`#${s}`}
              className={`nav-link${activeSection === s ? ' active' : ''}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </a>
          </li>
        ))}
        <li className="nav-divider" />
        <li>
         <button className="nav-signin" onClick={() => navigate('/login')}>Sign In</button>
        </li>
      </ul>
    </nav>
  );
}

/* ── Hero ── */
/* ── Hero ── */
function Hero() {
  const bgRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => bgRef.current?.classList.add('loaded'), 100);
    return () => clearTimeout(t);
  }, []);
 
  return (
    <section className="hero" id="home">
      <div className="hero-bg" ref={bgRef} style={{ backgroundImage: "url('/hero_bg.jpg')" }} />
      <div className="hero-overlay" />
      <div className="hero-content">
        <img
          src="/logo_mitech.png"
          alt="Mitech Tunisie"
          className="hero-logo"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="hero-eyebrow">Mitech Tunisie — Est. 2003</div>
        <h1 className="hero-title">Innovation &amp;<br />Excellence in Leather</h1>
        <div className="hero-line" />
        <p className="hero-sub">Precision-crafted automotive leather, rooted in Italian excellence</p>
        <a href="#about" className="hero-cta">Discover our story</a>
      </div>
    </section>
  );
}
 

/* ── Stats Bar ── */
const STATS = [
  { num: '20+', label: 'Years of Excellence' },
  { num: '500+', label: 'Skilled Employees' },
  { num: '100%', label: 'Quality Italian DNA' },
];

function StatsBar() {
  return (
    <div className="stats-bar">
      {STATS.map((s, i) => (
        <div className="stat-item reveal" key={s.label} style={{ transitionDelay: `${i * 0.15}s` }}>
          <span className="stat-num">{s.num}</span>
          <span className="stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── About ── */
function About() {
  return (
    <>
      <SectionBanner
        img="/about.jpg"
        alt="leather texture"
        title="About Us"
      />
      <section className="section" id="about">
        <SectionHeader
          label="Who We Are"
          title="A Legacy of Quality in Tunisia"
          text="Mitech Tunisie is a premier manufacturer of leather automotive components, combining Italian mastery with Tunisian craftsmanship to serve the world's most demanding car manufacturers."
        />
        <div className="about-grid">
          <div className="about-text reveal-left">
            <p>
              Founded in <strong>2003</strong> in Sousse, Tunisia, Mitech Tunisie has grown into a
              key player in the automotive leather industry. Our factory covers over{' '}
              <strong>15,000 m²</strong> and operates with state-of-the-art machinery imported
              from Italy and Germany.
            </p>
            <p>
              As a subsidiary of the <strong>Gruppo Mastrotto</strong>, one of the world's leading
              leather groups, we benefit from decades of Italian expertise and a global network of
              suppliers and customers.
            </p>
            <p>
              Our commitment to <strong>precision, sustainability, and innovation</strong> drives
              every project — from the reception of raw hides to the delivery of finished
              automotive seat covers.
            </p>
          </div>
          <div className="about-img-wrap reveal-right">
            <img
              src="https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80"
              alt="Leather craftsmanship"
            />
          </div>
        </div>
      </section>
    </>
  );
}

/* ── History ── */
const TIMELINE = [
  { year: '2003', title: 'Foundation', text: 'Mitech Tunisie is established in Soliman as a joint venture with the Gruppo Mastrotto. The first production lines for automotive leather are installed.' },
  { year: '2008', title: 'Expansion to Sousse', text: 'The company relocates to a new 15,000 m² facility in the ZI Sidi Abdelhamid industrial zone in Sousse, doubling production capacity.' },
  { year: '2012', title: 'ISO 9001 & 14001 Certification', text: 'Mitech Tunisie achieves international quality and environmental certifications, cementing its reputation as a world-class supplier.' },
  { year: '2018', title: 'New Clients & Markets', text: 'Partnerships with Audi, Volkswagen, and Toyota expand our client portfolio. We begin supplying just-in-time to assembly lines across Western Europe.' },
  { year: '2024', title: 'Sustainability Roadmap', text: 'Launch of the Green Leather Initiative — a commitment to reduce carbon footprint by 40% by 2030, with water recycling and eco-tanning processes.' },
];

function History() {
  return (
    <>
      <SectionBanner
        img="https://images.unsplash.com/photo-1530099486328-e021101a494a?w=1400&q=80"
        alt="history"
        title="History"
      />
      <section className="section bg-light" id="history">
        <SectionHeader label="Our Journey" title="How We Grew" />
        <div className="timeline">
          {TIMELINE.map((item, i) => (
            <div
              className="timeline-item reveal"
              key={item.year}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <div className="timeline-year">{item.year}</div>
              <div className="timeline-title">{item.title}</div>
              <div className="timeline-text">{item.text}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ── Group ── */
function Group() {
  return (
    <>
      <SectionBanner
        img="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&q=80"
        alt="the group"
        title="The Group"
      />
      <section className="section" id="group">
        <SectionHeader
          label="Our Parent Company"
          title="Gruppo Mastrotto"
          text="Mitech Tunisie is a proud member of the Gruppo Mastrotto, one of the world's leading leather manufacturers with a history spanning over six decades."
        />
        <div className="group-grid reveal">
          {[
            { num: '1958', label: 'Founded' },
            { num: '2,200+', label: 'Employees Worldwide' },
            { num: '€400M+', label: 'Annual Revenue' },
          ].map(s => (
            <div className="group-stat" key={s.label}>
              <div className="group-stat-num">{s.num}</div>
              <div className="group-stat-label">{s.label}</div>
            </div>
          ))}
          <div className="group-desc">
            Present on <strong>4 continents</strong>, Gruppo Mastrotto delivers excellence in leather
            manufacturing for the automotive, furniture and fashion industries worldwide. Their
            commitment to innovation and sustainability shapes everything we do at Mitech Tunisie.
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Products ── */
const PRODUCTS_TOP = [
  '/product1.png',
  '/product2.png',
  '/product3.png',
  '/product4.png',
  '/product5.png',
];
const PRODUCTS_BOT = [
  '/product2.png',
  '/product4.png',
  '/product1.png',
];
 
function Products() {
  return (
    <>
      <SectionBanner
        img="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1400&q=80"
        alt="car leather"
        title="Products"
        id="products"
      />
      <section
        className="section bg-light"
        id="products"
        style={{ paddingTop: 60, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }}
      >
        <div style={{ padding: '0 60px 40px' }}>
          <SectionHeader
            label="Our Work"
            title="Our Products"
            text="Recognized among the major premium automotive brands for the quality of our leather components and the flexibility of our manufacturing processes."
          />
        </div>
        <div className="products-container reveal">
          <div className="products-row">
            {PRODUCTS_TOP.map((src, i) => (
              <div className="product-img-wrap" key={i}>
                <img src={src} alt={`product ${i + 1}`} loading="lazy" />
              </div>
            ))}
          </div>
          <div className="products-row bottom">
            {PRODUCTS_BOT.map((src, i) => (
              <div className="product-img-wrap" key={i}>
                <img src={src} alt={`product ${i + 6}`} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 60 }} />
      </section>
    </>
  );
}
/* ── Process ── */
const PROCESS_STEPS = [
  { num: '01', name: 'Reception', desc: 'Raw bovine hides received and quality-checked upon arrival from certified suppliers.' },
  { num: '02', name: 'Cutting', desc: 'Precision cutting of leather parts to exact automotive specifications using CNC machines.' },
  { num: '03', name: 'Sewing', desc: 'Expert craftspeople assemble each component with artisanal stitching and care.' },
  { num: '04', name: 'Quality Control', desc: 'Rigorous multi-stage inspection at every step to meet ISO and OEM standards.' },
  { num: '05', name: 'Packaging', desc: 'Finished components are carefully packaged and labeled according to each client\'s requirements.', wide: true },
  { num: '06', name: 'Delivery', desc: 'Just-in-time delivery to assembly lines across Europe, ensuring zero production downtime.', wide: true },
];

function Process() {
  return (
    <>
      <SectionBanner
        img="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1400&q=80"
        alt="factory"
        title="Our Process"
      />
      <section className="section" id="process">
        <SectionHeader
          label="How We Work"
          title="From Hide to Interior"
          text="From raw material to finished automotive component — every step is controlled with precision and care to ensure the highest possible quality."
        />
        <div className="process-grid reveal">
          {PROCESS_STEPS.map((step) => (
            <div className={`process-step${step.wide ? ' wide' : ''}`} key={step.num}>
              <div className="process-num">{step.num}</div>
              <div className="process-name">{step.name}</div>
              <div className="process-desc">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ── Certifications ── */
const CERTS = [
  { code: 'ISO 9001', desc: 'Quality Management' },
  { code: 'ISO 14001', desc: 'Environmental Management' },
  { code: 'ISO 45001', desc: 'Health & Safety' },
  { code: 'IATF 16949', desc: 'Automotive Quality' },
];

function Certifications() {
  return (
    <>
      <SectionBanner
        img="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80"
        alt="quality leather"
        title="Certifications"
      />
      <section className="section bg-light" id="certifications">
        <SectionHeader
          label="Our Standards"
          title="Quality Recognized"
          text="Our commitment to quality, environment and workplace safety is recognized by the most demanding international standards."
        />
        <div className="certifs-row reveal">
          {CERTS.map((c) => (
            <div className="certif-item" key={c.code}>
              <div className="certif-code">{c.code}</div>
              <div className="certif-desc">{c.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ── Customers ── */
const CLIENTS = [
  {
    name: 'Audi',
    svg: (
      <svg className="client-logo-svg" viewBox="0 0 80 36">
        {[10, 28, 46, 64].map(cx => (
          <circle key={cx} cx={cx} cy="18" r="9" fill="none" stroke="#444" strokeWidth="2.5" />
        ))}
      </svg>
    ),
  },
  {
    name: 'Volkswagen',
    svg: (
      <svg className="client-logo-svg" viewBox="0 0 60 36">
        <circle cx="30" cy="18" r="15" fill="none" stroke="#444" strokeWidth="2" />
        <circle cx="30" cy="18" r="8" fill="none" stroke="#444" strokeWidth="1.5" />
        <line x1="30" y1="3" x2="30" y2="33" stroke="#444" strokeWidth="1.5" />
        <line x1="15" y1="18" x2="45" y2="18" stroke="#444" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    name: 'Peugeot',
    svg: (
      <svg className="client-logo-svg" viewBox="0 0 60 36">
        <rect x="8" y="8" width="44" height="20" rx="10" fill="none" stroke="#444" strokeWidth="2" />
        <text x="30" y="22" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#444" fontFamily="Montserrat,sans-serif">PSA</text>
      </svg>
    ),
  },
  {
    name: 'Toyota',
    svg: (
      <svg className="client-logo-svg" viewBox="0 0 60 36">
        <ellipse cx="30" cy="18" rx="16" ry="9" fill="none" stroke="#444" strokeWidth="2" />
        <ellipse cx="30" cy="18" rx="9" ry="15" fill="none" stroke="#444" strokeWidth="2" />
      </svg>
    ),
  },
  {
    name: 'Škoda',
    svg: (
      <svg className="client-logo-svg" viewBox="0 0 60 36">
        <polygon points="30,3 54,16 54,20 30,33 6,20 6,16" fill="none" stroke="#444" strokeWidth="2" />
        <text x="30" y="22" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#444" fontFamily="Montserrat,sans-serif">ŠKODA</text>
      </svg>
    ),
  },
];

function Customers() {
  return (
    <>
      <SectionBanner
        img="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1400&q=80"
        alt="cars"
        title="Customers"
      />
      <section className="section" id="customers">
        <SectionHeader
          label="Our Partners"
          title="World-Class Clients"
          text="World-renowned automotive manufacturers trust us for the precision and quality of our leather interior components."
        />
        <div className="clients-row reveal">
          {CLIENTS.map((c) => (
            <div className="client-logo-box" key={c.name}>
              {c.svg}
              <div className="client-name">{c.name}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ── Contact ── */
function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="contact-dark" id="contact">
      <SectionHeader label="Get In Touch" title="Contact Us" text="We are available for any information request. Our team will get back to you within 24 hours." />

      <div className="contact-grid reveal">
        {[
          { label: 'Address', value: 'ZI Sidi Abdelhamid\n4000 Sousse, Tunisia' },
          { label: 'Phone', value: '+216 73 320 399' },
          { label: 'Fax', value: '+216 73 320 373' },
        ].map((item) => (
          <div className="contact-item" key={item.label}>
            <strong>{item.label}</strong>
            <span style={{ whiteSpace: 'pre-line' }}>{item.value}</span>
          </div>
        ))}
      </div>

      <form className="contact-form reveal" onSubmit={handleSubmit}>
        <input name="name" placeholder="Your Name" value={form.name} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Your Email" value={form.email} onChange={handleChange} required />
        <input name="subject" placeholder="Subject" value={form.subject} onChange={handleChange} />
        <textarea name="message" placeholder="Your Message" value={form.message} onChange={handleChange} required />
        <button type="submit" className={`contact-submit${sent ? ' sent' : ''}`}>
          {sent ? 'Message Sent ✓' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}

/* ── Footer ── */
function Footer() {
  return (
    <footer className="footer">
      © 2026 <span>Mitech Tunisie</span> — Gruppo Mastrotto &nbsp;·&nbsp;
      ZI Sidi Abdelhamid, 4000 Sousse &nbsp;·&nbsp;
      Developed by <a href="#">Elaa &amp; Nour</a>
    </footer>
  );
}

/* ════════════════════════════════
   MAIN LANDING COMPONENT
════════════════════════════════ */
export default function Landing() {
  const [activeSection, setActiveSection] = useState('home');
  useReveal();

  useEffect(() => {
    const SECTIONS = ['home', 'about', 'history', 'group', 'products', 'process', 'certifications', 'customers', 'contact'];
    const onScroll = () => {
      let current = 'home';
      for (const id of SECTIONS) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) current = id;
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="landing-scope">
      <Navbar activeSection={activeSection} />
      <Hero />
      <StatsBar />
      <About />
      <History />
      <Group />
      <Products />
      <Process />
      <Certifications />
      <Customers />
      <Contact />
      <Footer />
    </div>
  );
}