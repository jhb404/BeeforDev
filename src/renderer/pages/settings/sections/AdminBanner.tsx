interface AdminBannerProps {
  visible: boolean;
  onElevate: () => void;
  onDismiss: () => void;
}

export function AdminBanner(_props: AdminBannerProps) {
  return null;
}

// export function AdminBanner({ visible, onElevate, onDismiss }: AdminBannerProps) {
//   if (!visible) return null;
//   return (
//     <div className="admin-banner">
//       <div>
//         <strong>Alarmes funcionam melhor como administrador</strong>
//         <p>
//           Opcional — reinicie elevado se os alarmes não tocarem em segundo plano.
//         </p>
//       </div>
//       <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
//         <button className="warm" onClick={onElevate}>
//           Reiniciar como admin
//         </button>
//         <button
//           className="secondary compact"
//           onClick={onDismiss}
//           title="Não mostrar novamente"
//         >
//           ✕
//         </button>
//       </div>
//     </div>
//   );
// }
