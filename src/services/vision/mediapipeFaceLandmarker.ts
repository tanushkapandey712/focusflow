import type { FaceLandmarker } from "@mediapipe/tasks-vision";

const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm";
const MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let faceLandmarkerPromise: Promise<FaceLandmarker> | null = null;

export const getFaceLandmarker = async () => {
  if (!faceLandmarkerPromise) {
    faceLandmarkerPromise = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);

      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_ASSET_PATH,
        },
        runningMode: "VIDEO",
        numFaces: 1,
        minFaceDetectionConfidence: 0.55,
        minFacePresenceConfidence: 0.55,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
      });
    })();
  }

  return faceLandmarkerPromise;
};
