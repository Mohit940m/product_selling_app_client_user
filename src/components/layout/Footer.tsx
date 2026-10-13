import { Link } from 'react-router-dom';
import Container from './Container';

const Footer = () => {
  return (
    <footer className="border-t border-line bg-card">
      <Container className="flex flex-col gap-2 py-5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold text-ink">ShopNow</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
          <p>Discover and shop from thousands of products.</p>
          <Link to="/privacy" className="font-semibold text-ink hover:text-accent hover:underline">
            Privacy policy
          </Link>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
