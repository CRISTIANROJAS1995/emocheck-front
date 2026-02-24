/**
 * Minimal Buffer type shim for @vladmandic/face-api.
 * The library's type definitions reference Node.js Buffer, but we only
 * use the browser side of face-api (no file-system operations).
 */
declare type Buffer = ArrayBufferLike;
