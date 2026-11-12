// The fake ending and the following prompt share one pausable mission clock.
export const FAKE_END_DURATION=4.05;
export const LANDING_SETTLE_DURATION=2.8;
export const DINNER_CLOSING={start:30,title:32.3,end:34};
export function endingTitle(age=0){
 if(age<1.2)return 'Fin.';
 if(age<1.65)return 'Fin..';
 if(age<2.1)return 'Fin...';
 if(age<2.55)return 'Fin....';
 return 'Fin....?';
}
