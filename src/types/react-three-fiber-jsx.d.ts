import type React from "react";

type ThreeJsxElement = any;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      group: ThreeJsxElement;
      mesh: ThreeJsxElement;
      sphereGeometry: ThreeJsxElement;
      boxGeometry: ThreeJsxElement;
      cylinderGeometry: ThreeJsxElement;
      capsuleGeometry: ThreeJsxElement;
      coneGeometry: ThreeJsxElement;
      torusGeometry: ThreeJsxElement;
      planeGeometry: ThreeJsxElement;
      edgesGeometry: ThreeJsxElement;
      lineSegments: ThreeJsxElement;
      meshStandardMaterial: ThreeJsxElement;
      meshBasicMaterial: ThreeJsxElement;
      lineBasicMaterial: ThreeJsxElement;
      ambientLight: ThreeJsxElement;
      directionalLight: ThreeJsxElement;
      pointLight: ThreeJsxElement;
      spotLight: ThreeJsxElement;
      hemisphereLight: ThreeJsxElement;
      gridHelper: ThreeJsxElement;
      color: ThreeJsxElement;
      torusKnotGeometry: ThreeJsxElement;
      circleGeometry: ThreeJsxElement;
      ringGeometry: ThreeJsxElement;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: ThreeJsxElement;
      mesh: ThreeJsxElement;
      sphereGeometry: ThreeJsxElement;
      boxGeometry: ThreeJsxElement;
      cylinderGeometry: ThreeJsxElement;
      capsuleGeometry: ThreeJsxElement;
      coneGeometry: ThreeJsxElement;
      torusGeometry: ThreeJsxElement;
      planeGeometry: ThreeJsxElement;
      edgesGeometry: ThreeJsxElement;
      lineSegments: ThreeJsxElement;
      meshStandardMaterial: ThreeJsxElement;
      meshBasicMaterial: ThreeJsxElement;
      lineBasicMaterial: ThreeJsxElement;
      ambientLight: ThreeJsxElement;
      directionalLight: ThreeJsxElement;
      pointLight: ThreeJsxElement;
      spotLight: ThreeJsxElement;
      hemisphereLight: ThreeJsxElement;
      gridHelper: ThreeJsxElement;
      color: ThreeJsxElement;
      torusKnotGeometry: ThreeJsxElement;
      circleGeometry: ThreeJsxElement;
      ringGeometry: ThreeJsxElement;
    }
  }
}

export {};
