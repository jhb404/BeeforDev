const GIF_URL = 'https://media1.tenor.com/m/cUDKyJkDr6kAAAAd/iron-man-iron-man-hammer.gif';

/** Placeholder enquanto a tela de variantes de ícone está em construção. */
export function ComingSoonView() {
  return (
    <div className="coming-soon">
      <div className="coming-soon__media">
        <img className="coming-soon__gif" src={GIF_URL} alt="Trabalhando nisso" />
      </div>
      <span className="coming-soon__badge">🚧 Em breve</span>
      <h3 className="coming-soon__title">To trabaiando nisso, carma!</h3>
      <p className="coming-soon__text">
        Vai ter umas coisa ai pra tu editar o perfil viu. Vorte logo!
      </p>
    </div>
  );
}
