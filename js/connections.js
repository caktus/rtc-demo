var servers = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]},
    config = {optional: [{RtpDataChannels: true}]},
    sender = new RTCPeerConnection(servers, config),
    receiver = new RTCPeerConnection(servers, config);
    senderChannel = null, receiverChannel = null, doNothing = function () {},
    localOffer = null, remoteAnswer = null;

sender.onicecandidate = function (event) {
    if (event.candidate) {
        receiver.addIceCandidate(new RTCIceCandidate(event.candidate));
        // console.log("Local ICE candidate: \n" + event.candidate.candidate);
    }
}

sender.onconnection = function (e) {
    // console.log("Datachannel connected (sender)", e);
    if (senderChannel) {
        senderChannel.send('Welcome Peer Connection!');
    }
};

receiver.onicecandidate = function (event){
    if (event.candidate) {
        sender.addIceCandidate(new RTCIceCandidate(event.candidate));
        // console.log("Remote ICE candidate: \n " + event.candidate.candidate);
    }
}

receiver.ondatachannel = function (e) {
    receiverChannel = e.channel || e; // Chrome sends event, FF sends raw channel
    // console.log("Received datachannel", arguments);
    receiverChannel.onmessage = function (e) {
        console.log("Got message (receiver)", e.data);
        receiverChannel.send('Reply!');
    };
};

receiver.onaddstream = function (e) {
    // console.log("Got remote stream", e);
    var el = new Audio();
    el.autoplay = true;
    attachMediaStream(el, e.stream);
};

receiver.onconnection = function (e) {
    // console.log("Datachannel connected (receiver)", e);
};

function gotStream(stream) {
    sender.addStream(stream);
    senderChannel = sender.createDataChannel('test', {reliable:false});
    senderChannel.onmessage = function (e) {
        console.log("Got message (sender)", e.data);
    };

    sender.createOffer(function (offerDesc) {
        sender.setLocalDescription(offerDesc);
        // console.log("Created local offer.");
        localOffer = window.btoa(JSON.stringify(offerDesc));
        var hash = getHash();
        if (hash) {
            remoteAnswer = hash;
            var offer = new RTCSessionDescription(JSON.parse(window.atob(remoteAnswer)));
            receiver.setRemoteDescription(offer);
            receiver.createAnswer(function (answerDesc) {
                receiver.setLocalDescription(answerDesc);
                // console.log("Created Answer");
                remoteAnswer = window.btoa(JSON.stringify(answerDesc));
                window.location.hash = '#' + remoteAnswer;
            }, doNothing);
        } else {
            window.location.hash = '#' + localOffer;
        }
    }, doNothing);
}

function getHash() {
    if (window.location.hash) {
        return window.location.hash.substring(1);
    }
    return '';
}

window.onhashchange = function () {
    if (window.location.hash) {
        var hash = window.location.hash.substring(1);
        if (localOffer && !remoteAnswer && hash !== localOffer) {
            // This is the remoteOffer
            remoteAnswer = hash;
            var answer = new RTCSessionDescription(JSON.parse(window.atob(remoteAnswer)));
            sender.setRemoteDescription(answer);
        }
    }
}

getUserMedia({audio:true, video:false, fake: true}, gotStream, doNothing);