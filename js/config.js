// SortCraft — network settings for the standalone (GitHub Pages) build.
// By default players find each other through the free public PeerJS broker (0.peerjs.com),
// then connect browser-to-browser over WebRTC. To use your own PeerServer, fill in PEER below,
// e.g. {host:'my-peer-server.example.com', port:443, path:'/', secure:true}.
// For local testing you can also add ?peerhost=localhost:9000 to the page URL.
(function(){const SC=globalThis.SC=globalThis.SC||{};
 SC.PEER=null;
 SC.ICE=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}];
 // Players behind strict firewalls may need a TURN relay. Add one here if friends can't connect, e.g.
 // SC.ICE.push({urls:'turn:your.turn.server:3478',username:'user',credential:'pass'});
})();
