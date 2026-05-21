import { DiscordIcon, LinkedinIcon } from './icons';

/** Links sociais verticais (Discord, LinkedIn) — placeholders por enquanto. */
export function SocialLinks() {
  return (
    <div className="pfx-hero__social">
      <span className="pfx-social-ico pfx-social-ico--discord" title="Discord (em breve)">
        <DiscordIcon />
      </span>
      <span className="pfx-social-ico pfx-social-ico--linkedin" title="LinkedIn (em breve)">
        <LinkedinIcon />
      </span>
    </div>
  );
}
