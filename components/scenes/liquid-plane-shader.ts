export const liquidPlaneVertexShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uBulge;
  uniform float uPointerStrength;
  uniform float uAspect;
  uniform float uCornerRadius;
  uniform float uSkew;
  uniform float uTime;
  uniform vec2 uPointer;

  void main() {
    vUv = uv;
    float pointerDistance = distance(uv, uPointer);
    float ripple = sin(pointerDistance * 28.0 - uTime * 2.8)
      * exp(-pointerDistance * 8.5)
      * uPointerStrength;
    float centerLift = sin(uv.x * 3.14159265) * sin(uv.y * 3.14159265);
    vec3 transformed = position;
    transformed.x += transformed.y * uSkew;
    transformed.z += ripple * 0.018 + centerLift * uBulge * 2.4;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`

export const liquidPlaneFragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uAspect;
  uniform float uCornerRadius;
  uniform float uPointerStrength;
  uniform float uTime;
  uniform float uUvShift;
  uniform sampler2D uTexture;
  uniform vec2 uCover;
  uniform vec2 uCoverOffset;
  uniform vec2 uPointer;

  void main() {
    vec2 uv = (vUv - 0.5) * uCover + 0.5;
    uv += uCoverOffset;
    float pointerDistance = distance(vUv, uPointer);
    float ring = sin(pointerDistance * 30.0 - uTime * 2.8)
      * exp(-pointerDistance * 8.0)
      * uPointerStrength
      * 0.009;
    vec2 direction = normalize(vUv - uPointer + vec2(0.0001));
    uv += direction * ring;
    uv.x += uUvShift * (0.5 - abs(vUv.y - 0.5));
    vec4 color = texture2D(uTexture, uv);
    vec2 roundedPoint = vec2((vUv.x - 0.5) * uAspect, vUv.y - 0.5);
    vec2 halfSize = vec2(uAspect * 0.5, 0.5) - vec2(uCornerRadius);
    vec2 cornerDistance = abs(roundedPoint) - halfSize;
    float roundedDistance = length(max(cornerDistance, 0.0))
      + min(max(cornerDistance.x, cornerDistance.y), 0.0)
      - uCornerRadius;
    float roundedMask = 1.0 - smoothstep(-0.002, 0.002, roundedDistance);
    gl_FragColor = vec4(color.rgb, color.a * roundedMask);
    #include <colorspace_fragment>
  }
`
