// jsdom doesn't implement <audio>/<video> playback: HTMLMediaElement.play()
// resolves to undefined instead of a Promise there. audioStore.playSfx's
// `el.play().catch(() => {})` throws synchronously on that undefined, and
// since CyberButton fires playSfx *before* the caller's own onClick, that
// throw silently ate every click on a CyberButton in component tests before
// this stub existed. Import this file (for its side effect) in any jsdom
// test that renders CyberButton or otherwise triggers audioStore playback.
if (typeof window !== 'undefined') {
  window.HTMLMediaElement.prototype.play = () => Promise.resolve()
  window.HTMLMediaElement.prototype.pause = () => {}
}
