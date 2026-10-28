export const minimumJerk=t=>{const x=Math.max(0,Math.min(1,t));return x*x*x*(x*(x*6-15)+10);};
export const createDampedMotion=value=>({value,velocity:0});

// Analytic critically damped motion. Stable at different display refresh rates.
// Position and velocity stay continuous when individual wheel events arrive.
export function advanceDampedMotion(state,target,seconds,frequency=9.5){
 const dt=Math.max(0,Math.min(.1,seconds));
 if(!dt)return state;
 const old=state.value,delta=old-target,decay=Math.exp(-frequency*dt);
 const impulse=(state.velocity+frequency*delta)*dt;
 state.value=target+(delta+impulse)*decay;
 state.velocity=(state.velocity-frequency*impulse)*decay;
 if((target-old)*(target-state.value)<0){state.value=target;state.velocity=0;}
 if(Math.abs(state.value-target)<1e-7&&Math.abs(state.velocity)<1e-6){state.value=target;state.velocity=0;}
 return state;
}
