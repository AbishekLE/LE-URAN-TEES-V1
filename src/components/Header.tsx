import { SHOP } from '../constants';
import logoUrl from '../assets/logo.png';

export function Header() {
  return (
    <header className="brand-header">
      <img className="brand-logo" src={logoUrl} alt="LE URBAN TEES logo" width={96} height={96} />
      <div className="brand-inner">
        <h1 className="brand-name">
          <span>{SHOP.nameWhite}</span> <span className="accent">{SHOP.nameAccent}</span>
        </h1>
        <p className="brand-meta">
          <span>{SHOP.address}</span>
          <span className="dot" aria-hidden="true">
            •
          </span>
          <span>Instagram: @{SHOP.instagram}</span>
        </p>
      </div>
    </header>
  );
}
