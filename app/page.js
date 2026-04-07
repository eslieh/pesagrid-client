export const metadata = {
  title: "Stop Chasing Payments. Start Scaling. | PesaGrid",
  description: "Automate reconciliation across M-PESA, bank transfers, and more. Built for modern Kenyan businesses.",
};

export default function Home() {
  const LandingClient = require("./pesagrid/components/LandingClient").default;
  return <LandingClient />;
}
