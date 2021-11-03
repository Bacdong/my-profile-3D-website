import { CanvasStore, DestroyedService, LoaderService, ThreeVector3 } from "@angular-three/core";
import { DOCUMENT } from "@angular/common";
import { ChangeDetectionStrategy, Component, Inject, OnInit } from "@angular/core";
import { forkJoin, fromEvent } from "rxjs";
import { map, startWith, switchMap, take, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import * as THREE from "three";

@Component({
  selector: "app-scene",
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyedService],
})
export class SceneComponent implements OnInit {
  starPositions: ThreeVector3[] = Array.from({ length: 200 })
    .fill(undefined)
    .map(() => [
      THREE.MathUtils.randFloatSpread(100),
      THREE.MathUtils.randFloatSpread(100),
      THREE.MathUtils.randFloatSpread(100),
    ]);

  avatarTexture$ = this.loaderService.use(
    THREE.TextureLoader,
    "/assets/avatar.jpeg"
  );

  moonTextures$ = forkJoin([
    this.loaderService.use(THREE.TextureLoader, "/assets/moon.jpeg"),
    this.loaderService.use(THREE.TextureLoader, "/assets/normal.jpeg"),
  ]).pipe(map(([moon, normal]) => ({ moon, normal })));

  moon?: THREE.Mesh;
  avatar?: THREE.Mesh;

  constructor(
    @Inject(DOCUMENT) private readonly doc: Document,
    private readonly loaderService: LoaderService,
    private readonly canvasStore: CanvasStore,
    private readonly destroyed: DestroyedService
  ) {}

  ngOnInit() {
    this.canvasStore.scene$
      .pipe(
        take(1),
        switchMap((scene) => 
          this.loaderService
            .use(THREE.TextureLoader, "/assets/space.jpeg")
            .pipe(
              take(1),
              tap((space) => {
                if (scene) {
                  scene.background = space;
                }
              })
            )
        )
      )
      .subscribe();

    fromEvent(this.doc, "scroll")
      .pipe(
        map(() => this.doc.body.getBoundingClientRect().top),
        startWith(0),
        withLatestFrom(this.canvasStore.camera$),
        takeUntil(this.destroyed)
      )
      .subscribe(([top, camera]) => {
        if (this.moon) {
          this.moon.rotation.x += 0.05;
          this.moon.rotation.y += 0.075;
          this.moon.rotation.z += 0.05;
        }

        if (this.avatar) {
          this.avatar.rotation.y += 0.01;
          this.avatar.rotation.z += 0.01;
        }

        if (camera) {
          camera.position.z = top * -0.01;
          camera.position.x = top * -0.0002;
          camera.rotation.y = top * -0.0002;
        }
      });
  }

  onTorusAnimateReady(torus: THREE.Mesh) {
    torus.rotation.x += 0.01;
    torus.rotation.y += 0.005;
    torus.rotation.z += 0.01;
  }

  onMoonAnimateReady(moon: THREE.Mesh) {
    moon.rotation.x += 0.005;
  }
}