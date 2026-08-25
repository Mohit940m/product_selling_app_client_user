import Container from './Container';

const Footer = () => {
  return (
    <footer className="border-t border-line bg-card">
      <Container className="flex flex-col gap-2 py-5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold text-ink">ShopNow</p>
        <p>Discover and shop from thousands of products.</p>
      </Container>
    </footer>
  );
};

export default Footer;
