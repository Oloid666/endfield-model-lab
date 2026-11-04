import {handleFeedback} from '../../server/feedback.js';
export const onRequest=({request,env})=>handleFeedback(request,env);
