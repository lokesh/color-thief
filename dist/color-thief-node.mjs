import{getPixels as t}from"ndarray-pixels";import o from"@lokesh.dhakar/quantize";import n from"sharp";var r=function(r,e,u){void 0===e&&(e=10),void 0===u&&(u=10);var a=function(t){var o=t.colorCount,n=t.quality;if(void 0!==o&&Number.isInteger(o)){if(1===o)throw new Error("colorCount should be between 2 and 20. To get one color, call getColor() instead of getPalette()");o=Math.max(o,2),o=Math.min(o,20)}else o=10;return(void 0===n||!Number.isInteger(n)||n<1)&&(n=10),{colorCount:o,quality:n}}({colorCount:e,quality:u});return new Promise(function(e,u){(function(o){return new Promise(function(r,e){n(o).toBuffer().then(function(t){return n(t).metadata().then(function(o){return{buffer:t,format:o.format}})}).then(function(o){return t(o.buffer,o.format)}).then(r).catch(e)})})(r).then(function(t){var n=t.shape[0]*t.shape[1],r=function(t,o,n){for(var r=[],e=0;e<o;e+=n){var u=4*e,a=t[u+0],i=t[u+1],f=t[u+2],c=t[u+3];(void 0===c||c>=125)&&(a>250&&i>250&&f>250||r.push([a,i,f]))}return r}(Array.from(t.data),n,a.quality),u=o(r,a.colorCount),i=u?u.palette():null;e(i)}).catch(function(t){u(t)})})};module.exports={getColor:function(t,o){return void 0===o&&(o=10),new Promise(function(n,e){r(t,5,o).then(function(t){n(t[0])}).catch(function(t){e(t)})})},getPalette:r};
