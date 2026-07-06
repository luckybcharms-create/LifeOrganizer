import { useRef, useState } from 'react';

// iOS-style swipe-left-to-reveal-actions row. Actions render right-aligned
// behind the content; dragging the content left reveals them, past a
// halfway threshold it snaps fully open, otherwise it snaps shut.
export default function SwipeableRow({ actions, children, className }) {
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startTranslateRef = useRef(0);
  const actionsRef = useRef(null);
  const widthRef = useRef(0);
  const movedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const pointerIdRef = useRef(null);

  function close() {
    setTranslateX(0);
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    widthRef.current = actionsRef.current?.offsetWidth || 0;
    draggingRef.current = true;
    movedRef.current = false;
    pointerIdRef.current = e.pointerId;
    setDragging(true);
    startXRef.current = e.clientX;
    startTranslateRef.current = translateX;
    // Pointer capture is deferred to the first real move (see onPointerMove) —
    // capturing immediately here retargets the eventual "click" event to this
    // wrapper instead of whatever inner button was actually tapped, which
    // silently swallows plain taps on buttons like "Mark Today".
  }

  function onPointerMove(e) {
    if (!draggingRef.current) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 4 && !movedRef.current) {
      movedRef.current = true;
      e.currentTarget.setPointerCapture?.(pointerIdRef.current);
    }
    let next = startTranslateRef.current + delta;
    const min = -widthRef.current;
    if (next > 0) next = 0;
    if (next < min) next = min;
    setTranslateX(next);
  }

  function endDrag() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    // A drag that actually moved the row generates a trailing native "click"
    // event on release (same target, same position family) — swallow that
    // one click so it doesn't immediately re-close the row it just opened
    // or activate whatever sits underneath it.
    if (movedRef.current) {
      suppressClickRef.current = true;
    }
    setTranslateX((current) => {
      const threshold = widthRef.current / 2;
      return current < -threshold ? -widthRef.current : 0;
    });
  }

  function onContentClickCapture(e) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (translateX !== 0) {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  }

  function runAction(fn) {
    return (e) => {
      e.stopPropagation();
      close();
      fn();
    };
  }

  return (
    <div className={`swipe-row ${className || ''}`}>
      {actions && actions.length > 0 && (
        <div className="swipe-row-actions" ref={actionsRef}>
          {actions.map((a, idx) => (
            <button
              key={idx}
              type="button"
              className={`swipe-action swipe-action-${a.tone || 'edit'}`}
              onClick={runAction(a.onClick)}
              aria-label={a.label}
            >
              {a.icon}
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      )}
      <div
        className={`swipe-row-content ${dragging ? 'dragging' : ''}`}
        style={{ transform: `translateX(${translateX}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onContentClickCapture}
      >
        {children}
      </div>
    </div>
  );
}
