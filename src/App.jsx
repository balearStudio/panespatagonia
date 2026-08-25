import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import BreadCarousel from "./components/BreadCarousel.jsx";
import About from "./components/About.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <BreadCarousel />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
