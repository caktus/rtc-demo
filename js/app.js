var servers = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]},
    config = {optional: [{RtpDataChannels: true}]};

var GameView = Backbone.View.extend({
    el: '#game',
    events: {
        "click .box": "pickBox"
    },
    initialize: function (options) {
        this.leader = options.leader;
        this.channel = options.channel;
        this.channel.onmessage = _.bind(this.gotMessage, this);
        this.piece = this.leader ? '#CD0000' : '#00688B';
        this.other = this.leader ? '#00688B' : '#CD0000';
        this.turn = this.leader;
        $('.color', this.$el).css('background-color', this.piece);
        if (this.turn) {
            this.status('It is your turn.');
        } else {
            this.status('Waiting on other player.');
        }
        this.createNewBoard();
        this.$el.fadeIn();
    },
    createNewBoard: function() {
        var i = 0, box;
        this.board = $('#board', this.$el);
        this.board.html('');
        for (i = 0; i < 9; i++) {
            this.board.append($('<div>', {'id': 'box-' + i + 1}).addClass('box'));
        }
    },
    gotMessage: function (e) {
        var data = e.data, box;
        console.log("Got game message " + data);
        if (!this.turn) {
            box = $('#' + data);
            if (!box.text()) {
                box.css('background-color', this.other);
                this.turn = true;
                this.status('It is your turn.');
            }
        }
    },
    send: function(message) {
        this.channel.send(message);
    },
    pickBox: function (e) {
        var box;
        e.preventDefault();
        if (this.turn) {
            box = $(e.target);
            if (!box.text()) {
                box.css('background-color', this.piece);
                this.turn = false;
                this.status('Waiting on other player.');
                this.send(box.attr('id'));
            }            
        }
    },
    status: function (message) {
        $('.status', this.$el).html(message);
    }
});

var AppRouter = Backbone.Router.extend({
    routes: {
        "": "homePage",
        "offer-:offer": "acceptOffer",
        "answer-:answer": "acceptAnswer",
        "game-:id": "viewGame"
    },
    initialize: function () {
        this.sender = new RTCPeerConnection(servers, config);
        this.sender.onconnection = _.bind(this.gotNewConnection, this);
        this.receiver = new RTCPeerConnection(servers, config);
        this.channel = null;
        this.localOffer = null; 
        this.remoteOfffer = null;
        this.game_id = null;
        this.game = null;
        this.leader = true;
        getUserMedia({audio:true, video:false, fake: true},
            _.bind(this.gotLocalStream, this), _.bind(this.reportFailure, this));
    },
    homePage: function () {
        var hash = window.btoa(JSON.stringify(this.localOffer));
        $('#home .status').text('Creating a new game...');
        $('#offer').attr('href', window.location.href + '#offer-' + hash);
        $('#offer').show();
    },
    acceptOffer: function (offer) {
        this.leader = false;
        $('#home .status').text('Joining an existing game...');
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
        $('#offer').hide();
        $('#home .status').text('Establishing remote connection...');
    },
    viewGame: function (id) {
        this.game_id = id;
        $('#home').hide();
        this.game = new GameView({leader: this.leader, channel: this.channel});
    },
    gotLocalStream: function (stream) {
        console.log("Got local stream.");
        this.sender.addStream(stream);
        this.channel = this.sender.createDataChannel('game', {reliable:false});
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
        var data = e.data
        console.log("Got message", data);
        if (!this.game) {
            // First message when the peer connects in the game id
            this.game_id = data;
            this.navigate('game-' + this.game_id, {trigger: true});
        }
    },
    gotNewConnection: function (e) {
        console.log('New connection');
        this.game_id = Math.random().toString(36).substring(7);
        this.channel.send(this.game_id);
        this.navigate('game-' + this.game_id, {trigger: true});
    }
});

$(document).ready(function () {
    var router = new AppRouter();
});