var y=Object.defineProperty,S=Object.defineProperties;var E=Object.getOwnPropertyDescriptors;var g=Object.getOwnPropertySymbols;var P=Object.prototype.hasOwnProperty,R=Object.prototype.propertyIsEnumerable;var f=(i,n,e)=>n in i?y(i,n,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[n]=e,k=(i,n)=>{for(var e in n||(n={}))P.call(n,e)&&f(i,e,n[e]);if(g)for(var e of g(n))R.call(n,e)&&f(i,e,n[e]);return i},p=(i,n)=>S(i,E(n)),a=(i,n)=>y(i,"name",{value:n,configurable:!0});var m="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",K=[...m];function v(i){let n=[];for(let e=0;e<i.length/4;e++){let r=[...i.slice(4*e,4*e+4)].map(o=>K.indexOf(o).toString(2).padStart(6,"0")).join("").match(/.{1,8}/g).map(o=>+("0b"+o));n.push(...r.slice(0,3-(i[4*e+2]=="="?1:0)-(i[4*e+3]=="="?1:0)))}return n}a(v,"base64ToBytesArr");function w(i){let n=a(s=>s.toString(2).padStart(8,"0"),"bin"),e=i.length,t="";for(let s=0;s<=(e-1)/3;s++){let r=s*3+1>=e,o=s*3+2>=e,c=(n(i[3*s])+n(r?0:i[3*s+1])+n(o?0:i[3*s+2])).match(/.{1,6}/g).map((l,b)=>b==3&&o||b==2&&r?"=":m[+("0b"+l)]);t+=c.join("")}return t}a(w,"bytesArrToBase64");var u=class extends EventTarget{on(n,e){return this.addEventListener(n,e)}once(n,e){return this.addEventListener(n,e,{once:!0})}off(n,e){return this.removeEventListener(n,e)}fire(n,e){return this.dispatchEvent(new CustomEvent(n,{detail:e,cancelable:!0}))}};a(u,"EventEmitter");function x(){return Math.random().toString(32)}a(x,"generateRid");async function O(i,n,e){let s=new TextEncoder().encode(i),r=v(e),o=Uint8Array.from([...s,...r]),d=v(n),c=await crypto.subtle.importKey("raw",o,{name:"HMAC",hash:{name:"SHA-256"}},!1,["sign","verify"]),l=await crypto.subtle.sign("HMAC",c,Uint8Array.from(d));return w(Array.from(new Uint8Array(l)))}a(O,"authChallenge");var h=class extends u{constructor(e="ws://localhost:4337/ws",t){super();this.address=e,this.pending={},this.keySubscriptions={},this.prefixSubscriptions={},this.options=t||{reconnect:!0}}reconnect(){this.connect()}close(){this.options.reconnect=!1,this.socket.close()}async connect(){this.socket=new WebSocket(this.address),this.socket.addEventListener("open",this.open.bind(this)),this.socket.addEventListener("message",this.received.bind(this)),this.socket.addEventListener("close",this.closed.bind(this)),this.socket.addEventListener("error",this.errored.bind(this)),await this.wait()}wait(){return new Promise(e=>{if(this.socket.readyState===this.socket.OPEN){e();return}this.once("open",()=>e())})}async open(){var e;if(console.info("connected to server"),this.options.password)try{await this.authWithPassword(this.options.password)}catch(t){this.fire("error",t),this.close()}else if(this.options.interactive)try{await this.authInteractive((e=this.options.interactiveData)!=null?e:{})}catch(t){this.fire("error",t),this.close()}this.resubscribe(),this.fire("open"),this.fire("stateChange",this.socket.readyState)}closed(e){console.warn(`lost connection to server: ${e.reason}`),this.fire("close",e),this.fire("stateChange",this.socket.readyState),this.options.reconnect&&setTimeout(()=>this.reconnect(),5e3)}errored(e){this.fire("error",e)}received(e){e.data.split(`
`).map(s=>s.trim()).filter(s=>s.length>0).forEach(s=>{let r=JSON.parse(s!=null?s:'""');if("error"in r){this.fire("error",r),"request_id"in r&&r.request_id in this.pending&&(this.pending[r.request_id](r),delete this.pending[r.request_id]);return}switch(r.type){case"response":r.request_id in this.pending?(this.pending[r.request_id](r),delete this.pending[r.request_id]):console.warn("Received a response for an unregistered request: ",r);break;case"push":{r.key in this.keySubscriptions&&this.keySubscriptions[r.key].forEach(o=>o(r.new_value,r.key)),Object.entries(this.prefixSubscriptions).filter(([o])=>r.key.startsWith(o)).forEach(([o,d])=>{d.forEach(c=>c(r.new_value,r.key))});break}default:}})}async authWithPassword(e){let t=await this.send({command:"klogin",data:{auth:"challenge"}});if("error"in t)throw console.error("kilovolt auth error:",t.error),new Error(t.error);let s=await O(e!=null?e:"",t.data.challenge,t.data.salt),r=await this.send({command:"kauth",data:{hash:s}});if("error"in r)throw console.error("kilovolt auth error:",r.error),new Error(r.error)}async authInteractive(e){let t=await this.send({command:"klogin",data:p(k({},e),{auth:"ask"})});if("error"in t)throw console.error("kilovolt auth error:",t.error),new Error(t.error)}async resubscribe(){for(let e in this.keySubscriptions)await this.send({command:"ksub",data:{key:e}});for(let e in this.prefixSubscriptions)this.send({command:"ksub-prefix",data:{prefix:e}})}send(e){if(this.socket.readyState!==this.socket.OPEN)throw new Error("Not connected to server");let t=p(k({},e),{request_id:"request_id"in e?e.request_id:x()});return new Promise(s=>{let r=JSON.stringify(t);this.socket.send(r),this.pending[t.request_id]=s})}putKey(e,t){return this.send({command:"kset",data:{key:e,data:t}})}putKeys(e){return this.send({command:"kset-bulk",data:e})}putJSON(e,t){return this.send({command:"kset",data:{key:e,data:JSON.stringify(t)}})}putJSONs(e){let t={};return Object.entries(e).forEach(([s,r])=>{t[s]=JSON.stringify(r)}),this.send({command:"kset-bulk",data:t})}async getKey(e){let t=await this.send({command:"kget",data:{key:e}});if("error"in t)throw new Error(t.error);return t.data}async getKeys(e){let t=await this.send({command:"kget-bulk",data:{keys:e}});if("error"in t)throw new Error(t.error);return t.data}async getKeysByPrefix(e){let t=await this.send({command:"kget-all",data:{prefix:e}});if("error"in t)throw new Error(t.error);return t.data}async getJSON(e){let t=await this.send({command:"kget",data:{key:e}});if("error"in t)throw new Error(t.error);return JSON.parse(t.data)}async getJSONs(e){let t=await this.send({command:"kget-bulk",data:{keys:e}});if("error"in t)throw new Error(t.error);let s={};return Object.entries(t.data).forEach(([r,o])=>{s[r]=JSON.parse(o)}),s}subscribeKey(e,t){return e in this.keySubscriptions?this.keySubscriptions[e].push(t):this.keySubscriptions[e]=[t],this.send({command:"ksub",data:{key:e}})}async unsubscribeKey(e,t){if(!(e in this.keySubscriptions))return console.warn(`Trying to unsubscribe from key "${e}" but no subscriptions could be found!`),!1;let s=this.keySubscriptions[e].findIndex(r=>r===t);if(s<0)return console.warn(`Trying to unsubscribe from key "${e}" but specified function is not in the subscribers!`),!1;if(this.keySubscriptions[e].splice(s,1),this.keySubscriptions[e].length<1){let r=await this.send({command:"kunsub",data:{key:e}});return"error"in r&&console.warn(`unsubscribe failed: ${r.error}`),r.ok}return!0}subscribePrefix(e,t){return e in this.keySubscriptions?this.prefixSubscriptions[e].push(t):this.prefixSubscriptions[e]=[t],this.send({command:"ksub-prefix",data:{prefix:e}})}async unsubscribePrefix(e,t){if(!(e in this.prefixSubscriptions))return console.warn(`Trying to unsubscribe from prefix "${e}" but no subscriptions could be found!`),!1;let s=this.prefixSubscriptions[e].findIndex(r=>r===t);if(s<0)return console.warn(`Trying to unsubscribe from key "${e}" but specified function is not in the subscribers!`),!1;if(this.prefixSubscriptions[e].splice(s,1),this.prefixSubscriptions[e].length<1){let r=await this.send({command:"kunsub-prefix",data:{prefix:e}});return"error"in r&&console.warn(`unsubscribe failed: ${r.error}`),r.ok}return!0}async keyList(e){let t=await this.send({command:"klist",data:{prefix:e!=null?e:""}});if("error"in t)throw new Error(t.error);return t.data}async deleteKey(e){let t=await this.send({command:"kdel",data:{key:e}});if("error"in t)throw new Error(t.error);return t.data}};a(h,"Kilovolt");var A=h;export{h as Kilovolt,A as default};
//# sourceMappingURL=kilovolt.js.map
