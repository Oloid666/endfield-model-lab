export const config = {
  dpr: { low: 1, balanced: 1.15, high: 1.5 },
  reflection: { low: 192, balanced: 384, high: 512 },
  rainCount: { low: 650, balanced: 1400, high: 2200 },
  views: {
    street: { position: [13.8, 8.6, 18.5], target: [0, 2.1, .3], mobilePosition: [22, 14.8, 30], mobileTarget: [0, 1.8, .4] },
    store: { position: [1.3, 4.2, 12.6], target: [0, 1.8, -.25], mobilePosition: [3.1, 5.8, 16], mobileTarget: [0, 2, 0] },
    awning: { position: [4.7, 3.3, 10.7], target: [.9, 1.3, 2.3], mobilePosition: [2.9, 3.3, 16], mobileTarget: [1.1, 1.35, 2.5] },
  },
  zhuangNodes: { spine:80, head:83, eyeL:85, eyeR:90, armL:338, elbowL:340, wristL:342, armR:385, elbowR:387, wristR:389 },
  eyelids: [[132,143],[134,142],[137,141],[146,157],[148,156],[151,155]],
};
