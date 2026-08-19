/* X's & O's — caches the game so it plays with no connection. */
var CACHE = "xsandos-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

// origins worth keeping a copy of, so the lettering survives offline too
var FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    // don't let one missing file abort the whole install
    return Promise.all(ASSETS.map(function(u){
      return c.add(u)["catch"](function(){});
    }));
  }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){
      if(k !== CACHE) return caches.delete(k);
    }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if(hit) return hit;
      return fetch(e.request).then(function(res){
        var url = new URL(e.request.url);
        var keep = url.origin === self.location.origin ||
                   FONT_HOSTS.indexOf(url.hostname) >= 0;
        if(res && keep && (res.ok || res.type === "opaque")){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      })["catch"](function(){
        // offline: serve the game for page loads, fail quietly for anything else
        if(e.request.mode === "navigate") return caches.match("./index.html");
        return new Response("", {status: 504, statusText: "offline"});
      });
    })
  );
});
