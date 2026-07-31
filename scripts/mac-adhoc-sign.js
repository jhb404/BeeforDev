/*
 * Hook `afterPack` do electron-builder (somente macOS).
 *
 * Problema que resolve:
 *   O build usa `mac.identity: null`, então o electron-builder NÃO assina o .app.
 *   O electron-builder, porém, altera o bundle (renomeia o binário, injeta o asar,
 *   troca Info.plist/ícone), o que invalida a assinatura ad-hoc que o Electron já
 *   trazia. Resultado num Mac (obrigatório em Apple Silicon): o bundle não tem
 *   assinatura válida e o macOS mostra "app está danificado — mover para o Lixo".
 *   Nesse cenário `xattr -cr` não resolve, porque o problema não é a quarentena.
 *
 * O que fazemos aqui:
 *   1. Garante bit de execução nos binários auxiliares (cloudflared) — o bit é
 *      perdido quando o arquivo vem de um checkout feito no Windows.
 *   2. Assina o bundle inteiro ad-hoc (`codesign --sign -`), exatamente o que o
 *      usuário fazia à mão depois de instalar.
 *   3. Verifica a assinatura e falha o build se ela não estiver válida.
 *
 * Depois disso o usuário final só precisa lidar com a quarentena do download
 * (um `xattr -dr com.apple.quarantine`, sem sudo, ou "Abrir mesmo assim" nos
 * Ajustes do Sistema). Para zero comandos, é necessário Developer ID +
 * notarização — ver docs/10-build-empacotamento/macos-assinatura.md.
 */
const { execFileSync } = require('node:child_process');
const { chmodSync, existsSync } = require('node:fs');
const path = require('node:path');

/** Binários extras copiados via extraResources que precisam de +x no macOS. */
const HELPER_BINARIES = ['cloudflared-darwin'];

/** Se houver certificado real configurado, deixa o electron-builder assinar. */
function hasRealIdentity() {
  return Boolean(process.env.CSC_LINK || process.env.CSC_NAME || process.env.CSC_KEY_PASSWORD);
}

exports.default = async function macAdhocSign(context) {
  if (context.electronPlatformName !== 'darwin') return;

  if (process.platform !== 'darwin') {
    console.warn(
      '[mac-adhoc-sign] host não é macOS — codesign indisponível. ' +
        'O .app sairá sem assinatura e será recusado pelo Gatekeeper. ' +
        'Empacote o macOS em runner macos-latest.',
    );
    return;
  }

  if (hasRealIdentity()) {
    console.log('[mac-adhoc-sign] CSC_* presente — pulando assinatura ad-hoc.');
    return;
  }

  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  if (!existsSync(appPath)) {
    throw new Error(`[mac-adhoc-sign] bundle não encontrado: ${appPath}`);
  }

  for (const name of HELPER_BINARIES) {
    const bin = path.join(appPath, 'Contents', 'Resources', name);
    if (!existsSync(bin)) continue;
    chmodSync(bin, 0o755);
    console.log(`[mac-adhoc-sign] chmod +x ${name}`);
  }

  // --deep assina também os binários aninhados (helpers do Electron, cloudflared).
  // Apple desencoraja --deep para distribuição notarizada, mas para ad-hoc
  // interno é o caminho mais simples e é o que já se sabe funcionar.
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' });
  execFileSync('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath], {
    stdio: 'inherit',
  });

  console.log(`[mac-adhoc-sign] assinado ad-hoc: ${path.basename(appPath)}`);
};
