export const config = {
  dpr: { low: 1, balanced: 1.25, high: 1.5 },
  reflection: { low: 192, balanced: 384, high: 512 },
  rainCount: { low: 650, balanced: 1400, high: 2200 },
  views: {
    plan: {position:[0,30,4.1],target:[0,0,4],mobilePosition:[0,38,4.1],mobileTarget:[0,0,4]},
    street: { position: [14, 11.5, 20], target: [0, 1.8, 1], mobilePosition: [23, 17.4, 30], mobileTarget: [0, 1.8, 1] },
    store: { position: [.2, 3.7, 13.8], target: [0, 1.6, -.2], mobilePosition: [1, 4.3, 20], mobileTarget: [0, 1.7, -.2] },
    awning: { position: [2.8, 2.9, 9.8], target: [-1.45, 1.25, 2.5], mobilePosition: [-.45, 2.3, 9.5], mobileTarget: [-1.6, 1.25, 2.5] },
    detail: { position: [-.92,2.02,5.04],target:[-1.25,1.87,2.48],mobilePosition:[-1.07,2.04,5.45],mobileTarget:[-1.25,1.88,2.48]},
    story:{position:[1.2,2.5,10.3],target:[-1.5,.85,2.5],mobilePosition:[-.45,2.3,10.4],mobileTarget:[-1.6,.35,2.5]},
  },
  zhuangNodes: { pelvis:13,hipL:55,kneeL:56,footL:57,hipR:33,kneeR:34,footR:35,spine:80, head:83, eyeL:85, eyeR:90, armL:338, elbowL:340, wristL:342, armR:385, elbowR:387, wristR:389 },
  eyelids: [[132,143],[134,142],[137,141],[146,157],[148,156],[151,155]],
};
