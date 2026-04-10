import { useEffect, useRef } from "react";
import type { JSX } from "react";
import { TitleBackgroundRenderer } from "../infrastructure/TitleBackgroundRenderer.js";

/**
 * PixiJS 타이틀 배경 캔버스를 DOM에 연결한다.
 *
 * @returns 배경 캔버스를 위한 컨테이너
 */
export function TitleBackgroundCanvas(): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (container === null) {
      return;
    }

    const renderer = new TitleBackgroundRenderer();
    let disposed = false;

    void renderer.attach(container).then(() => {
      if (disposed) {
        renderer.destroy();
      }
    });

    return () => {
      disposed = true;
      renderer.destroy();
    };
  }, []);

  return <div className="title-background-canvas" ref={containerRef} aria-hidden="true" />;
}
