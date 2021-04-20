if(!t)var t={map:function(t,r){var n={};return r?t.map(function(t,e){return n.index=e,r.call(n,t)}):t.slice()},naturalOrder:function(t,r){return t<r?-1:t>r?1:0},sum:function(t,r){var n={};return t.reduce(r?function(t,e,o){return n.index=o,t+r.call(n,e)}:function(t,r){return t+r},0)},max:function(r,n){return Math.max.apply(null,n?t.map(r,n):r)}};var r=function(){function r(t,r,n){return(t<<10)+(r<<5)+n}function n(t){var r=[],n=!1;function e(){r.sort(t),n=!0}return{push:function(t){r.push(t),n=!1},peek:function(t){return n||e(),void 0===t&&(t=r.length-1),r[t]},pop:function(){return n||e(),r.pop()},size:function(){return r.length},map:function(t){return r.map(t)},debug:function(){return n||e(),r}}}function e(t,r,n,e,o,i,a){var u=this;u.r1=t,u.r2=r,u.g1=n,u.g2=e,u.b1=o,u.b2=i,u.histo=a}function o(){this.vboxes=new n(function(r,n){return t.naturalOrder(r.vbox.count()*r.vbox.volume(),n.vbox.count()*n.vbox.volume())})}function i(n,e){if(e.count()){var o=e.r2-e.r1+1,i=e.g2-e.g1+1,a=t.max([o,i,e.b2-e.b1+1]);if(1==e.count())return[e.copy()];var u,c,s,h,f=0,v=[],l=[];if(a==o)for(u=e.r1;u<=e.r2;u++){for(h=0,c=e.g1;c<=e.g2;c++)for(s=e.b1;s<=e.b2;s++)h+=n[r(u,c,s)]||0;v[u]=f+=h}else if(a==i)for(u=e.g1;u<=e.g2;u++){for(h=0,c=e.r1;c<=e.r2;c++)for(s=e.b1;s<=e.b2;s++)h+=n[r(c,u,s)]||0;v[u]=f+=h}else for(u=e.b1;u<=e.b2;u++){for(h=0,c=e.r1;c<=e.r2;c++)for(s=e.g1;s<=e.g2;s++)h+=n[r(c,s,u)]||0;v[u]=f+=h}return v.forEach(function(t,r){l[r]=f-t}),function(t){var r,n,o,i,a,c=t+"1",s=t+"2",h=0;for(u=e[c];u<=e[s];u++)if(v[u]>f/2){for(o=e.copy(),i=e.copy(),a=(r=u-e[c])<=(n=e[s]-u)?Math.min(e[s]-1,~~(u+n/2)):Math.max(e[c],~~(u-1-r/2));!v[a];)a++;for(h=l[a];!h&&v[a-1];)h=l[--a];return o[s]=a,i[c]=o[s]+1,[o,i]}}(a==o?"r":a==i?"g":"b")}}return e.prototype={volume:function(t){var r=this;return r._volume&&!t||(r._volume=(r.r2-r.r1+1)*(r.g2-r.g1+1)*(r.b2-r.b1+1)),r._volume},count:function(t){var n=this,e=n.histo;if(!n._count_set||t){var o,i,a,u=0;for(o=n.r1;o<=n.r2;o++)for(i=n.g1;i<=n.g2;i++)for(a=n.b1;a<=n.b2;a++)u+=e[r(o,i,a)]||0;n._count=u,n._count_set=!0}return n._count},copy:function(){var t=this;return new e(t.r1,t.r2,t.g1,t.g2,t.b1,t.b2,t.histo)},avg:function(t){var n=this,e=n.histo;if(!n._avg||t){var o,i,a,u,c=0,s=0,h=0,f=0;for(i=n.r1;i<=n.r2;i++)for(a=n.g1;a<=n.g2;a++)for(u=n.b1;u<=n.b2;u++)c+=o=e[r(i,a,u)]||0,s+=o*(i+.5)*8,h+=o*(a+.5)*8,f+=o*(u+.5)*8;n._avg=c?[~~(s/c),~~(h/c),~~(f/c)]:[~~(8*(n.r1+n.r2+1)/2),~~(8*(n.g1+n.g2+1)/2),~~(8*(n.b1+n.b2+1)/2)]}return n._avg},contains:function(t){var r=this,n=t[0]>>3;return gval=t[1]>>3,bval=t[2]>>3,n>=r.r1&&n<=r.r2&&gval>=r.g1&&gval<=r.g2&&bval>=r.b1&&bval<=r.b2}},o.prototype={push:function(t){this.vboxes.push({vbox:t,color:t.avg()})},palette:function(){return this.vboxes.map(function(t){return t.color})},size:function(){return this.vboxes.size()},map:function(t){for(var r=this.vboxes,n=0;n<r.size();n++)if(r.peek(n).vbox.contains(t))return r.peek(n).color;return this.nearest(t)},nearest:function(t){for(var r,n,e,o=this.vboxes,i=0;i<o.size();i++)((n=Math.sqrt(Math.pow(t[0]-o.peek(i).color[0],2)+Math.pow(t[1]-o.peek(i).color[1],2)+Math.pow(t[2]-o.peek(i).color[2],2)))<r||void 0===r)&&(r=n,e=o.peek(i).color);return e},forcebw:function(){var r=this.vboxes;r.sort(function(r,n){return t.naturalOrder(t.sum(r.color),t.sum(n.color))});var n=r[0].color;n[0]<5&&n[1]<5&&n[2]<5&&(r[0].color=[0,0,0]);var e=r.length-1,o=r[e].color;o[0]>251&&o[1]>251&&o[2]>251&&(r[e].color=[255,255,255])}},{quantize:function(a,u){if(!a.length||u<2||u>256)return!1;var c=function(t){var n,e=new Array(32768);return t.forEach(function(t){n=r(t[0]>>3,t[1]>>3,t[2]>>3),e[n]=(e[n]||0)+1}),e}(a);c.forEach(function(){});var s=function(t,r){var n,o,i,a=1e6,u=0,c=1e6,s=0,h=1e6,f=0;return t.forEach(function(t){(n=t[0]>>3)<a?a=n:n>u&&(u=n),(o=t[1]>>3)<c?c=o:o>s&&(s=o),(i=t[2]>>3)<h?h=i:i>f&&(f=i)}),new e(a,u,c,s,h,f,r)}(a,c),h=new n(function(r,n){return t.naturalOrder(r.count(),n.count())});function f(t,r){for(var n,e=t.size(),o=0;o<1e3;){if(e>=r)return;if(o++>1e3)return;if((n=t.pop()).count()){var a=i(c,n),u=a[0],s=a[1];if(!u)return;t.push(u),s&&(t.push(s),e++)}else t.push(n),o++}}h.push(s),f(h,.75*u);for(var v=new n(function(r,n){return t.naturalOrder(r.count()*r.volume(),n.count()*n.volume())});h.size();)v.push(h.pop());f(v,u);for(var l=new o;v.size();)l.push(v.pop());return l}}}().quantize,n=function(t){"CANVAS"===t.nodeName?(this.canvas=t,this.context=t.getContext("2d"),this.width=t.width,this.height=t.height):"VIDEO"===t.nodeName?(this.canvas=document.createElement("canvas"),this.context=this.canvas.getContext("2d"),this.width=this.canvas.width=video.videoWidth,this.height=this.canvas.height=t.videoHeight,this.context.drawImage(t,0,0,this.width,this.height)):(this.canvas=document.createElement("canvas"),this.context=this.canvas.getContext("2d"),this.width=this.canvas.width=t.naturalWidth,this.height=this.canvas.height=t.naturalHeight,this.context.drawImage(t,0,0,this.width,this.height))};n.prototype.getImageData=function(){return this.context.getImageData(0,0,this.width,this.height)};var e=function(){};e.prototype.getColor=function(t,r){return void 0===r&&(r=10),this.getPalette(t,5,r)[0]},e.prototype.getPalette=function(t,e,o){var i=function(t){var r=t.colorCount,n=t.quality;if(void 0!==r&&Number.isInteger(r)){if(1===r)throw new Error("colorCount should be between 2 and 20. To get one color, call getColor() instead of getPalette()");r=Math.max(r,2),r=Math.min(r,20)}else r=10;return(void 0===n||!Number.isInteger(n)||n<1)&&(n=10),{colorCount:r,quality:n}}({colorCount:e,quality:o}),a=new n(t),u=function(t,r,n){for(var e,o,i,a,u,c=t,s=[],h=0;h<r;h+=n)o=c[0+(e=4*h)],i=c[e+1],a=c[e+2],(void 0===(u=c[e+3])||u>=125)&&(o>250&&i>250&&a>250||s.push([o,i,a]));return s}(a.getImageData().data,a.width*a.height,i.quality),c=r(u,i.colorCount);return c?c.palette():null},e.prototype.getColorFromUrl=function(t,r,n){var e=this,o=document.createElement("img");o.addEventListener("load",function(){var i=e.getPalette(o,5,n);r(i[0],t)}),o.src=t},e.prototype.getImageData=function(t,r){var n=new XMLHttpRequest;n.open("GET",t,!0),n.responseType="arraybuffer",n.onload=function(){if(200==this.status){var t=new Uint8Array(this.response);i=t.length;for(var n=new Array(i),e=0;e<t.length;e++)n[e]=String.fromCharCode(t[e]);var o=n.join(""),a=window.btoa(o);r("data:image/png;base64,"+a)}},n.send()},e.prototype.getColorAsync=function(t,r,n){var e=this;this.getImageData(t,function(t){var o=document.createElement("img");o.addEventListener("load",function(){var t=e.getPalette(o,5,n);r(t[0],this)}),o.src=t})};export default e;
