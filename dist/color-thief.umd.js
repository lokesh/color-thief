!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t||self).ColorThief=e()}(this,function(){function t(){var e,n,r;function i(){var t,n=[{min:Number.MAX_VALUE,max:Number.MIN_VALUE},{min:Number.MAX_VALUE,max:Number.MIN_VALUE},{min:Number.MAX_VALUE,max:Number.MIN_VALUE}];for(t=e.length-1;t>=0;t-=1)n[0].min=e[t][0]<n[0].min?e[t][0]:n[0].min,n[1].min=e[t][1]<n[1].min?e[t][1]:n[1].min,n[2].min=e[t][2]<n[2].min?e[t][2]:n[2].min,n[0].max=e[t][0]>n[0].max?e[t][0]:n[0].max,n[1].max=e[t][1]>n[1].max?e[t][1]:n[1].max,n[2].max=e[t][2]>n[2].max?e[t][2]:n[2].max;return n}function o(){var t,e,i=0,o=0;for(t=r-1;t>=0;t-=1)(e=n[t].max-n[t].min)>o&&(i=t,o=e);return{axis:i,length:o}}function a(t){return function(e,n){return e[t]-n[t]}}function u(){var t=a(o().axis);return Array.prototype.sort.call(e,t),e}function s(){var t,n,r,i=0,a=Number.MAX_VALUE,u=o().axis;for(r=e.length-1;r>=0;r-=1)i+=e[r][u];for(i/=e.length,r=e.length-1;r>=0;r-=1)(n=Math.abs(e[r][u]-i))<a&&(a=n,t=r);return t}return{get_data:function(){return e},median_pos:function(){return Math.floor(e.length/2)},get_bounding_box:function(){return n},calculate_bounding_box:i,sort:u,get_comparison_func:a,mean_pos:s,split:function(){u();var n=s(),r=Array.prototype.slice.call(e,0,n),i=Array.prototype.slice.call(e,n),o=new t,a=new t;return o.init(r),a.init(i),[o,a]},is_empty:function(){return 0===e.length},is_splittable:function(){return e.length>=2},get_longest_axis:o,average:function(){var t,n=0,r=0,i=0;for(t=e.length-1;t>=0;t-=1)n+=e[t][0],r+=e[t][1],i+=e[t][2];return n/=e.length,r/=e.length,i/=e.length,[parseInt(n,10),parseInt(r,10),parseInt(i,10)]},init:function(t){e=t,r=3,n=i()}}}function e(){var e=[],n=[];function r(n){var r=!1;if(function(t){return t.length>0}(n)){var i=new t;i.init(n),e=[i],r=!0}return r}function i(){var t,n=0;for(t=e.length-1;t>=0;t-=1)e[t]>n&&(n=e[t]);return n}return{get_boxes:function(){return e},init:function(t){r(t)&&(n=t)},get_fixed_size_palette:function(t){var o,a,u,s,l=[];if(r(n),0===e.length)return[];for(o=t-1;o>=0;o-=1)a=i(),(u=e.splice(a,1)[0]).is_splittable()?(s=u.split(),e.push(s[0]),e.push(s[1])):(e.push(u),e.push(u));for(o=t-1;o>=0;o-=1)l.push(e[o].average());return l},get_dynamic_size_palette:function(t){var o,a,u,s,l,g,c,h;if(r(n),0===e.length)return[];a=[],s=i(),g=(l=e[s].get_longest_axis()).length*(1-t);do{h=(c=e.splice(s,1)[0].split())[1],e.push(c[0]),e.push(h),s=i(),l=e[s].get_longest_axis()}while(l.length>g);for(u=0;u<e.length;u+=1)o=e[u].average(),isNaN(o[0])&&isNaN(o[0])&&isNaN(o[0])||a.push(e[u].average());return a}}}var n=function(t){this.canvas=document.createElement("canvas"),this.context=this.canvas.getContext("2d"),this.width=this.canvas.width=t.naturalWidth,this.height=this.canvas.height=t.naturalHeight,this.context.drawImage(t,0,0,this.width,this.height)};n.prototype.getImageData=function(){return this.context.getImageData(0,0,this.width,this.height)};var r=function(){};return r.prototype.getColor=function(t,e){return void 0===e&&(e=10),this.getPalette(t,5,e)[0]},r.prototype.getPalette=function(t,r,i){console.log("getPalette");var o=new e;console.log(o);var a=function(t){var e=t.colorCount,n=t.quality;if(void 0!==e&&Number.isInteger(e)){if(1===e)throw new Error("colorCount should be between 2 and 20. To get one color, call getColor() instead of getPalette()");e=Math.max(e,2),e=Math.min(e,20)}else e=10;return(void 0===n||!Number.isInteger(n)||n<1)&&(n=10),{colorCount:e,quality:n}}({colorCount:r,quality:i}),u=new n(t),s=function(t,e,n){for(var r,i,o,a,u,s=t,l=[],g=0;g<e;g+=n)i=s[0+(r=4*g)],o=s[r+1],a=s[r+2],(void 0===(u=s[r+3])||u>=125)&&(i>250&&o>250&&a>250||l.push([i,o,a]));return l}(u.getImageData().data,u.width*u.height,a.quality);return o.init(s),o.get_fixed_size_palette(a.colorCount)},r.prototype.getColorFromUrl=function(t,e,n){var r=this,i=document.createElement("img");i.addEventListener("load",function(){var o=r.getPalette(i,5,n);e(o[0],t)}),i.src=t},r.prototype.getImageData=function(t,e){var n=new XMLHttpRequest;n.open("GET",t,!0),n.responseType="arraybuffer",n.onload=function(){if(200==this.status){var t=new Uint8Array(this.response);i=t.length;for(var n=new Array(i),r=0;r<t.length;r++)n[r]=String.fromCharCode(t[r]);var o=n.join(""),a=window.btoa(o);e("data:image/png;base64,"+a)}},n.send()},r.prototype.getColorAsync=function(t,e,n){var r=this;this.getImageData(t,function(t){var i=document.createElement("img");i.addEventListener("load",function(){var t=r.getPalette(i,5,n);e(t[0],this)}),i.src=t})},r});
