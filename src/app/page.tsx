import { CartDrawer } from "@/components/cart/CartDrawer";
import { ScrollExperience } from "@/components/experience/ScrollExperience";
import { IntroAnimation } from "@/components/intro/IntroAnimation";
import { FloatingSocialButtons } from "@/components/layout/FloatingSocialButtons";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AcaiBuilder } from "@/components/sections/AcaiBuilder";
import { ContactSection } from "@/components/sections/ContactSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { Gallery } from "@/components/sections/Gallery";
import { IngredientsSection } from "@/components/sections/IngredientsSection";
import { MenuSection } from "@/components/sections/MenuSection";
import { JsonLd } from "@/components/JsonLd";

export default function Home() {
  return (
    <>
      <IntroAnimation />
      <Header />
      <main id="conteudo">
        <ScrollExperience />
        <IngredientsSection />
        <MenuSection />
        <AcaiBuilder />
        <ExperienceSection />
        <Gallery />
        <ContactSection />
      </main>
      <Footer />
      <CartDrawer />
      <FloatingSocialButtons />
      <JsonLd />
    </>
  );
}
