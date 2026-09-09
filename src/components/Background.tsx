/**
 * Full-bleed room backdrop, driven by `public/background.webp`. With no file
 * present it falls back to a plain, unobtrusive neutral tone instead of an
 * illustrated scene.
 */
export function Background() {
  return (
    <div className="room-background" aria-hidden="true">
      <div className="room-photo" />
      <div className="room-scrim" />
    </div>
  );
}
