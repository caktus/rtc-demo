var servers = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]},
    config = {optional: [{RtpDataChannels: true}]};

var AppRouter = Backbone.Router.extend({
    routes: {
        "": "homePage",
        "offer-:offer": "acceptOffer",
        "answer-:answer": "acceptAnswer"
    },
    initialize: function () {
        this.sender = new RTCPeerConnection(servers, config);
        this.sender.onconnection = _.bind(this.gotNewConnection, this);
        this.receiver = new RTCPeerConnection(servers, config);
        this.channel = null;
        this.localOffer = null; 
        this.remoteOfffer = null;
        getUserMedia({audio:true, video:false, fake: true},
            _.bind(this.gotLocalStream, this), _.bind(this.reportFailure, this));
    },
    homePage: function () {
        var hash = window.btoa(JSON.stringify(this.localOffer));
        $('#home #status').text('Creating a new bin...');
        $('#offer').attr('href', window.location.href + '#offer-' + hash);
        $('#offer').show();
        $('#home').hide();
        $('#bin').fadeIn();
    },
    acceptOffer: function (offer) {
        $('#home #status').text('Joining an existing bin...');
        this.receiver.onaddstream = _.bind(this.gotRemoteStream, this);
        this.receiver.ondatachannel = _.bind(this.gotDataChannel, this);
        this.remoteOfffer = new RTCSessionDescription(JSON.parse(window.atob(offer)));
        this.receiver.setRemoteDescription(this.remoteOfffer);
        this.receiver.onicecandidate = _.bind(this.addIceCandidate, this, this.sender);
        this.receiver.createAnswer(_.bind(this.gotLocalAnswer, this), _.bind(this.reportFailure, this));
    },
    acceptAnswer: function (answer) {
        console.log("Accepted answer");
        this.remoteOfffer = new RTCSessionDescription(JSON.parse(window.atob(answer)));
        this.sender.setRemoteDescription(this.remoteOfffer);
        this.sender.onicecandidate = _.bind(this.addIceCandidate, this, this.receiver);
    },
    gotLocalStream: function (stream) {
        console.log("Got local stream.");
        this.sender.addStream(stream);
        this.channel = this.sender.createDataChannel('bin', {reliable:false});
        this.channel.onmessage = _.bind(this.gotMessage, this);
        this.sender.createOffer(_.bind(this.gotLocalOffer, this), _.bind(this.reportFailure, this));
    },
    reportFailure: function () {

    },
    addIceCandidate: function (connection, e) {
        console.log('ICE callback');
        if (connection && e.candidate) {
            connection.addIceCandidate(new RTCIceCandidate(e.candidate));
        }
    },
    gotLocalOffer: function (offerDesc) {
        console.log("Created local offer.");
        this.localOffer = offerDesc;
        this.sender.setLocalDescription(offerDesc);
        Backbone.history.start();
    },
    gotLocalAnswer: function (answerDesc) {
        var hash = window.btoa(JSON.stringify(answerDesc));
        console.log("Created Answer");
        this.receiver.setLocalDescription(answerDesc);
        $('#answer').attr('href', window.location.origin + window.location.pathname + '#answer-' + hash);
        $('#answer').show();
    },
    gotRemoteStream: function (e) {
        console.log("Got remote stream");
        var el = new Audio();
        el.autoplay = true;
        attachMediaStream(el, e.stream);
    },
    gotDataChannel: function (e) {
        this.channel = e.channel || e;
        this.channel.onmessage = _.bind(this.gotMessage, this);
    },
    gotMessage: function (e) {
        console.log("Got message", e.data);
    },
    gotNewConnection: function (e) {
        console.log('New connection');
        this.send('Welome!');
    },
    send: function(message) {
        this.channel.send(message);
    }
});

$(document).ready(function () {
    var router = new AppRouter();
});