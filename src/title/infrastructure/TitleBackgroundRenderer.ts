import { Application, Color, Container, Graphics, Ticker } from "pixi.js";

/**
 * PixiJS 기반 타이틀 배경 월드를 생성하고 갱신한다.
 */
export class TitleBackgroundRenderer {
  private app: Application | null = null;

  private stageRoot: Container | null = null;

  private gridLines: Graphics | null = null;

  private glowBand: Graphics | null = null;

  private elapsedSeconds = 0;

  /**
   * 지정한 DOM 컨테이너에 Pixi 캔버스를 연결한다.
   *
   * @param container Pixi 캔버스를 부착할 HTML 요소
   * @returns 초기화 완료 Promise
   */
  public async attach(container: HTMLElement): Promise<void> {
    if (this.app !== null) {
      return;
    }

    const app = new Application();
    await app.init({
      resizeTo: container,
      antialias: true,
      autoDensity: true,
      backgroundAlpha: 0,
    });

    container.appendChild(app.canvas);

    const stageRoot = new Container();
    const gridLines = new Graphics();
    const glowBand = new Graphics();

    stageRoot.addChild(gridLines);
    stageRoot.addChild(glowBand);
    app.stage.addChild(stageRoot);

    this.app = app;
    this.stageRoot = stageRoot;
    this.gridLines = gridLines;
    this.glowBand = glowBand;

    app.renderer.on("resize", this.handleResize);
    app.ticker.add(this.handleTick);
    this.renderFrame();
  }

  /**
   * Pixi 배경 리소스를 해제한다.
   *
   * @returns 없음
   */
  public destroy(): void {
    if (this.app === null) {
      return;
    }

    this.app.renderer.off("resize", this.handleResize);
    this.app.ticker.remove(this.handleTick);
    this.app.destroy(true, {
      children: true,
      texture: true,
    });

    this.app = null;
    this.stageRoot = null;
    this.gridLines = null;
    this.glowBand = null;
    this.elapsedSeconds = 0;
  }

  private readonly handleResize = (): void => {
    this.renderFrame();
  };

  private readonly handleTick = (ticker: Ticker): void => {
    this.elapsedSeconds += ticker.deltaMS / 1000;
    this.renderFrame();
  };

  private renderFrame(): void {
    if (
      this.app === null ||
      this.stageRoot === null ||
      this.gridLines === null ||
      this.glowBand === null
    ) {
      return;
    }

    const width = this.app.renderer.width;
    const height = this.app.renderer.height;

    this.stageRoot.position.set(width / 2, height / 2);
    this.renderGrid(width, height);
    this.renderGlow(width, height);
  }

  private renderGrid(width: number, height: number): void {
    if (this.gridLines === null) {
      return;
    }

    const spacing = Math.max(Math.min(width, height) / 8, 64);
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const offset = (this.elapsedSeconds * 24) % spacing;

    this.gridLines.clear();
    this.gridLines.setStrokeStyle({
      width: 1,
      color: new Color("#5CE1E6"),
      alpha: 0.24,
    });

    for (let x = -halfWidth - spacing; x <= halfWidth + spacing; x += spacing) {
      const translatedX = x + offset;
      this.gridLines.moveTo(translatedX, -halfHeight - spacing);
      this.gridLines.lineTo(translatedX + halfHeight * 0.35, halfHeight + spacing);
    }

    for (let y = -halfHeight - spacing; y <= halfHeight + spacing; y += spacing) {
      this.gridLines.moveTo(-halfWidth - spacing, y);
      this.gridLines.lineTo(halfWidth + spacing, y);
    }
  }

  private renderGlow(width: number, height: number): void {
    if (this.glowBand === null) {
      return;
    }

    const bandWidth = width * 0.28;
    const baseX = Math.sin(this.elapsedSeconds * 0.35) * width * 0.18;
    const halfHeight = height / 2;

    this.glowBand.clear();
    this.glowBand.rect(baseX - bandWidth / 2, -halfHeight, bandWidth, height);
    this.glowBand.fill({
      color: new Color("#F6C344"),
      alpha: 0.1,
    });
  }
}
