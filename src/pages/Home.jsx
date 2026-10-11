import { useEffect } from "react";
import { PAGES } from "../data/content.js";
import Navbar from "../components/Navbar.jsx";
import Hero from "../components/Hero.jsx";
import About from "../components/About.jsx";
import Hikes from "../components/Hikes.jsx";
import Destinations from "../components/Destinations.jsx";
import Included from "../components/Included.jsx";
import Guide from "../components/Guide.jsx";
import Services from "../components/Services.jsx";
import Testimonials from "../components/Testimonials.jsx";
import Faq from "../components/Faq.jsx";
import Footer from "../components/Footer.jsx";

export default function Home() {
  useEffect(() => {
    document.title = "API Touch — Guided Tours & Vacations";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", PAGES["/"].description);
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Hikes />
        <Destinations />
        <Included />
        <Guide />
        <Services />
        <Testimonials />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
